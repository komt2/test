/* Silver River — the living pixel world: 320x180 scenes, actors, lighting, weather.
   Backgrounds are painted once per (scene, season, time) into an offscreen canvas; animated bits
   (lanterns, water, clouds, particles, people, animals) are drawn every frame. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const PX = G.PX;
  const U = G.U;
  const WW = 320, WH = 180;
  const Wd = (G.World = {});
  Wd.W = WW;
  Wd.H = WH;

  // ---------------------------------------------------------------- colours
  const C = {
    roof: ['#2e3444', '#3f4759', '#535d72', '#707b91'],
    roofGold: ['#8a5a1a', '#c28a2c', '#e0ad44', '#f5d27a'],
    wall: ['#b8a383', '#d6c3a5', '#e9dbc2', '#f5ecdb'],
    wood: ['#4a2819', '#6b3a26', '#945536', '#bd7a4f'],
    red: ['#6e1c22', '#9c2a30', '#c43f3c', '#e3614f'],
    stone: ['#8f8472', '#b0a48c', '#c9bea6', '#ddd4c0'],
    grass: ['#3f6e3c', '#5a8f4c', '#7db362', '#a3d27f'],
    water: ['#2f6f9f', '#4b8fbf', '#6fb0d8', '#bfe6f7'],
    gold: ['#8a5a1a', '#d19a35', '#f2c14e', '#fff0a8'],
    lantern: ['#7a1c1c', '#c9302c', '#ee5a3c', '#ffb46a'],
  };
  const FOL = {
    spring: ['#b84d74', '#e57fa0', '#f7a8c0', '#fde0ea'],
    summer: ['#2f6e3c', '#4f8c49', '#6fae5f', '#9ccc7a'],
    autumn: ['#8f3a1c', '#c95a2e', '#e9913a', '#f4c04e'],
    winter: ['#b83a4a', '#e0485e', '#ffffff', '#ffffff'],
  };
  const SKY = {
    day: {
      spring: ['#7fbde9', '#a9d6f2', '#d2e9f6', '#f6e6ee'],
      summer: ['#5eaee6', '#8ccaf0', '#bde2f6', '#eaf7fb'],
      autumn: ['#7fb2da', '#b6d2e2', '#efd9c0', '#f9e6cf'],
      winter: ['#9fb6d4', '#c3d2e6', '#dfe7f2', '#f3f5fa'],
    },
    dusk: ['#3f3f7f', '#7a5a8f', '#d98a86', '#f7c08a'],
    night: ['#0e1230', '#161d45', '#212a5c', '#2f3470'],
  };

  // ---------------------------------------------------------------- painting helpers
  function sky(g, tod, season, y1 = 120) {
    const st = tod === 'day' ? SKY.day[season] || SKY.day.spring : SKY[tod];
    PX.gradient(g, 0, 0, WW, y1, st);
  }
  function starsLayer(g, seed, y1) {
    const r = PX.rng(seed);
    for (let i = 0; i < 120; i++) {
      const x = Math.floor(r() * WW), y = Math.floor(r() * y1);
      PX.dot(g, x, y, r() < 0.2 ? '#fff6c8' : r() < 0.5 ? '#c9d2ff' : '#8f9ad8');
    }
    // the Silver River: a dithered band of faint stars
    for (let x = 0; x < WW; x++) {
      const cy = 70 - x * 0.18 + Math.sin(x * 0.05) * 6;
      for (let k = -9; k <= 9; k++) {
        const y = Math.round(cy + k);
        if (y < 0 || y >= y1) continue;
        const d = 1 - Math.abs(k) / 10;
        if (r() < d * 0.35) PX.dot(g, x, y, r() < 0.5 ? '#3d4a86' : '#566399');
        if (r() < d * 0.08) PX.dot(g, x, y, '#e9ecff');
      }
    }
  }
  function mountains(g, seed, baseY, cols, amp) {
    const r = PX.rng(seed);
    cols.forEach((col, li) => {
      let h = 0, v = 0;
      const y0 = baseY + li * 10;
      for (let x = 0; x < WW; x++) {
        v += (r() - 0.5) * 0.9 - h * 0.012;
        v = Math.max(-1.6, Math.min(1.6, v));
        h = Math.max(-amp + li * 6, Math.min(amp - li * 5, h + v));
        const top = Math.round(y0 - Math.abs(h) - li * 2);
        PX.vline(g, x, top, WH, col);
      }
    });
  }
  function cloud(g, x, y, w, col, shade) {
    PX.ellipse(g, x, y, w * 0.5, 4, col);
    PX.ellipse(g, x - w * 0.18, y - 3, w * 0.25, 4, col);
    PX.ellipse(g, x + w * 0.15, y - 4, w * 0.22, 5, col);
    PX.hline(g, x - w * 0.45, x + w * 0.45, y + 3, shade);
  }
  // Chinese roof with upturned eaves
  function roof(g, x, y, w, h, cols = C.roof) {
    for (let i = 0; i < h; i++) {
      const u = i / Math.max(1, h - 1);
      const inset = Math.round((1 - u) * 6);
      const lift = i === h - 1 ? 0 : 0;
      PX.hline(g, x + inset - Math.round(u * 5), x + w - inset + Math.round(u * 5), y + i + lift, i % 3 === 2 ? cols[1] : cols[2]);
    }
    // tile columns
    for (let tx = x + 2; tx < x + w; tx += 4) PX.vline(g, tx, y + 1, y + h - 2, cols[1]);
    // ridge and upturned tips
    PX.hline(g, x + 3, x + w - 3, y - 1, cols[0]);
    PX.hline(g, x + 4, x + w - 4, y - 2, cols[0]);
    PX.rect(g, x + 1, y - 4, 2, 3, cols[0]);
    PX.rect(g, x + w - 3, y - 4, 2, 3, cols[0]);
    // eave line
    PX.hline(g, x - 5, x + w + 5, y + h, cols[0]);
    PX.dot(g, x - 6, y + h - 1, cols[0]);
    PX.dot(g, x + w + 6, y + h - 1, cols[0]);
    PX.hline(g, x + 4, x + w - 4, y + 1, cols[3]);
  }
  function lattice(g, x, y, w, h, frame = C.wood[1], paper = '#f4ead6') {
    PX.rect(g, x, y, w, h, paper);
    for (let yy = y + 3; yy < y + h; yy += 4) PX.hline(g, x, x + w - 1, yy, frame);
    for (let xx = x + 3; xx < x + w; xx += 4) PX.vline(g, xx, y, y + h - 1, frame);
    PX.rect(g, x - 1, y - 1, w + 2, 1, C.wood[0]);
    PX.rect(g, x - 1, y + h, w + 2, 1, C.wood[0]);
    PX.rect(g, x - 1, y, 1, h, C.wood[0]);
    PX.rect(g, x + w, y, 1, h, C.wood[0]);
  }
  function pillar(g, x, y, h) {
    PX.rect(g, x, y, 4, h, C.red[2]);
    PX.vline(g, x, y, y + h - 1, C.red[3]);
    PX.vline(g, x + 3, y, y + h - 1, C.red[1]);
    PX.rect(g, x - 1, y + h - 2, 6, 2, C.stone[1]);
  }
  function tree(g, x, y, sc, season, seed) {
    const r = PX.rng(seed);
    const f = FOL[season];
    // trunk and branches
    PX.rect(g, x - 2, y - Math.round(28 * sc), 4, Math.round(28 * sc), C.wood[1]);
    PX.vline(g, x - 2, y - Math.round(28 * sc), y, C.wood[2]);
    PX.line(g, x, y - 18 * sc, x - 14 * sc, y - 34 * sc, C.wood[1]);
    PX.line(g, x, y - 22 * sc, x + 16 * sc, y - 38 * sc, C.wood[1]);
    PX.line(g, x, y - 26 * sc, x + 2 * sc, y - 44 * sc, C.wood[1]);
    if (season === 'winter') {
      PX.line(g, x - 1, y - 18 * sc - 1, x - 14 * sc, y - 35 * sc, '#ffffff');
      PX.line(g, x + 1, y - 22 * sc - 1, x + 16 * sc, y - 39 * sc, '#ffffff');
      for (let i = 0; i < 22; i++) {
        const a = r() * Math.PI * 2, d = r() * 22 * sc;
        PX.dot(g, x + Math.cos(a) * d * 1.2, y - 36 * sc + Math.sin(a) * d * 0.7, r() < 0.7 ? f[1] : f[0]);
      }
      return;
    }
    const blobs = [];
    for (let i = 0; i < 12; i++) {
      const a = r() * Math.PI * 2, d = r() * 18 * sc;
      blobs.push([x + Math.cos(a) * d * 1.3, y - 38 * sc + Math.sin(a) * d * 0.7, (6 + r() * 5) * sc]);
    }
    blobs.forEach(([bx, by, br]) => PX.disc(g, bx, by + 1, br, f[0]));
    blobs.forEach(([bx, by, br]) => PX.disc(g, bx, by, br - 1, f[1]));
    blobs.forEach(([bx, by, br]) => PX.disc(g, bx - 1, by - 1, Math.max(1, br - 3), f[2]));
    for (let i = 0; i < 18; i++) PX.dot(g, x + (r() - 0.5) * 40 * sc, y - 38 * sc + (r() - 0.5) * 22 * sc, f[3]);
  }
  function bamboo(g, x, y, h, season) {
    const col = season === 'winter' ? ['#6e8f6a', '#8fb08a'] : ['#3f7a3c', '#6fae5f'];
    PX.rect(g, x, y - h, 3, h, col[0]);
    PX.vline(g, x + 1, y - h, y, col[1]);
    for (let yy = y - h + 6; yy < y; yy += 9) PX.hline(g, x - 1, x + 3, yy, '#2f5a2c');
    for (let yy = y - h + 4; yy < y - 8; yy += 12) {
      PX.line(g, x + 3, yy, x + 10, yy - 4, col[0]);
      PX.line(g, x, yy + 5, x - 7, yy + 2, col[0]);
    }
  }
  function lanternStatic(g, x, y) {
    PX.vline(g, x + 2, y - 4, y - 1, C.wood[0]);
    PX.rect(g, x, y, 5, 1, C.gold[1]);
    PX.rect(g, x - 1, y + 1, 7, 5, C.lantern[1]);
    PX.rect(g, x, y + 1, 5, 5, C.lantern[2]);
    PX.vline(g, x + 1, y + 2, y + 4, C.lantern[3]);
    PX.rect(g, x, y + 6, 5, 1, C.gold[1]);
    PX.vline(g, x + 2, y + 7, y + 9, C.gold[2]);
  }
  function banner(g, x, y, col, ch) {
    PX.rect(g, x, y, 9, 22, col);
    PX.rect(g, x + 1, y + 1, 7, 20, U2(col, 0.08));
    PX.hline(g, x - 1, x + 9, y - 1, C.wood[1]);
    if (ch) {
      g.fillStyle = '#fff3d6';
      g.font = '8px "DotGothic16", monospace';
      g.textBaseline = 'top';
      g.fillText(ch, x + 1, y + 7);
    }
  }
  const U2 = (hex, dl) => G.U.tone(hex, dl);
  function ground(g, y, season, kind = 'stone') {
    if (kind === 'grass') {
      PX.rect(g, 0, y, WW, WH - y, season === 'winter' ? '#e9eef6' : season === 'autumn' ? '#b5a55a' : C.grass[2]);
      const r = PX.rng(7);
      for (let i = 0; i < 260; i++) {
        const x = Math.floor(r() * WW), yy = y + Math.floor(r() * (WH - y));
        PX.dot(g, x, yy, season === 'winter' ? '#ffffff' : season === 'autumn' ? '#8f7f3f' : r() < 0.5 ? C.grass[1] : C.grass[3]);
      }
      return;
    }
    PX.rect(g, 0, y, WW, WH - y, season === 'winter' ? '#e4e9f2' : C.stone[2]);
    for (let yy = y + 3; yy < WH; yy += 7) {
      PX.hline(g, 0, WW, yy, season === 'winter' ? '#d3dae6' : C.stone[1]);
      const off = ((yy - y) / 7) % 2 ? 6 : 0;
      for (let xx = off; xx < WW; xx += 13) PX.vline(g, xx, yy - 6, yy, season === 'winter' ? '#d3dae6' : C.stone[1]);
    }
    if (season === 'winter') {
      const r = PX.rng(3);
      for (let i = 0; i < 120; i++) PX.dot(g, r() * WW, y + r() * (WH - y), '#ffffff');
    }
  }
  function house(g, x, y, w, h, opt = {}) {
    // walls
    PX.rect(g, x, y, w, h, C.wall[2]);
    PX.rect(g, x, y + h - 3, w, 3, C.stone[1]);
    PX.hline(g, x, x + w - 1, y, C.wall[1]);
    PX.hline(g, x, x + w - 1, y + 1, C.wall[1]);
    if (opt.door) {
      const dx = x + Math.round(w / 2) - 8;
      PX.rect(g, dx, y + h - 26, 16, 23, C.red[1]);
      PX.rect(g, dx + 1, y + h - 25, 7, 22, C.red[2]);
      PX.rect(g, dx + 8, y + h - 25, 7, 22, C.red[2]);
      PX.dot(g, dx + 6, y + h - 14, C.gold[2]);
      PX.dot(g, dx + 9, y + h - 14, C.gold[2]);
    }
    if (opt.windows) opt.windows.forEach(([wx, wy, ww, wh]) => lattice(g, x + wx, y + wy, ww, wh));
    if (opt.pillars) opt.pillars.forEach((px) => pillar(g, x + px, y, h - 2));
    roof(g, x - 4, y - (opt.roofH || 12), w + 8, opt.roofH || 12, opt.roofCols);
  }
  function moonGate(g, cx, by, r) {
    PX.disc(g, cx, by - r, r + 3, C.wall[1]);
    PX.disc(g, cx, by - r, r, '#00000000');
  }

  // ---------------------------------------------------------------- scenes
  const S = {};
  // each painter returns { lanterns: [[x,y]], water: [x,y,w,h], spots: {name:[x,y]} }
  S.home = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 110);
    if (tod === 'night') starsLayer(g, 5, 90);
    else { cloud(g, 60, 24, 40, '#ffffff', '#dfe9f3'); cloud(g, 240, 16, 30, '#ffffff', '#dfe9f3'); }
    mountains(g, 11, 78, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b3c6db', '#98b0c9'], 16);
    // back wall of the courtyard
    PX.rect(g, 0, 80, WW, 30, C.wall[2]);
    for (let x = 0; x < WW; x += 16) PX.vline(g, x, 82, 108, C.wall[1]);
    roof(g, -6, 72, WW + 12, 8);
    // main hall
    house(g, 70, 70, 180, 50, { door: true, windows: [[12, 14, 34, 24], [134, 14, 34, 24]], pillars: [2, 60, 116, 174], roofH: 16 });
    // New Year in winter: red couplets by the door, a banner above it and 福 on it
    if (season === 'winter') {
      [147, 169].forEach((cx) => {
        PX.rect(g, cx, 95, 4, 21, C.red[2]);
        PX.vline(g, cx, 95, 115, C.red[1]);
        for (let i = 0; i < 5; i++) PX.dot(g, cx + 2, 97 + i * 4, C.gold[2]);
      });
      PX.rect(g, 149, 90, 22, 3, C.red[2]);
      for (let i = 0; i < 4; i++) PX.dot(g, 153 + i * 4, 91, C.gold[2]);
      for (let dy = -3; dy <= 3; dy++) {
        const w = 3 - Math.abs(dy);
        for (let dx = -w; dx <= w; dx++) PX.dot(g, 160 + dx, 101 + dy, Math.abs(dx) + Math.abs(dy) === 3 ? C.gold[2] : C.red[3]);
      }
      PX.dot(g, 160, 101, C.gold[1]);
      PX.dot(g, 159, 100, C.gold[1]);
      PX.dot(g, 161, 102, C.gold[1]);
    }
    // plaque
    PX.rect(g, 146, 58, 28, 10, C.wood[0]);
    PX.rect(g, 147, 59, 26, 8, '#2f3a6b');
    g.fillStyle = C.gold[2];
    g.font = '8px "DotGothic16", monospace';
    g.textBaseline = 'top';
    g.fillText('星家', 152, 59);
    ground(g, 120, season);
    // peach tree, well, flower pots
    tree(g, 40, 132, 1.1, season, 21);
    PX.rect(g, 262, 124, 22, 12, C.stone[1]);
    PX.rect(g, 263, 125, 20, 3, C.stone[3]);
    PX.rect(g, 264, 128, 18, 2, '#233a52');
    PX.vline(g, 264, 110, 124, C.wood[1]);
    PX.vline(g, 281, 110, 124, C.wood[1]);
    PX.hline(g, 262, 283, 110, C.wood[0]);
    PX.hline(g, 262, 283, 109, C.roof[1]);
    const items = o.items || {};
    [[96, 124], [214, 124]].forEach(([x, y]) => {
      PX.rect(g, x, y, 10, 7, '#3f6fa0');
      PX.hline(g, x, x + 9, y, '#6f9fd0');
      PX.disc(g, x + 5, y - 3, 4, season === 'winter' ? '#e6ecf5' : FOL[season][2]);
      // her favourite flower, in its season
      if (items.flower) {
        const r = PX.rng(x);
        for (let i = 0; i < 5; i++) PX.dot(g, x + 2 + Math.floor(r() * 7), y - 6 + Math.floor(r() * 5), items.flower);
      }
    });
    // height marks cut into the pillar, one for every Qixi
    for (let i = 0; i < Math.min(8, items.heights || 0); i++) {
      const y = 112 - i * 3;
      PX.hline(g, 72, 75, y, C.red[0]);
      PX.dot(g, 76, y, '#fff4dc');
    }
    // bamboo against the wall, a stone bench and a little herb bed
    bamboo(g, 300, 120, 44, season);
    bamboo(g, 308, 122, 36, season);
    bamboo(g, 12, 118, 30, season);
    PX.rect(g, 222, 150, 30, 4, C.stone[3]);
    PX.hline(g, 222, 251, 154, C.stone[0]);
    PX.rect(g, 225, 154, 4, 6, C.stone[1]);
    PX.rect(g, 245, 154, 4, 6, C.stone[1]);
    PX.rect(g, 60, 158, 36, 8, season === 'winter' ? '#e6ecf5' : '#7a5236');
    PX.hline(g, 60, 95, 158, C.wood[0]);
    if (season !== 'winter') for (let i = 0; i < 6; i++) PX.dot(g, 63 + i * 6, 156 - (i % 2), season === 'autumn' ? '#d9a13a' : '#6fae5f');
    if (items.drawing) { PX.rect(g, 118, 92, 8, 9, '#fffdf6'); PX.dot(g, 120, 95, '#e36d6d'); PX.dot(g, 123, 96, '#4a8cc4'); }
    // traces of her life in the courtyard
    if (items.rabbitLantern) {
      // Mei's giant rabbit lantern, hung between the window and the door
      const lx = 138;
      PX.vline(g, lx + 4, 86, 89, C.wood[0]);
      PX.rect(g, lx, 92, 10, 7, '#fffaf0');
      PX.hline(g, lx, lx + 9, 99, '#e9dcc8');
      PX.vline(g, lx + 1, 88, 91, '#fffaf0'); PX.vline(g, lx + 3, 89, 91, '#fffaf0');
      PX.dot(g, lx + 1, 89, '#f7a8c0');
      PX.dot(g, lx + 7, 94, '#e0485e');
      PX.dot(g, lx + 2, 95, '#f7a8c0');
      PX.dot(g, lx + 9, 96, '#fffaf0');
    }
    if (items.catBed) {
      PX.rect(g, 184, 113, 12, 5, '#b8874f');
      PX.hline(g, 184, 195, 113, '#d9a66a');
      PX.hline(g, 185, 194, 117, '#8a5e33');
      PX.rect(g, 186, 112, 8, 2, '#c7364a');
    }
    if (items.dummy) {
      PX.rect(g, 286, 132, 5, 24, C.wood[1]);
      PX.vline(g, 286, 132, 155, C.wood[0]);
      PX.rect(g, 282, 138, 13, 2, C.wood[2]);
      PX.rect(g, 283, 146, 11, 2, C.wood[2]);
      PX.rect(g, 284, 156, 9, 2, C.stone[1]);
    }
    if (items.stones) [[99, 162, '#a9a39a'], [103, 163, '#8f8a82'], [101, 161, '#c9c3b8'], [106, 162, '#b7b0a4']].forEach(([x, y, c]) => { PX.rect(g, x, y, 3, 2, c); });
    if (items.kite && season === 'spring') {
      // a kite that never came down from the peach tree
      PX.line(g, 60, 94, 70, 104, '#8a5e33');
      for (let dy = -4; dy <= 4; dy++) {
        const w = 4 - Math.abs(dy);
        for (let dx = -w; dx <= w; dx++) PX.dot(g, 56 + dx, 90 + dy, dx === 0 || dy === 0 ? '#f2c14a' : Math.abs(dx) + Math.abs(dy) === 4 ? '#8f2530' : '#e0485e');
      }
      PX.dot(g, 69, 106, '#f2c14a'); PX.dot(g, 68, 109, '#e0485e'); PX.dot(g, 70, 112, '#f2c14a'); PX.dot(g, 69, 115, '#e0485e');
    }
    if (items.snow && season === 'winter') {
      // her snow rabbit
      PX.rect(g, 130, 156, 9, 5, '#f4f7fc');
      PX.hline(g, 130, 138, 161, '#c9d3e3');
      PX.rect(g, 136, 152, 5, 5, '#f4f7fc');
      PX.vline(g, 137, 148, 151, '#f4f7fc');
      PX.vline(g, 139, 149, 151, '#f4f7fc');
      PX.dot(g, 139, 154, '#e0485e');
      PX.dot(g, 141, 155, '#c9d3e3');
      PX.dot(g, 129, 157, '#f4f7fc');
    }
    return { lanterns: [[80, 74], [236, 74]], spots: { her: [160, 146], door: [160, 118], left: [70, 150], right: [240, 150], parent: [124, 150], tree: [40, 150], mentor: [200, 148] } };
  };

  S.room = (g, o) => {
    const { tod } = o;
    PX.rect(g, 0, 0, WW, WH, C.wall[2]);
    for (let x = 0; x < WW; x += 20) PX.vline(g, x, 0, 120, C.wall[1]);
    // round window with the night or day outside
    const cx = 90, cy = 60, r = 36;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      const st = tod === 'day' ? SKY.day[o.season] || SKY.day.spring : SKY.night;
      PX.hline(g, cx - w, cx + w, cy + y, st[Math.min(3, Math.floor(((y + r) / (2 * r)) * 4))]);
    }
    if (tod !== 'day') for (let i = 0; i < 20; i++) PX.dot(g, cx - 30 + ((i * 37) % 60), cy - 30 + ((i * 53) % 50), '#fff6c8');
    PX.disc(g, cx + 14, cy - 14, 6, tod === 'day' ? '#fff3c4' : '#fff6d6');
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      PX.dot(g, cx + Math.cos(rad) * (r + 1), cy + Math.sin(rad) * (r + 1), C.wood[1]);
      PX.dot(g, cx + Math.cos(rad) * (r + 2), cy + Math.sin(rad) * (r + 2), C.wood[0]);
    }
    // bed with curtains, shelf, desk
    PX.rect(g, 190, 70, 110, 60, C.wood[1]);
    PX.rect(g, 194, 74, 102, 40, '#f3d2dc');
    for (let x = 196; x < 294; x += 6) PX.vline(g, x, 74, 113, '#e8b4c4');
    PX.rect(g, 196, 104, 98, 20, '#fff4f7');
    PX.rect(g, 186, 64, 118, 6, C.wood[0]);
    PX.rect(g, 0, 120, WW, 60, C.wood[2]);
    for (let y = 124; y < WH; y += 8) PX.hline(g, 0, WW, y, C.wood[1]);
    PX.rect(g, 20, 108, 60, 6, C.wood[0]);
    PX.rect(g, 24, 114, 4, 16, C.wood[0]);
    PX.rect(g, 72, 114, 4, 16, C.wood[0]);
    PX.rect(g, 30, 102, 14, 6, '#fff7ec');
    const items = o.items || {};
    if (items.guqin) { PX.rect(g, 46, 104, 28, 4, C.wood[1]); PX.hline(g, 47, 72, 105, '#f4e9d0'); }
    if (items.books) for (let i = 0; i < Math.min(5, items.books); i++) PX.rect(g, 140 + i * 5, 96 - (i % 2) * 2, 4, 12 + (i % 2) * 2, ['#2f4166', '#c7364a', '#5f9072', '#e6b64d'][i % 4]);
    PX.rect(g, 136, 108, 34, 3, C.wood[0]);
    if (items.sword) PX.line(g, 150, 60, 172, 38, '#d8dde8');
    return { lanterns: [[176, 40]], spots: { her: [160, 150], parent: [110, 152], bed: [240, 140] } };
  };

  S.town = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    if (tod === 'night') starsLayer(g, 9, 70);
    else cloud(g, 200, 20, 44, '#ffffff', '#dfe9f3');
    mountains(g, 23, 70, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b3c6db', '#98b0c9'], 14);
    house(g, -10, 64, 90, 52, { windows: [[30, 14, 22, 18]], pillars: [2, 84], roofH: 12 });
    house(g, 100, 70, 60, 46, { door: true, roofH: 10 });
    house(g, 180, 62, 80, 54, { windows: [[10, 12, 24, 18], [46, 12, 24, 18]], pillars: [2, 74], roofH: 12 });
    house(g, 270, 68, 70, 48, { door: true, roofH: 10 });
    banner(g, 84, 76, '#c7364a', '茶');
    banner(g, 166, 74, '#2f6a64', '面');
    banner(g, 262, 76, '#6b3a8a', '藥');
    ground(g, 116, season);
    // lantern strings across the street
    for (let x = 0; x < WW; x += 2) PX.dot(g, x, 42 + Math.round(Math.sin((x / WW) * Math.PI) * 10), C.wood[0]);
    const lan = [];
    for (let i = 1; i < 8; i++) {
      const x = i * 40 - 3;
      lan.push([x, 45 + Math.round(Math.sin((x / WW) * Math.PI) * 10)]);
    }
    return { lanterns: lan, spots: { her: [150, 150], left: [60, 150], right: [250, 150], a: [110, 140], b: [210, 144] } };
  };

  S.market = (g, o) => {
    const r = S.town(g, o);
    const cols = ['#c9302c', '#e0a52a', '#3f8f6a', '#3f78b5'];
    for (let i = 0; i < 4; i++) {
      const x = 12 + i * 80;
      PX.rect(g, x, 118, 56, 4, cols[i]);
      for (let k = 0; k < 56; k += 8) PX.rect(g, x + k, 122, 4, 3, cols[i]);
      PX.rect(g, x + 4, 125, 48, 16, C.wood[2]);
      PX.hline(g, x + 4, x + 51, 125, C.wood[3]);
      for (let k = 0; k < 5; k++) PX.disc(g, x + 10 + k * 9, 128, 2, ['#f2c14e', '#e0607e', '#fff4e0', '#8fd1a0', '#f28f3b'][(k + i) % 5]);
    }
    return r;
  };

  S.hall = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    if (tod === 'night') starsLayer(g, 13, 70);
    mountains(g, 31, 70, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b3c6db', '#98b0c9'], 18);
    house(g, 60, 62, 200, 56, { door: false, pillars: [4, 54, 142, 192], roofH: 16 });
    PX.rect(g, 136, 70, 48, 16, '#2e3444');
    PX.rect(g, 138, 72, 44, 12, '#3a4466');
    g.fillStyle = C.gold[2];
    g.font = '10px "DotGothic16", monospace';
    g.textBaseline = 'top';
    g.fillText('武館', 148, 73);
    ground(g, 118, season, 'stone');
    // weapon rack and training dummy
    PX.rect(g, 18, 118, 34, 3, C.wood[1]);
    PX.rect(g, 18, 100, 34, 3, C.wood[1]);
    for (let i = 0; i < 4; i++) {
      PX.vline(g, 22 + i * 8, 86, 124, C.wood[0]);
      PX.rect(g, 21 + i * 8, 84, 3, 4, '#d8dde8');
      PX.rect(g, 21 + i * 8, 92, 3, 2, C.red[2]);
    }
    PX.rect(g, 284, 104, 6, 30, C.wood[2]);
    PX.rect(g, 278, 110, 18, 3, C.wood[2]);
    PX.rect(g, 280, 120, 14, 3, C.wood[2]);
    PX.disc(g, 287, 100, 4, C.wood[2]);
    return { lanterns: [[70, 64], [246, 64]], spots: { her: [150, 150], mentor: [196, 148], left: [80, 150] } };
  };

  S.academy = (g, o) => {
    PX.rect(g, 0, 0, WW, WH, C.wall[2]);
    for (let x = 0; x < WW; x += 24) PX.vline(g, x, 0, 116, C.wall[1]);
    // windows with bamboo
    for (let k = 0; k < 2; k++) {
      const wx = 24 + k * 90;
      const st = o.tod === 'day' ? SKY.day[o.season] || SKY.day.spring : SKY.night;
      PX.gradient(g, wx, 26, 60, 50, st);
      for (let i = 0; i < 4; i++) bamboo(g, wx + 6 + i * 15, 76, 50, o.season);
      lattice(g, wx, 26, 60, 50, C.wood[1], 'transparent');
    }
    // shelves with scroll ends
    PX.rect(g, 214, 16, 96, 100, C.wood[1]);
    for (let r = 0; r < 4; r++) {
      PX.rect(g, 218, 20 + r * 24, 88, 20, C.wood[0]);
      for (let c = 0; c < 8; c++) {
        PX.disc(g, 224 + c * 11, 30 + r * 24, 4, ['#f4e6c6', '#e8d4ab', '#f7ecd4'][(r + c) % 3]);
        PX.dot(g, 224 + c * 11, 30 + r * 24, C.wood[2]);
      }
    }
    // hanging calligraphy
    PX.rect(g, 176, 18, 24, 56, '#fbf6ea');
    PX.hline(g, 174, 201, 17, C.wood[0]);
    PX.hline(g, 174, 201, 74, C.wood[0]);
    g.fillStyle = '#2d1824';
    g.font = '12px "DotGothic16", monospace';
    g.textBaseline = 'top';
    g.fillText('學', 182, 26);
    g.fillText('海', 182, 46);
    PX.rect(g, 0, 116, WW, 64, C.wood[2]);
    for (let y = 120; y < WH; y += 8) PX.hline(g, 0, WW, y, C.wood[1]);
    // low desks
    [[30, 136], [120, 136], [240, 140]].forEach(([x, y]) => {
      PX.rect(g, x, y, 50, 4, C.wood[0]);
      PX.rect(g, x + 2, y + 4, 3, 8, C.wood[0]);
      PX.rect(g, x + 45, y + 4, 3, 8, C.wood[0]);
      PX.rect(g, x + 14, y - 3, 16, 3, '#fff7ec');
    });
    return { lanterns: [], spots: { her: [150, 152], mentor: [200, 148] } };
  };

  S.temple = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 110);
    if (tod === 'night') starsLayer(g, 17, 80);
    mountains(g, 41, 84, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b8cadc', '#9ab2ca'], 22);
    tree(g, 36, 128, 1.2, season === 'winter' ? 'winter' : 'summer', 44);
    // temple on a plinth
    PX.rect(g, 90, 110, 140, 10, C.stone[3]);
    PX.rect(g, 80, 120, 160, 10, C.stone[2]);
    house(g, 104, 62, 112, 48, { door: true, pillars: [2, 34, 74, 106], roofH: 14, roofCols: C.roofGold });
    roof(g, 124, 40, 72, 10, C.roofGold);
    PX.rect(g, 140, 50, 40, 12, C.red[2]);
    ground(g, 130, season, 'stone');
    // incense burner
    PX.rect(g, 250, 124, 18, 10, '#6b5a3a');
    PX.rect(g, 248, 122, 22, 3, '#8f7a4a');
    return { lanterns: [[112, 66], [206, 66]], smoke: [[259, 120]], spots: { her: [160, 152], mentor: [200, 150] } };
  };

  S.teahouse = (g, o) => {
    PX.rect(g, 0, 0, WW, WH, '#e9d5b6');
    for (let x = 0; x < WW; x += 20) PX.vline(g, x, 0, 116, '#d9c19c');
    const st = o.tod === 'day' ? SKY.day[o.season] || SKY.day.spring : SKY.night;
    PX.gradient(g, 20, 20, 150, 70, st);
    PX.rect(g, 20, 70, 150, 20, C.water[2]);
    mountains(g, 5, 70, ['#9fb6cc'], 8);
    PX.rect(g, 20, 72, 150, 18, C.water[2]);
    for (let i = 0; i < 12; i++) PX.hline(g, 26 + ((i * 29) % 140), 30 + ((i * 29) % 140), 76 + (i % 4) * 4, C.water[3]);
    lattice(g, 20, 20, 150, 70, C.wood[0], 'transparent');
    PX.rect(g, 196, 14, 90, 96, C.red[1]);
    PX.rect(g, 200, 18, 82, 88, C.red[2]);
    g.fillStyle = C.gold[3];
    g.font = '16px "DotGothic16", monospace';
    g.textBaseline = 'top';
    g.fillText('茶', 232, 34);
    g.fillText('香', 232, 64);
    PX.rect(g, 0, 116, WW, 64, C.wood[2]);
    for (let y = 120; y < WH; y += 8) PX.hline(g, 0, WW, y, C.wood[1]);
    [[36, 138], [210, 142]].forEach(([x, y]) => {
      PX.rect(g, x, y, 56, 4, C.wood[0]);
      PX.rect(g, x + 4, y + 4, 3, 10, C.wood[0]);
      PX.rect(g, x + 49, y + 4, 3, 10, C.wood[0]);
      PX.rect(g, x + 20, y - 5, 8, 5, '#eaf2ee');
      PX.rect(g, x + 32, y - 3, 4, 3, '#eaf2ee');
    });
    return { lanterns: [[180, 30]], steam: [[60, 128], [234, 132]], spots: { her: [150, 152], mentor: [110, 150], left: [60, 156], right: [260, 156] } };
  };

  S.kitchen = (g, o) => {
    PX.rect(g, 0, 0, WW, WH, '#e6d0b0');
    PX.rect(g, 0, 110, WW, 70, '#c2a782');
    for (let y = 114; y < WH; y += 8) PX.hline(g, 0, WW, y, '#b09474');
    // stove with fire
    PX.rect(g, 20, 80, 110, 56, '#9c6b4a');
    PX.rect(g, 20, 80, 110, 4, '#b98560');
    PX.rect(g, 36, 112, 26, 18, '#2d1a14');
    // steamer stack
    for (let i = 0; i < 4; i++) {
      PX.rect(g, 80, 70 - i * 10, 40, 9, '#cfa96c');
      PX.hline(g, 80, 119, 70 - i * 10, '#e3c48a');
      PX.hline(g, 80, 119, 78 - i * 10, '#a8844a');
    }
    // shelf, jars and hanging chilies
    PX.rect(g, 170, 50, 130, 4, C.wood[0]);
    for (let i = 0; i < 6; i++) {
      PX.rect(g, 176 + i * 20, 36, 12, 14, ['#5f7fa5', '#c9594f', '#e0b04a', '#5f9072', '#8a6a4a', '#b06ac9'][i]);
      PX.hline(g, 176 + i * 20, 187 + i * 20, 36, '#fff');
    }
    for (let i = 0; i < 7; i++) {
      PX.vline(g, 180 + i * 16, 0, 16 + (i % 3) * 5, C.wood[0]);
      PX.rect(g, 178 + i * 16, 16 + (i % 3) * 5, 5, 8, i % 2 ? '#d93a3a' : '#f6efe0');
    }
    PX.rect(g, 160, 112, 150, 6, C.wood[0]);
    for (let i = 0; i < 5; i++) PX.disc(g, 180 + i * 12, 108, 4, '#f6efe0');
    return { fire: [[49, 124]], steam: [[100, 30]], spots: { her: [150, 152], mentor: [210, 150] } };
  };

  S.observatory = (g, o) => {
    sky(g, 'night', o.season, 150);
    starsLayer(g, 29, 140);
    mountains(g, 47, 130, ['#1d234a', '#161b3a'], 16);
    PX.rect(g, 0, 150, WW, 30, '#141836');
    // armillary sphere
    const cx = 250, cy = 100;
    for (let a = 0; a < 360; a += 3) {
      const r = (a * Math.PI) / 180;
      PX.dot(g, cx + Math.cos(r) * 22, cy + Math.sin(r) * 22, C.gold[2]);
      PX.dot(g, cx + Math.cos(r) * 22, cy + Math.sin(r) * 8, C.gold[1]);
      PX.dot(g, cx + Math.cos(r) * 8, cy + Math.sin(r) * 22, C.gold[1]);
    }
    PX.disc(g, cx, cy, 2, C.gold[3]);
    PX.rect(g, cx - 1, cy + 22, 3, 26, C.gold[1]);
    PX.rect(g, cx - 12, cy + 48, 25, 3, C.gold[1]);
    return { spots: { her: [150, 160], mentor: [210, 160] } };
  };

  S.palace = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    if (tod === 'night') starsLayer(g, 37, 70);
    PX.rect(g, 0, 70, WW, 60, C.red[2]);
    house(g, 30, 52, 260, 62, { pillars: [10, 60, 110, 146, 196, 246], roofH: 18, roofCols: C.roofGold });
    roof(g, 90, 22, 140, 14, C.roofGold);
    PX.rect(g, 136, 58, 48, 14, '#1f3f8a');
    g.fillStyle = C.gold[2];
    g.font = '9px "DotGothic16", monospace';
    g.textBaseline = 'top';
    g.fillText('太和殿', 147, 60);
    for (let i = 0; i < 6; i++) PX.rect(g, 60 - i * 10, 114 + i * 6, 200 + i * 20, 6, i % 2 ? '#efe9df' : '#f8f4ec');
    return { lanterns: [[70, 60], [246, 60]], spots: { her: [160, 156], mentor: [210, 150], prince: [200, 150] } };
  };

  S.mountain = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 120);
    if (tod === 'night') starsLayer(g, 43, 90);
    mountains(g, 53, 60, tod === 'night' ? ['#2c336a', '#242b5c', '#1c224a'] : ['#cfd9e4', '#afc0d2', '#8ea6be'], 30);
    for (let y = 96; y < 112; y++) PX.dither(g, 0, y, WW, 1, 'transparent', '#ffffff', 0.25 * (1 - Math.abs(y - 104) / 8));
    // waterfall
    PX.rect(g, 230, 40, 5, 90, '#dff2fb');
    PX.vline(g, 232, 40, 130, '#ffffff');
    const pine = (x, y, s) => {
      PX.rect(g, x, y - 10 * s, 2, 10 * s, C.wood[0]);
      for (let k = 0; k < 3; k++) PX.ellipse(g, x + 1, y - 10 * s - k * 5 * s, 8 * s - k * 2 * s, 2 * s, season === 'winter' ? '#e6ecf4' : '#3f6b50');
    };
    PX.rect(g, 0, 130, WW, 50, season === 'winter' ? '#eef2f8' : '#6b8a5a');
    pine(30, 140, 1.4);
    pine(60, 146, 1);
    pine(290, 144, 1.3);
    return { spots: { her: [150, 156], mentor: [200, 152] } };
  };

  S.lake = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    if (tod === 'night') starsLayer(g, 59, 70);
    mountains(g, 61, 84, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b8cadc', '#9ab2ca'], 14);
    PX.rect(g, 0, 96, WW, 40, season === 'winter' ? '#cfe2f0' : C.water[1]);
    // arched bridge
    for (let x = 0; x <= 90; x++) {
      const y = Math.round(96 - Math.sin((x / 90) * Math.PI) * 18);
      PX.rect(g, 200 + x, y, 1, 4, '#f3ede2');
      PX.dot(g, 200 + x, y - 1, C.red[2]);
    }
    for (let x = 200; x <= 290; x += 10) PX.vline(g, x, Math.round(96 - Math.sin(((x - 200) / 90) * Math.PI) * 18) - 5, Math.round(96 - Math.sin(((x - 200) / 90) * Math.PI) * 18), C.red[2]);
    PX.rect(g, 0, 136, WW, 44, season === 'winter' ? '#eef2f8' : C.grass[2]);
    if (season === 'summer' || season === 'spring') {
      for (let i = 0; i < 9; i++) {
        const x = 20 + ((i * 53) % 170), y = 104 + ((i * 17) % 26);
        PX.ellipse(g, x, y, 5, 2, '#4f8c49');
        if (season === 'summer' && i % 2) { PX.dot(g, x, y - 3, '#f7a8c0'); PX.dot(g, x - 1, y - 2, '#f27fa0'); PX.dot(g, x + 1, y - 2, '#f27fa0'); }
      }
    }
    // willow
    PX.rect(g, 30, 96, 4, 42, C.wood[1]);
    for (let i = 0; i < 16; i++) PX.vline(g, 16 + i * 3, 70 + (i % 3) * 2, 110 + (i % 4) * 4, season === 'autumn' ? '#d9b04a' : season === 'winter' ? '#b8a88a' : '#7fb069');
    return { water: [0, 96, WW, 40], spots: { her: [150, 156], left: [80, 158], right: [230, 158] } };
  };

  S.field = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    mountains(g, 67, 76, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#b8cadc', '#9ab2ca'], 18);
    const cols = season === 'winter' ? ['#e9eef6', '#dde4ee'] : season === 'autumn' ? ['#c9a74a', '#b59440'] : ['#6fae5f', '#5a9650'];
    for (let i = 0; i < 7; i++) {
      const y = 90 + i * 13;
      for (let x = 0; x < WW; x++) PX.vline(g, x, y + Math.round(Math.sin(x / 40 + i) * 3), WH, cols[i % 2]);
      for (let x = 0; x < WW; x += 6) PX.dot(g, x, y + 2 + Math.round(Math.sin(x / 40 + i) * 3), season === 'winter' ? '#ffffff' : '#9ccc7a');
    }
    return { spots: { her: [150, 156], left: [90, 158], right: [220, 158] } };
  };

  S.silk = (g, o) => {
    PX.rect(g, 0, 0, WW, WH, '#efe0ec');
    const cols = ['#e0607e', '#8fd1d9', '#f2c14e', '#b06ac9', '#8cc47a', '#f7a8bd', '#4a8cc4'];
    PX.rect(g, 10, 14, 300, 3, C.wood[0]);
    cols.forEach((c, i) => {
      for (let y = 17; y < 96; y++) PX.hline(g, 20 + i * 42 + Math.round(Math.sin(y / 9 + i) * 2), 34 + i * 42 + Math.round(Math.sin(y / 9 + i) * 2), y, c);
    });
    PX.rect(g, 0, 116, WW, 64, '#c9a98a');
    for (let y = 120; y < WH; y += 8) PX.hline(g, 0, WW, y, '#b7977a');
    PX.rect(g, 210, 110, 90, 4, C.wood[1]);
    for (let x = 214; x < 296; x += 3) PX.vline(g, x, 114, 140, '#fdf7ff');
    PX.rect(g, 214, 132, 82, 6, '#b06ac9');
    return { spots: { her: [150, 156], mentor: [100, 152] } };
  };

  S.garden = (g, o) => {
    const { season, tod } = o;
    sky(g, tod, season, 100);
    if (tod === 'night') starsLayer(g, 71, 80);
    else cloud(g, 90, 22, 40, '#ffffff', '#dfe9f3');
    mountains(g, 73, 86, tod === 'night' ? ['#252c5a', '#1d234a'] : ['#bdcfe0', '#a3bad0'], 14);
    ground(g, 100, season, 'grass');
    tree(g, 50, 128, 1.2, season, 91);
    tree(g, 270, 124, 1.1, season, 93);
    tree(g, 170, 100, 0.7, season, 95);
    if (season !== 'winter') {
      const r = PX.rng(97);
      for (let i = 0; i < 60; i++) PX.dot(g, r() * WW, 104 + r() * 76, ['#ffffff', '#f7a8c0', '#f2d46a'][i % 3]);
    }
    return { spots: { her: [160, 154], left: [100, 156], right: [220, 156] } };
  };

  S.night = (g, o) => {
    sky(g, 'night', o.season, 180);
    starsLayer(g, 83, 170);
    // rooftops silhouette
    roof(g, -10, 128, 130, 10, ['#0b0e24', '#11152e', '#161b3a', '#1c2246']);
    PX.rect(g, -6, 138, 124, 42, '#11152e');
    roof(g, 200, 134, 130, 10, ['#0b0e24', '#11152e', '#161b3a', '#1c2246']);
    PX.rect(g, 204, 144, 124, 36, '#11152e');
    PX.rect(g, 40, 150, 10, 12, '#f6c86a');
    PX.rect(g, 250, 156, 9, 10, '#e9b458');
    return { magpies: !!o.magpies, spots: { her: [160, 170], parent: [130, 172], left: [118, 173], far: [96, 175], right: [226, 175] } };
  };
  S.sky = S.night;

  Wd.scenes = Object.keys(S);

  // ---------------------------------------------------------------- stage runtime
  const bgCache = new Map();
  function paintScene(name, o) {
    const key = [name, o.season, o.tod, JSON.stringify(o.items || {}), o.magpies ? 1 : 0].join('|');
    if (bgCache.has(key)) return bgCache.get(key);
    const [c, g] = PX.canvas(WW, WH);
    const info = (S[name] || S.home)(g, o) || {};
    const out = { canvas: c, info };
    bgCache.set(key, out);
    if (bgCache.size > 40) bgCache.delete(bgCache.keys().next().value);
    return out;
  }
  Wd.paintScene = paintScene;

  // weather particles in pixel space
  function makeParticles(kind) {
    const n = { petals: 26, leaves: 18, snow: 70, fireflies: 16, motes: 10, lanterns: 12 }[kind] || 0;
    const ps = [];
    for (let i = 0; i < n; i++) ps.push(newParticle(kind, true));
    return ps;
  }
  function newParticle(kind, anywhere) {
    const p = { kind, x: Math.random() * WW, y: anywhere ? Math.random() * WH : -4, vx: 0, vy: 0, ph: Math.random() * 6 };
    if (kind === 'petals') { p.vx = 0.15 + Math.random() * 0.2; p.vy = 0.18 + Math.random() * 0.2; p.c = Math.random() < 0.5 ? '#f7a8c0' : '#fde0ea'; }
    if (kind === 'leaves') { p.vx = 0.2 + Math.random() * 0.25; p.vy = 0.25 + Math.random() * 0.2; p.c = ['#e9913a', '#c95a2e', '#f4c04e'][Math.floor(Math.random() * 3)]; }
    if (kind === 'snow') { p.vx = (Math.random() - 0.3) * 0.12; p.vy = 0.12 + Math.random() * 0.22; p.c = Math.random() < 0.3 ? '#dfe7f5' : '#ffffff'; }
    if (kind === 'fireflies') { p.y = 60 + Math.random() * 110; p.vx = (Math.random() - 0.5) * 0.12; p.vy = (Math.random() - 0.5) * 0.1; }
    if (kind === 'motes') { p.vx = 0.05; p.vy = -0.04; }
    if (kind === 'lanterns') { p.y = anywhere ? Math.random() * WH : WH + 4; p.vx = (Math.random() - 0.5) * 0.05; p.vy = -0.12 - Math.random() * 0.12; }
    return p;
  }

  // ---------------------------------------------------------------- the magpie bridge
  // the main arch spans the Silver River; the second one curves down into the courtyard
  function makeBridge() {
    const arch = [], down = [];
    const A0 = [52, 74], A1 = [268, 74], H = 40;
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      arch.push([A0[0] + (A1[0] - A0[0]) * u, A0[1] - Math.sin(u * Math.PI) * H]);
    }
    // quadratic curve from the right foot of the arch to the ground in front of her
    const P0 = A1, C = [300, 138], P2 = [186, 158];
    for (let i = 1; i <= 13; i++) {
      const u = i / 13;
      down.push([(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * C[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * C[1] + u * u * P2[1]]);
    }
    const birds = [];
    arch.forEach(([x, y], i) => {
      const left = i < 12;
      birds.push({ i, x: x - 5, y: y - 1, sx: left ? -20 - Math.random() * 30 : WW + 20 + Math.random() * 30, sy: 10 + Math.random() * 90, d: Math.min(i, 24 - i) * 6 + Math.random() * 8, face: left ? 1 : -1 });
    });
    down.forEach(([x, y], j) => {
      birds.push({ i: 25 + j, x: x - 5, y: y - 1, sx: WW + 20 + Math.random() * 20, sy: 60 + Math.random() * 100, d: 110 + j * 6 + Math.random() * 6, face: -1 });
    });
    return { birds, sparks: [], mode: 'hold', t0: 0, path: { arch, down } };
  }
  // an 11x3 magpie facing right: long blue tail, black body, white belly and shoulder, black head.
  // flap: 0 wings up, 1 wings down, 2 perched
  function drawMagpie(g, x, y, dir, flap, halo) {
    const px = (dx, dy, c) => {
      g.fillStyle = c;
      g.fillRect(dir > 0 ? x + dx : x + 10 - dx, y + dy, 1, 1);
    };
    if (halo) {
      g.fillStyle = 'rgba(190,205,255,0.16)';
      g.fillRect(x - 1, y - 3, 13, 8);
    }
    const K = '#0b0d1f', W = '#f4f6ff', B = '#3f60cc', b = '#2a3f8f', E = '#e8ecff';
    // tail
    px(0, 1, b); px(1, 1, B); px(2, 1, B); px(3, 1, b);
    // body
    px(4, 1, K); px(5, 1, W); px(6, 1, W); px(7, 1, K); px(8, 1, K);
    px(5, 2, K); px(6, 2, W); px(7, 2, K);
    // head and beak
    px(8, 0, K); px(9, 0, K); px(9, 1, K); px(10, 1, '#1a1d33'); px(9, 0, E);
    if (flap === 0) { px(5, 0, K); px(4, -1, K); px(3, -2, K); px(6, 0, W); px(5, -1, B); }
    else if (flap === 1) { px(5, 3, K); px(4, 4, K); px(6, 3, W); px(5, 4, B); }
    else { px(4, 0, K); px(5, 0, K); px(6, 0, B); px(7, 0, K); }
  }

  class Stage {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = WW;
      canvas.height = WH;
      this.g = canvas.getContext('2d');
      this.g.imageSmoothingEnabled = false;
      this.scene = null;
      this.opts = {};
      this.actors = [];
      this.particles = [];
      this.t = 0;
      this.frame = this.frame.bind(this);
      this.running = false;
      this.fade = 0;
      this.onClickActor = null;
      canvas.addEventListener('click', (e) => this.click(e));
    }
    set(name, o = {}) {
      this.scene = name;
      this.opts = Object.assign({ season: 'spring', tod: 'day' }, o);
      this.bg = paintScene(name, this.opts);
      const weather = o.weather || this.defaultWeather();
      this.particles = makeParticles(weather);
      this.weather = weather;
      this.bridge = null;
      this.falling = null;
      this.newStar = null;
      if (this.bg.info.magpies) this.fx('bridge', 'hold');
      return this.bg.info;
    }
    defaultWeather() {
      const { season, tod } = this.opts;
      const indoor = ['room', 'academy', 'teahouse', 'kitchen', 'silk'].includes(this.scene);
      if (indoor) return null;
      if (tod === 'night') return season === 'summer' ? 'fireflies' : season === 'winter' ? 'snow' : null;
      return { spring: 'petals', summer: 'motes', autumn: 'leaves', winter: 'snow' }[season];
    }
    spot(name) {
      return (this.bg && this.bg.info.spots && this.bg.info.spots[name]) || [160, 150];
    }
    clear() {
      const gone = this.actors;
      this.actors = [];
      gone.forEach((a) => this.stopWalk(a));
    }
    // cancel a walk; whoever was waiting for the arrival is released
    stopWalk(a) {
      const cb = a.onArrive;
      a.target = null;
      a.onArrive = null;
      a.moving = false;
      if (cb) cb();
    }
    add(a) {
      const actor = Object.assign({ id: 'a' + Math.random().toString(36).slice(2, 7), x: 160, y: 150, anim: 'idle', dir: 1, t: 0, speed: 0.6, visible: true, emote: null, emoteT: 0 }, a);
      this.actors.push(actor);
      return actor;
    }
    get(id) {
      return this.actors.find((a) => a.id === id);
    }
    remove(id) {
      const gone = this.actors.filter((a) => a.id === id);
      this.actors = this.actors.filter((a) => a.id !== id);
      gone.forEach((a) => this.stopWalk(a));
    }
    walkTo(actor, x, y) {
      return new Promise((res) => {
        actor.target = [x, y];
        actor.onArrive = res;
      });
    }
    emote(actor, name, secs = 2) {
      actor.emote = name;
      actor.emoteT = secs * 60;
    }
    start() {
      if (this.running) return;
      this.running = true;
      requestAnimationFrame(this.frame);
    }
    stop() {
      this.running = false;
    }
    click(e) {
      if (!this.onClickActor) return;
      const r = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * WW, y = ((e.clientY - r.top) / r.height) * WH;
      const hit = this.actors.slice().reverse().find((a) => a.clickable && Math.abs(a.x - x) < 10 && y > a.y - 34 && y < a.y + 2);
      if (hit) this.onClickActor(hit);
    }
    // ---- special effects: fx('bridge', 'build'|'hold'|'dissolve'), fx('fallingStar'), fx('newStar', [x, y])
    fx(name, arg) {
      if (name === 'bridge') {
        if (!this.bridge) this.bridge = makeBridge();
        const b = this.bridge;
        b.mode = arg || 'build';
        b.t0 = this.t;
        if (b.mode === 'hold') b.birds.forEach((bd) => (bd.d = -999));
      } else if (name === 'fallingStar') {
        this.falling = Object.assign({ t0: this.t, from: [300, -8], to: [44, 118] }, arg || {});
      } else if (name === 'newStar') {
        this.newStar = { t0: this.t, x: arg ? arg[0] : 160, y: arg ? arg[1] : 18 };
      } else if (name === 'clear') {
        this.bridge = this.falling = this.newStar = null;
      }
    }
    bridgePath() {
      return this.bridge ? this.bridge.path : makeBridge().path;
    }
    // walk an actor along a list of points
    async followPath(actor, pts, onStep) {
      for (let i = 0; i < pts.length; i++) {
        if (!this.actors.includes(actor)) return;
        await this.walkTo(actor, pts[i][0], pts[i][1]);
        if (onStep) onStep(i / (pts.length - 1));
      }
    }
    drawFx() {
      const g = this.g, t = this.t;
      const b = this.bridge;
      if (b) {
        const f = t - b.t0;
        // how settled the bridge is: drives the glow under the birds
        let glow = b.mode === 'hold' ? 1 : b.mode === 'build' ? U.clamp((f - 150) / 90, 0, 1) : b.mode === 'dissolve' ? U.clamp(1 - f / 70, 0, 1) : 1;
        if (glow > 0) {
          const pts = b.path.arch.concat(b.path.down);
          for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            if (i === b.path.arch.length) continue;
            const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
            for (let k = 0; k < n; k++) {
              const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
              const tw = 0.8 + 0.2 * Math.sin(t / 9 + x / 7);
              g.fillStyle = `rgba(255,214,140,${0.12 * glow * tw})`;
              g.fillRect(x - 2, y - 1, 5, 5);
              g.fillStyle = `rgba(255,232,170,${0.22 * glow * tw})`;
              g.fillRect(x - 1, y + 1, 3, 2);
              g.fillStyle = `rgba(255,248,225,${0.7 * glow * tw})`;
              g.fillRect(x, y + 2, 1, 1);
            }
          }
        }
        for (const bd of b.birds) {
          let x, y, flap, dir, alpha = 1, flying = false;
          const lf = f - bd.d;
          if (b.mode === 'dissolve') {
            const k = Math.max(0, f - bd.i * 2);
            x = bd.x + Math.sin(bd.i * 1.7) * k * 0.35;
            y = bd.y - k * k * 0.006 - k * 0.2;
            alpha = U.clamp(1 - k / 90, 0, 1);
            flap = Math.floor((t + bd.i * 3) / 4) % 2;
            dir = Math.sin(bd.i * 1.7) >= 0 ? 1 : -1;
            flying = true;
            if (alpha > 0 && k > 0 && (t + bd.i) % 7 === 0) b.sparks.push({ x, y, vy: 0.15 + Math.random() * 0.25, life: 90 + Math.random() * 60 });
          } else if (lf < 0 && b.mode === 'build') {
            continue;
          } else {
            const u = b.mode === 'build' ? U.clamp(lf / 80, 0, 1) : 1;
            const e = 1 - Math.pow(1 - u, 3);
            x = bd.sx + (bd.x - bd.sx) * e;
            y = bd.sy + (bd.y - bd.sy) * e - Math.sin(u * Math.PI) * 10;
            flap = u < 1 ? Math.floor((t + bd.i * 3) / 5) % 2 : (t + bd.i * 37) % 200 < 10 ? Math.floor(t / 5) % 2 : 2;
            dir = u < 1 ? (bd.x > bd.sx ? 1 : -1) : bd.face;
            flying = u < 1;
            if (u >= 1) y += Math.sin(t / 24 + bd.i) > 0.92 ? -1 : 0;
          }
          if (alpha <= 0) continue;
          g.globalAlpha = alpha;
          drawMagpie(g, Math.round(x), Math.round(y), dir, flap, flying);
          g.globalAlpha = 1;
        }
        // falling sparkles when the bridge dissolves
        b.sparks = b.sparks.filter((p) => (p.life -= 1) > 0 && p.y < WH);
        for (const p of b.sparks) {
          p.y += p.vy;
          p.x += Math.sin((p.life + p.y) / 12) * 0.15;
          const on = Math.sin(p.life / 3) > -0.3;
          if (on) {
            PX.dot(g, p.x, p.y, p.life > 40 ? '#fff4c8' : '#c9d2ff');
            g.fillStyle = 'rgba(255,240,190,0.3)';
            g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1);
            g.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3);
          }
        }
      }
      // a star falling into the courtyard
      const fl = this.falling;
      if (fl) {
        const f = t - fl.t0, dur = 70;
        if (f <= dur) {
          const u = f / dur, e = u * u;
          const x = fl.from[0] + (fl.to[0] - fl.from[0]) * e, y = fl.from[1] + (fl.to[1] - fl.from[1]) * e;
          const dx = fl.to[0] - fl.from[0], dy = fl.to[1] - fl.from[1], len = Math.hypot(dx, dy);
          for (let k = 0; k < 26; k++) {
            const tx = x - (dx / len) * k * (0.6 + u), ty = y - (dy / len) * k * (0.6 + u);
            PX.dot(g, tx, ty, k < 3 ? '#ffffff' : k < 9 ? '#fff0b0' : k < 17 ? '#c9d2ff' : '#6f7ab8');
          }
          g.fillStyle = 'rgba(255,248,210,0.5)';
          g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 5, 3);
          g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 3, 5);
        } else if (f <= dur + 40) {
          const k = (f - dur) / 40;
          g.fillStyle = `rgba(255,250,225,${0.7 * (1 - k)})`;
          const r = Math.round(4 + k * 40);
          for (let yy = -r; yy <= r; yy++) {
            const w = Math.round(Math.sqrt(r * r - yy * yy));
            g.fillRect(fl.to[0] - w, fl.to[1] + yy, w * 2 + 1, 1);
          }
        } else this.falling = null;
      }
      // a new star in the sky
      const ns = this.newStar;
      if (ns) {
        const f = t - ns.t0;
        const grow = U.clamp(f / 60, 0, 1);
        const arm = Math.round((2 + Math.sin(t / 10) * 1.2) * grow + (f < 60 ? (1 - grow) * 6 : 0));
        g.fillStyle = `rgba(255,244,200,${0.25 * grow})`;
        g.fillRect(ns.x - 3, ns.y - 3, 7, 7);
        g.fillStyle = '#fffbe8';
        g.fillRect(ns.x - arm, ns.y, arm * 2 + 1, 1);
        g.fillRect(ns.x, ns.y - arm, 1, arm * 2 + 1);
        g.fillStyle = '#ffffff';
        g.fillRect(ns.x - 1, ns.y - 1, 3, 3);
      }
    }
    update() {
      this.t++;
      for (const a of this.actors) {
        a.t++;
        if (a.target) {
          const dx = a.target[0] - a.x, dy = a.target[1] - a.y;
          const d = Math.hypot(dx, dy);
          if (d < a.speed) {
            a.x = a.target[0];
            a.y = a.target[1];
            a.target = null;
            a.moving = false;
            const cb = a.onArrive;
            a.onArrive = null;
            if (cb) cb();
          } else {
            a.x += (dx / d) * a.speed;
            a.y += (dy / d) * a.speed;
            a.moving = true;
            if (Math.abs(dx) > Math.abs(dy)) a.face = 'side', (a.dir = dx < 0 ? -1 : 1);
            else a.face = dy < 0 ? 'up' : 'down';
          }
        } else a.moving = false;
        if (a.brain) a.brain(a, this);
        if (a.emoteT > 0) a.emoteT--;
      }
      for (const p of this.particles) {
        p.ph += 0.03;
        p.x += p.vx + (p.kind === 'petals' || p.kind === 'leaves' ? Math.sin(p.ph) * 0.15 : 0);
        p.y += p.vy + (p.kind === 'fireflies' ? Math.sin(p.ph) * 0.1 : 0);
        if (p.y > WH + 4 || p.x > WW + 4 || p.x < -4 || p.y < -8) Object.assign(p, newParticle(p.kind, p.kind === 'fireflies' || p.kind === 'motes'));
      }
    }
    frame() {
      if (!this.running) return;
      if (!document.hidden) {
        this.update();
        this.draw();
      }
      requestAnimationFrame(this.frame);
    }
    drawActor(a) {
      const g = this.g;
      let src, pal, flip = false;
      const frames = G.Sprites.build(a.cfg || {});
      let animName = a.anim;
      if (a.moving) animName = a.face === 'side' ? 'walk_side' : a.face === 'up' ? 'walk_up' : 'walk_down';
      const fr = frames[animName] || frames.idle;
      const speed = a.moving ? 8 : animName === 'idle' ? 22 : 14;
      let idx = Math.floor(a.t / speed) % fr.length;
      if (animName === 'idle') idx = a.t % 240 < 8 ? 3 : Math.floor(a.t / 30) % 2 === 0 ? 0 : 2;
      const f = fr[Math.min(idx, fr.length - 1)];
      const rows = G.Sprites.bob(f.rows, f.dy || 0);
      flip = (a.face === 'side' || animName.includes('side')) && a.dir > 0 ? true : !!f.flip;
      if (a.cfg && a.cfg.cat) flip = a.dir > 0;
      pal = a.pal;
      const sw = rows[0].length, sh = rows.length;
      const x = Math.round(a.x - sw / 2), y = Math.round(a.y - sh);
      g.globalAlpha = a.alpha == null ? 1 : U.clamp(a.alpha, 0, 1);
      // shadow
      g.fillStyle = 'rgba(40,20,40,0.22)';
      g.fillRect(x + Math.round(sw * 0.2), y + sh - 1, Math.round(sw * 0.6), 2);
      PX.draw(g, G.Sprites.join(rows), pal, x, y, flip);
      (f.props || []).forEach((p) => {
        const ps = G.Sprites.PROPS[p.name];
        if (ps) PX.draw(g, ps.join('\n'), G.Sprites.PROP_PAL, flip ? x + sw - p.x - ps[0].length : x + p.x, y + p.y, flip);
      });
      g.globalAlpha = 1;
      if (a.emote && a.emoteT > 0) {
        const ps = G.Sprites.PROPS[a.emote];
        if (ps) PX.draw(g, ps.join('\n'), G.Sprites.PROP_PAL, x + 10, y - 8 - Math.round(Math.sin(this.t / 8)), false);
      }
      if (a.label) {
        // tiny name flag for clickable actors
      }
    }
    draw() {
      const g = this.g;
      if (!this.bg) return;
      g.drawImage(this.bg.canvas, 0, 0);
      const info = this.bg.info;
      const t = this.t;
      // water shimmer
      if (info.water) {
        const [wx, wy, ww, wh] = info.water;
        for (let i = 0; i < 26; i++) {
          const x = wx + ((i * 47 + t * 0.2) % ww), y = wy + 3 + ((i * 13) % (wh - 4));
          PX.hline(g, x, x + 3, y, (Math.floor(t / 20) + i) % 3 ? '#bfe6f7' : '#8fcbe8');
        }
      }
      // smoke / steam
      [].concat(info.smoke || [], info.steam || []).forEach(([sx, sy], k) => {
        for (let i = 0; i < 4; i++) {
          const life = ((t * 0.4 + i * 12 + k * 7) % 48) / 48;
          PX.dot(g, sx + Math.round(Math.sin(life * 6 + i) * 2), sy - Math.round(life * 22), life < 0.6 ? '#ffffff' : '#e6e6ee');
        }
      });
      if (info.fire) info.fire.forEach(([fx, fy]) => {
        for (let i = 0; i < 6; i++) PX.dot(g, fx + ((i * 5 + t) % 9) - 4, fy - ((i * 3 + t) % 6), i % 2 ? '#ffb24a' : '#ff6a3a');
      });
      // shooting stars (title screen)
      if (this.opts.shooting) {
        this.shoot = this.shoot || [];
        if (Math.random() < 0.02) this.shoot.push({ x: 60 + Math.random() * 260, y: Math.random() * 60, life: 0 });
        this.shoot = this.shoot.filter((st) => (st.life += 1) < 40);
        for (const st of this.shoot) {
          for (let k = 0; k < 8; k++) {
            const px = st.x - st.life * 2 + k, py = st.y + st.life * 1 - k * 0.5;
            PX.dot(g, px, py, k < 2 ? '#fff8d8' : k < 5 ? '#c9d2ff' : '#6f7ab8');
          }
        }
      }
      // magpie bridge, falling star, new star
      this.drawFx();
      // actors sorted by depth
      this.actors.filter((a) => a.visible).sort((a, b) => a.y - b.y).forEach((a) => this.drawActor(a));
      // particles
      for (const p of this.particles) {
        if (p.kind === 'fireflies' || p.kind === 'motes') {
          const on = Math.sin(p.ph * 2) > -0.2;
          if (on) {
            PX.dot(g, p.x, p.y, p.kind === 'fireflies' ? '#fff5a0' : '#fffbe6');
            g.fillStyle = p.kind === 'fireflies' ? 'rgba(255,240,140,0.35)' : 'rgba(255,255,230,0.25)';
            g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1);
            g.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3);
          }
        } else if (p.kind === 'lanterns') {
          PX.rect(g, p.x, p.y, 2, 3, '#ffb46a');
          PX.dot(g, p.x, p.y, '#fff0b0');
        } else if (p.kind === 'petals' || p.kind === 'leaves') {
          PX.dot(g, p.x, p.y, p.c);
          if (Math.sin(p.ph) > 0) PX.dot(g, p.x + 1, p.y, p.c);
        } else PX.dot(g, p.x, p.y, p.c);
      }
      // lighting
      const tod = this.opts.tod;
      if (tod === 'night' || tod === 'dusk') {
        g.fillStyle = tod === 'night' ? 'rgba(18,22,62,0.42)' : 'rgba(120,70,110,0.16)';
        g.fillRect(0, 0, WW, WH);
      }
      (info.lanterns || []).forEach(([lx, ly], i) => {
        const flick = Math.sin(t / 7 + i * 1.7) > 0.85 ? 1 : 0;
        if (tod !== 'day') {
          for (let r = 12; r > 0; r -= 4) {
            g.fillStyle = `rgba(255,170,90,${0.05 + (12 - r) * 0.008})`;
            PX.disc(g, lx + 2, ly + 4, r + flick, g.fillStyle);
          }
        }
        lanternDraw(g, lx, ly, tod !== 'day' ? flick : 0);
      });
      if (this.fade > 0) {
        g.fillStyle = `rgba(15,12,30,${this.fade})`;
        g.fillRect(0, 0, WW, WH);
      }
    }
  }
  function lanternDraw(g, x, y, flick) {
    PX.vline(g, x + 2, y - 5, y - 1, C.wood[0]);
    PX.rect(g, x, y, 5, 1, C.gold[1]);
    PX.rect(g, x - 1, y + 1, 7, 6, C.lantern[1]);
    PX.rect(g, x, y + 1, 5, 6, flick ? C.lantern[3] : C.lantern[2]);
    PX.vline(g, x + 1, y + 2, y + 5, C.lantern[3]);
    PX.rect(g, x, y + 7, 5, 1, C.gold[1]);
    PX.vline(g, x + 2, y + 8, y + 10, C.gold[2]);
  }
  Wd.Stage = Stage;
})();
