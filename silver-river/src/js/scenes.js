/* Silver River — painted backgrounds. Every scene is an SVG string (viewBox 800x600, sliced to fill),
   tinted by season ('autumn'|'winter'|'spring'|'summer') and time of day ('day'|'dusk'|'night'). */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const f = U.f;
  const S = (G.Scenes = {});
  let uid = 0;

  // deterministic scatter so a scene never "jumps" when re-rendered
  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }

  const SKY = {
    day: {
      spring: ['#9fd0f2', '#d9ecfa', '#fde6ee'],
      summer: ['#6fbdf0', '#bfe3fb', '#eef9ff'],
      autumn: ['#8cc2e6', '#f6dcc0', '#fdeede'],
      winter: ['#b8cbe4', '#dfe7f3', '#f6f7fb'],
    },
    dusk: ['#4e4f96', '#d98a8e', '#fbc98f'],
    night: ['#0c1030', '#1d2656', '#3a3d78'],
  };
  const FOLIAGE = {
    spring: ['#f7b8c9', '#fbd3de', '#f094ad', '#fde8ee'],
    summer: ['#7fbf7a', '#9fd48f', '#5fa564', '#c3e6a8'],
    autumn: ['#f0a04b', '#e5703f', '#f6c35a', '#d4553a'],
    winter: ['#ffffff', '#eef3fa', '#e25f6e', '#f7c6cf'],
  };

  function defsSky(id, tod, season) {
    const c = tod === 'day' ? SKY.day[season] || SKY.day.spring : SKY[tod];
    return `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`;
  }

  function stars(id, n, seed, x0, y0, w, h, maxR = 1.8) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, rr = 0.4 + r() * maxR;
      const tw = r() < 0.3 ? ' class="twinkle" style="animation-delay:' + f(r() * 4) + 's"' : '';
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="#fffbe8" opacity="${f(0.4 + r() * 0.6)}"${tw}/>`;
    }
    return s;
  }

  function milkyWay(id, seed) {
    const r = rng(seed);
    let s = `<path d="M-40,140 C200,40 520,40 860,-40 L860,90 C520,170 200,190 -40,280Z" fill="url(#${id}mw)" opacity=".75"/>`;
    for (let i = 0; i < 220; i++) {
      const u = r();
      const x = -40 + u * 900;
      const mid = 210 - u * 230 + (r() - 0.5) * 110;
      s += `<circle cx="${f(x)}" cy="${f(mid)}" r="${f(0.3 + r() * 1.3)}" fill="#fff" opacity="${f(0.3 + r() * 0.7)}"/>`;
    }
    return s;
  }

  function moon(x, y, r, id) {
    return `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#${id}glow)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff6d6"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="#f1e3b5" opacity=".6"/><circle cx="${x + r * 0.28}" cy="${y + r * 0.3}" r="${r * 0.12}" fill="#f1e3b5" opacity=".6"/>`;
  }

  function mountains(seed, baseY, colors, amp = 120) {
    const r = rng(seed);
    let s = '';
    colors.forEach((col, li) => {
      const y0 = baseY + li * 34;
      let d = `M-20,${y0 + 60}`;
      let x = -20;
      while (x < 840) {
        const w = 70 + r() * 120;
        const h = (amp - li * 24) * (0.5 + r() * 0.6);
        d += `Q${f(x + w * 0.35)},${f(y0 - h)} ${f(x + w * 0.5)},${f(y0 - h * 0.92)}Q${f(x + w * 0.7)},${f(y0 - h * 0.6)} ${f(x + w)},${f(y0 + r() * 20)}`;
        x += w;
      }
      d += `L840,620L-20,620Z`;
      s += `<path d="${d}" fill="${col}"/>`;
      s += `<rect x="-20" y="${y0 - 10}" width="880" height="80" fill="#fff" opacity="${f(0.12 + li * 0.04)}"/>`;
    });
    return s;
  }

  function cloud(x, y, sc, col, op = 0.9) {
    return `<g transform="translate(${f(x)},${f(y)}) scale(${sc})" opacity="${op}"><path d="M0,0c-18,0 -22,-24 -4,-28c2,-18 30,-22 38,-6c10,-12 34,-6 32,10c20,0 20,24 2,24Z" fill="${col}"/><path d="M8,-10c4,-8 14,-8 16,0c2,6 -6,8 -8,4" stroke="${U.tone(col, -0.12)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M40,-4c3,-7 12,-6 13,1" stroke="${U.tone(col, -0.12)}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  }

  function roof(x, y, w, h, col, ridge) {
    const e = w * 0.12;
    const dark = U.tone(col, -0.14);
    let s = `<path d="M${f(x - e)},${f(y + h)}Q${f(x + e * 0.2)},${f(y + h * 0.78)} ${f(x + e)},${f(y + h * 0.2)}L${f(x + w - e)},${f(y + h * 0.2)}Q${f(x + w - e * 0.2)},${f(y + h * 0.78)} ${f(x + w + e)},${f(y + h)}Q${f(x + w / 2)},${f(y + h * 0.84)} ${f(x - e)},${f(y + h)}Z" fill="${col}"/>`;
    for (let i = 1; i < 12; i++) {
      const xx = x + (w * i) / 12;
      s += `<path d="M${f(xx)},${f(y + h * 0.22)}L${f(xx + (xx - (x + w / 2)) * 0.08)},${f(y + h * 0.9)}" stroke="${dark}" stroke-width="1.5" opacity=".5"/>`;
    }
    s += `<path d="M${f(x + e * 0.6)},${f(y + h * 0.2)}L${f(x + w - e * 0.6)},${f(y + h * 0.2)}" stroke="${ridge || dark}" stroke-width="${f(h * 0.14)}" stroke-linecap="round"/>`;
    s += `<path d="M${f(x + e * 0.4)},${f(y + h * 0.22)}q-6,-10 -2,-18M${f(x + w - e * 0.4)},${f(y + h * 0.22)}q6,-10 2,-18" stroke="${ridge || dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return s;
  }

  function lantern(x, y, r, col = '#d93a3a', lit = true, id) {
    let s = '';
    if (lit) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="url(#${id}lglow)"/>`;
    s += `<path d="M${f(x)},${f(y - r * 2.4)}L${f(x)},${f(y - r)}" stroke="#5a3a2a" stroke-width="1.5"/>`;
    s += `<rect x="${f(x - r * 0.5)}" y="${f(y - r * 1.05)}" width="${f(r)}" height="${f(r * 0.25)}" fill="#e6b64d"/>`;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.86)}" fill="${col}"/>`;
    s += `<path d="M${f(x)},${f(y - r * 0.84)}Q${f(x - r * 0.9)},${f(y)} ${f(x)},${f(y + r * 0.84)}M${f(x)},${f(y - r * 0.84)}Q${f(x + r * 0.9)},${f(y)} ${f(x)},${f(y + r * 0.84)}" stroke="${U.tone(col, -0.2)}" stroke-width="1.2" fill="none"/>`;
    s += `<ellipse cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" rx="${f(r * 0.22)}" ry="${f(r * 0.3)}" fill="#fff" opacity=".35"/>`;
    s += `<rect x="${f(x - r * 0.5)}" y="${f(y + r * 0.8)}" width="${f(r)}" height="${f(r * 0.25)}" fill="#e6b64d"/>`;
    s += `<path d="M${f(x)},${f(y + r * 1.05)}l0,${f(r * 0.9)}" stroke="#e6b64d" stroke-width="2.5"/>`;
    return s;
  }

  function tree(x, y, sc, season, seed, kind) {
    const r = rng(seed);
    const col = FOLIAGE[season];
    let s = `<g transform="translate(${f(x)},${f(y)}) scale(${sc})">`;
    s += `<path d="M-8,0C-6,-60 -14,-110 -4,-160C6,-120 10,-60 10,0Z" fill="#6b4a3a"/>`;
    s += `<path d="M-4,-120C-30,-150 -70,-160 -100,-190M0,-140C20,-170 60,-180 90,-210M-2,-160C-6,-190 6,-220 0,-250M4,-90C30,-100 60,-100 80,-120" stroke="#6b4a3a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    if (season === 'winter') {
      s += `<path d="M-4,-120C-30,-150 -70,-160 -100,-190M0,-140C20,-170 60,-180 90,-210M4,-90C30,-100 60,-100 80,-120" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0,-4)" opacity=".9"/>`;
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2, d = 40 + r() * 150;
        const px = Math.cos(a) * d * 0.8, py = -150 - Math.abs(Math.sin(a)) * d * 0.6;
        s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(4 + r() * 3)}" fill="${r() < 0.7 ? '#e25f6e' : '#f7c6cf'}"/>`;
      }
    } else {
      const n = kind === 'willow' ? 0 : 34;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = r() * 130;
        const px = Math.cos(a) * d, py = -175 + Math.sin(a) * d * 0.55;
        s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(22 + r() * 26)}" fill="${col[i % col.length]}" opacity="${f(0.75 + r() * 0.25)}"/>`;
      }
      if (kind === 'willow') {
        for (let i = 0; i < 18; i++) {
          const px = -110 + i * 13 + r() * 6;
          s += `<path d="M${f(px)},${f(-200 + Math.abs(px) * 0.3)}q${f(r() * 10 - 5)},60 ${f(r() * 16 - 8)},${f(120 + r() * 60)}" stroke="${col[i % 3]}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>`;
        }
      }
    }
    return s + '</g>';
  }

  function lattice(x, y, w, h, col, id) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}lat)" stroke="${col}" stroke-width="6"/>`;
  }

  function banner(x, y, ch, col = '#c7364a') {
    return `<rect x="${f(x)}" y="${f(y)}" width="34" height="96" rx="3" fill="${col}"/><rect x="${f(x + 3)}" y="${f(y + 3)}" width="28" height="90" rx="2" fill="none" stroke="#f2cf7a" stroke-width="1.5"/><text x="${f(x + 17)}" y="${f(y + 60)}" font-size="26" text-anchor="middle" fill="#fff6dc" font-family="'Ma Shan Zheng','Zhi Mang Xing',serif">${ch}</text>`;
  }

  function nightTint(id, tod) {
    if (tod === 'night') return `<rect width="800" height="600" fill="#101540" opacity=".42"/>`;
    if (tod === 'dusk') return `<rect width="800" height="600" fill="#f08a5d" opacity=".16"/>`;
    return '';
  }

  function outdoorBase(id, o, extra = {}) {
    const { season, tod } = o;
    let s = `<rect width="800" height="600" fill="url(#${id}sky)"/>`;
    if (tod === 'night') {
      s += stars(id, 140, 7, 0, 0, 800, 330);
      if (extra.milky !== false) s += milkyWay(id, 11);
      s += moon(640, 90, 26, id);
    } else {
      s += cloud(120, 90, 1.1, '#ffffff', 0.85) + cloud(560, 60, 0.9, '#ffffff', 0.7);
      if (tod === 'dusk') s += `<circle cx="620" cy="250" r="60" fill="#ffd9a0" opacity=".7"/>`;
    }
    return s;
  }

  // ---------------------------------------------------------------- scene painters
  const P = {};

  P.home = (id, o) => {
    const { season, tod } = o;
    const wall = '#f3e3cb', wood = '#b77a4e', woodD = '#8e5a38';
    let s = `<rect width="800" height="600" fill="${wall}"/>`;
    s += `<rect width="800" height="600" fill="url(#${id}paper)" opacity=".5"/>`;
    // moon window with the season outside
    s += `<clipPath id="${id}mw"><circle cx="190" cy="250" r="150"/></clipPath>`;
    s += `<g clip-path="url(#${id}mw)"><rect x="30" y="90" width="330" height="330" fill="url(#${id}sky)"/>`;
    s += tod === 'night' ? stars(id, 50, 3, 40, 90, 320, 200) + moon(260, 150, 18, id) : cloud(80, 170, 0.8, '#fff', 0.8);
    s += mountains(5, 330, ['#b6c8d8', '#98b0c4'], 80);
    s += tree(250, 470, 0.95, season, 21);
    if (season === 'winter') s += `<rect x="30" y="380" width="330" height="60" fill="#f7f9fd"/>`;
    s += `</g>`;
    s += `<circle cx="190" cy="250" r="150" fill="none" stroke="${wood}" stroke-width="16"/><circle cx="190" cy="250" r="160" fill="none" stroke="${woodD}" stroke-width="3"/>`;
    // lattice panels on the right wall
    s += lattice(560, 70, 200, 300, woodD, id);
    s += `<rect x="560" y="70" width="200" height="300" fill="#fffaf0" opacity="${tod === 'night' ? 0.15 : 0.35}"/>`;
    // hanging scroll
    s += `<rect x="420" y="70" width="90" height="220" fill="#fbf6ea" stroke="#d8c6a6" stroke-width="2"/><rect x="414" y="64" width="102" height="10" rx="5" fill="${woodD}"/><rect x="414" y="286" width="102" height="10" rx="5" fill="${woodD}"/>`;
    s += `<text x="465" y="140" font-size="34" text-anchor="middle" fill="#3a2a2a" font-family="'Ma Shan Zheng',serif">家</text><text x="465" y="190" font-size="34" text-anchor="middle" fill="#3a2a2a" font-family="'Ma Shan Zheng',serif">和</text><rect x="455" y="226" width="20" height="20" fill="#c7364a"/>`;
    // floor, low table, shelf items driven by her life
    s += `<rect x="0" y="470" width="800" height="130" fill="#caa27a"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${i * 100},470L${i * 100 - 60},600" stroke="#b68d64" stroke-width="2"/>`;
    s += `<rect x="0" y="462" width="800" height="12" fill="${woodD}"/>`;
    s += `<rect x="600" y="400" width="170" height="16" fill="${wood}"/><rect x="608" y="416" width="10" height="56" fill="${woodD}"/><rect x="752" y="416" width="10" height="56" fill="${woodD}"/>`;
    const items = o.items || {};
    if (items.books) for (let i = 0; i < Math.min(6, items.books); i++) s += `<rect x="${612 + i * 13}" y="${370 - (i % 2) * 6}" width="11" height="${30 + (i % 2) * 6}" fill="${['#2f4166', '#c7364a', '#5f9072', '#e6b64d'][i % 4]}" rx="2"/>`;
    if (items.sword) s += `<path d="M700,300L780,220" stroke="#d9dde6" stroke-width="5" stroke-linecap="round"/><path d="M696,304L710,290M688,296L704,312" stroke="#8e5a38" stroke-width="5" stroke-linecap="round"/>`;
    if (items.guqin) s += `<rect x="690" y="372" width="76" height="16" rx="8" fill="#6b3a2a"/><path d="M696,378L760,378M696,382L760,382" stroke="#f3e3cb" stroke-width=".8"/>`;
    if (items.flowers) s += `<rect x="730" y="360" width="22" height="30" rx="5" fill="#8fb9df"/>` + '<circle cx="736" cy="352" r="7" fill="#f7a8bd"/><circle cx="748" cy="348" r="6" fill="#fbd3de"/>';
    if (items.drawing) s += `<rect x="330" y="120" width="60" height="70" fill="#fffdf6" stroke="#d8c6a6" transform="rotate(-6 360 155)"/><circle cx="352" cy="150" r="9" fill="none" stroke="#e36d6d" stroke-width="2" transform="rotate(-6 360 155)"/><circle cx="372" cy="156" r="7" fill="none" stroke="#4a8cc4" stroke-width="2"/>`;
    // lantern
    s += lantern(520, 360, 22, '#d93a3a', tod !== 'day', id);
    s += nightTint(id, tod);
    return s;
  };

  P.courtyard = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(3, 300, ['#b9cadc', '#9fb5ca'], 90);
    s += `<rect x="0" y="250" width="800" height="200" fill="#e9dcc8"/>`;
    s += roof(-40, 170, 360, 90, '#5b6474', '#3e4552');
    s += roof(470, 170, 380, 90, '#5b6474', '#3e4552');
    s += `<rect x="-20" y="258" width="320" height="200" fill="#f3e6d2"/><rect x="480" y="258" width="340" height="200" fill="#f3e6d2"/>`;
    [20, 150, 280, 500, 640, 770].forEach((x) => (s += `<rect x="${x}" y="258" width="16" height="200" fill="#b8323f"/>`));
    s += `<rect x="0" y="450" width="800" height="150" fill="${season === 'winter' ? '#f4f6fb' : '#d8c8ae'}"/>`;
    for (let i = 0; i < 10; i++) s += `<rect x="${i * 90 - 20}" y="${470 + (i % 2) * 40}" width="80" height="30" rx="4" fill="${season === 'winter' ? '#e6ebf3' : '#c9b89c'}"/>`;
    s += tree(400, 470, 1.25, season, 33);
    s += lantern(120, 300, 20, '#d93a3a', tod !== 'day', id) + lantern(680, 300, 20, '#d93a3a', tod !== 'day', id);
    s += nightTint(id, tod);
    return s;
  };

  P.town = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(9, 260, ['#bccde0', '#a3b8cd'], 100);
    const bld = (x, y, w, h, wall, rf) => roof(x - 10, y - 60, w + 20, 70, rf) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>` + `<rect x="${x + w * 0.2}" y="${y + h * 0.3}" width="${w * 0.6}" height="${h * 0.7}" fill="${U.tone(wall, -0.25)}"/>`;
    s += bld(-10, 280, 200, 220, '#f0dcc0', '#4f5868') + bld(600, 270, 220, 230, '#f0dcc0', '#4f5868');
    s += bld(210, 320, 140, 180, '#ead2b2', '#5b6474') + bld(450, 320, 140, 180, '#ead2b2', '#5b6474');
    s += banner(160, 300, '茶') + banner(612, 290, '面', '#2f6a64') + banner(420, 340, '药', '#6b3a8a');
    s += `<rect x="0" y="500" width="800" height="100" fill="${season === 'winter' ? '#f2f4f9' : '#cdb89a'}"/>`;
    // lantern strings
    s += `<path d="M0,180Q400,260 800,180" stroke="#5a3a2a" stroke-width="2" fill="none"/>`;
    for (let i = 1; i < 10; i++) {
      const x = i * 80, y = 180 + Math.sin((i / 10) * Math.PI) * 58;
      s += lantern(x, y + 22, 13, i % 3 === 0 ? '#f2b33d' : '#d93a3a', tod !== 'day', id);
    }
    s += nightTint(id, tod);
    return s;
  };

  P.market = (id, o) => {
    let s = P.town(id, o);
    const cols = ['#d93a3a', '#f2b33d', '#5f9072', '#4a8cc4'];
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 200;
      s += `<path d="M${x},420L${x + 160},420L${x + 150},390L${x + 10},390Z" fill="${cols[i]}"/><path d="M${x + 10},390L${x + 150},390" stroke="#fff" stroke-width="3" stroke-dasharray="14 14"/><rect x="${x + 14}" y="420" width="132" height="70" fill="#a8764f"/>`;
    }
    return s;
  };

  P.hall = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o, { milky: false });
    s += mountains(13, 230, ['#b5c7d9', '#97aec4'], 110);
    s += roof(80, 110, 640, 120, '#3e4552', '#2c313b');
    s += `<rect x="120" y="215" width="560" height="220" fill="#f1e2c9"/>`;
    [140, 260, 520, 640].forEach((x) => (s += `<rect x="${x}" y="215" width="22" height="220" fill="#b8323f"/>`));
    s += `<rect x="330" y="232" width="140" height="64" fill="#2c313b" stroke="#e6b64d" stroke-width="4"/><text x="400" y="282" font-size="46" text-anchor="middle" fill="#f2cf7a" font-family="'Ma Shan Zheng',serif">武</text>`;
    s += `<rect x="0" y="430" width="800" height="170" fill="${season === 'winter' ? '#eef1f7' : '#d9c7a6'}"/>`;
    // weapon rack & training post
    s += `<rect x="40" y="330" width="120" height="10" fill="#8e5a38"/><rect x="40" y="410" width="120" height="10" fill="#8e5a38"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${56 + i * 28},300L${56 + i * 28},440" stroke="#8e5a38" stroke-width="5"/><path d="M${56 + i * 28},300l-6,-22l12,0z" fill="#cfd6e2"/><path d="M${50 + i * 28},318l12,0" stroke="#c7364a" stroke-width="5"/>`;
    s += `<rect x="690" y="330" width="26" height="140" rx="10" fill="#9a6a44"/><rect x="664" y="360" width="78" height="12" rx="6" fill="#9a6a44"/><rect x="668" y="400" width="70" height="12" rx="6" fill="#9a6a44"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.academy = (id, o) => {
    const { season, tod } = o;
    let s = `<rect width="800" height="600" fill="#efe1c8"/><rect width="800" height="600" fill="url(#${id}paper)" opacity=".5"/>`;
    // window with bamboo
    s += `<rect x="60" y="90" width="240" height="250" fill="url(#${id}sky)"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${90 + i * 38},340L${96 + i * 38},80" stroke="${season === 'winter' ? '#9fb89a' : '#6fa06a'}" stroke-width="9"/>` + `<path d="M${96 + i * 38},${160 + i * 20}q30,-10 44,6M${94 + i * 38},${230 + i * 12}q-30,-10 -40,8" stroke="${season === 'winter' ? '#b8ccb4' : '#8cc486'}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += lattice(60, 90, 240, 250, '#7a4e32', id);
    // shelves of scrolls
    s += `<rect x="440" y="70" width="320" height="330" fill="#8e5a38"/>`;
    for (let r = 0; r < 4; r++) {
      s += `<rect x="452" y="${86 + r * 78}" width="296" height="66" fill="#6b4029"/>`;
      for (let c = 0; c < 9; c++) {
        const col = ['#f6ead0', '#e9d6b2', '#f3e2c0'][(r + c) % 3];
        s += `<ellipse cx="${474 + c * 31}" cy="${128 + r * 78}" rx="13" ry="13" fill="${col}"/><circle cx="${474 + c * 31}" cy="${128 + r * 78}" r="4" fill="#a8764f"/>`;
      }
    }
    s += `<rect x="330" y="80" width="80" height="200" fill="#fbf6ea" stroke="#d8c6a6" stroke-width="2"/><text x="370" y="150" font-size="34" text-anchor="middle" fill="#3a2a2a" font-family="'Ma Shan Zheng',serif">学</text><text x="370" y="200" font-size="34" text-anchor="middle" fill="#3a2a2a" font-family="'Ma Shan Zheng',serif">海</text>`;
    s += `<rect x="0" y="470" width="800" height="130" fill="#b48a62"/><rect x="0" y="462" width="800" height="12" fill="#7a4e32"/>`;
    s += `<rect x="60" y="430" width="220" height="18" fill="#6b4029"/><rect x="72" y="448" width="12" height="40" fill="#5a3522"/><rect x="256" y="448" width="12" height="40" fill="#5a3522"/><rect x="120" y="416" width="60" height="14" fill="#fbf6ea"/><path d="M200,420l30,-30" stroke="#3a2a2a" stroke-width="4" stroke-linecap="round"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.temple = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o, { milky: false });
    s += mountains(17, 250, ['#c2d0dd', '#a8bccd'], 120);
    s += tree(90, 470, 1.1, season === 'spring' || season === 'autumn' ? season : 'summer', 44);
    s += roof(200, 120, 400, 100, '#e0a940', '#b8862e');
    s += roof(250, 50, 300, 80, '#e0a940', '#b8862e');
    s += `<rect x="240" y="210" width="320" height="200" fill="#c7364a"/><rect x="300" y="250" width="200" height="160" fill="#8a2230"/>`;
    s += `<rect x="340" y="226" width="120" height="44" fill="#2c313b" stroke="#e6b64d" stroke-width="3"/><text x="400" y="260" font-size="30" text-anchor="middle" fill="#f2cf7a" font-family="'Ma Shan Zheng',serif">云寺</text>`;
    s += `<path d="M180,410L620,410L660,470L140,470Z" fill="#e8e2d8"/><path d="M140,470L660,470L700,520L100,520Z" fill="#dcd5c8"/>`;
    s += `<rect x="0" y="520" width="800" height="80" fill="${season === 'winter' ? '#f4f6fb' : '#cdbd9f'}"/>`;
    // incense burner with smoke
    s += `<path d="M640,470l60,0l-8,40l-44,0z" fill="#7a5a3a"/><ellipse cx="670" cy="470" rx="34" ry="8" fill="#9a7a4a"/>`;
    s += `<path d="M664,462q-10,-30 6,-50q12,-18 -2,-40M676,462q10,-26 -4,-46q-10,-18 6,-36" stroke="#fff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.teahouse = (id, o) => {
    const { season, tod } = o;
    let s = `<rect width="800" height="600" fill="#e8d3b4"/><rect width="800" height="600" fill="url(#${id}paper)" opacity=".4"/>`;
    s += `<rect x="40" y="80" width="460" height="260" fill="url(#${id}sky)"/>`;
    s += `<rect x="40" y="250" width="460" height="90" fill="#9fc6d6"/>`;
    s += mountains(23, 260, ['#b5c9d6', '#9ab3c6'], 80).replace(/M-20/g, 'M40');
    s += tree(420, 330, 0.55, season, 51, 'willow');
    s += `<rect x="40" y="80" width="460" height="260" fill="none" stroke="#6b4029" stroke-width="14"/><path d="M270,80L270,340M40,210L500,210" stroke="#6b4029" stroke-width="8"/>`;
    s += `<rect x="560" y="60" width="200" height="360" fill="#6b4029"/><rect x="576" y="76" width="168" height="328" fill="#c7364a"/>`;
    s += `<text x="660" y="190" font-size="54" text-anchor="middle" fill="#f6dc9a" font-family="'Ma Shan Zheng',serif">茶</text><text x="660" y="270" font-size="54" text-anchor="middle" fill="#f6dc9a" font-family="'Ma Shan Zheng',serif">香</text>`;
    s += `<rect x="0" y="460" width="800" height="140" fill="#a8764f"/><rect x="80" y="420" width="260" height="16" fill="#6b4029"/><rect x="96" y="436" width="12" height="60" fill="#5a3522"/><rect x="312" y="436" width="12" height="60" fill="#5a3522"/>`;
    s += `<path d="M150,420q0,-26 22,-26q22,0 22,26z" fill="#eef4f2" stroke="#8aa9a2" stroke-width="2"/><path d="M194,406q14,-4 16,-14" stroke="#8aa9a2" stroke-width="3" fill="none"/><rect x="230" y="406" width="20" height="14" rx="3" fill="#eef4f2" stroke="#8aa9a2" stroke-width="2"/><rect x="262" y="406" width="20" height="14" rx="3" fill="#eef4f2" stroke="#8aa9a2" stroke-width="2"/>`;
    s += lantern(520, 120, 20, '#d93a3a', tod !== 'day', id);
    s += nightTint(id, tod);
    return s;
  };

  P.kitchen = (id, o) => {
    const { tod } = o;
    let s = `<rect width="800" height="600" fill="#ead6ba"/><rect width="800" height="600" fill="url(#${id}paper)" opacity=".4"/>`;
    s += `<rect x="0" y="300" width="800" height="300" fill="#c9b08e"/>`;
    // stove
    s += `<rect x="60" y="300" width="320" height="170" rx="10" fill="#9c6b4a"/><rect x="100" y="400" width="80" height="50" rx="8" fill="#3a2a2a"/><path d="M118,440q12,-30 22,-6q10,-26 22,6" fill="#f2a23a"/>`;
    // steamer stack
    for (let i = 0; i < 4; i++) s += `<ellipse cx="270" cy="${292 - i * 34}" rx="70" ry="16" fill="#d8b77e"/><rect x="200" y="${262 - i * 34}" width="140" height="30" fill="#cfa96c"/><path d="M200,${276 - i * 34}L340,${276 - i * 34}" stroke="#a8844a" stroke-width="2"/>`;
    s += `<ellipse cx="270" cy="156" rx="70" ry="16" fill="#e0c28a"/><path d="M250,140q-10,-26 6,-40M290,140q10,-24 -4,-40" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`;
    // shelf with jars and hanging garlic/chilies
    s += `<rect x="460" y="150" width="300" height="12" fill="#6b4029"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${480 + i * 56},150q-18,-4 -14,-40q16,-10 30,0q4,36 -16,40z" fill="${['#6b8fb5', '#c9594f', '#e0b04a', '#5f9072', '#8a6a4a'][i]}"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${500 + i * 44},40l0,${40 + (i % 3) * 20}" stroke="#6b4029" stroke-width="2"/><ellipse cx="${500 + i * 44}" cy="${90 + (i % 3) * 20}" rx="8" ry="14" fill="${i % 2 ? '#d93a3a' : '#f6efe0'}"/>`;
    s += `<rect x="440" y="360" width="340" height="20" fill="#7a4e32"/><circle cx="520" cy="352" r="12" fill="#f6efe0"/><circle cx="548" cy="354" r="10" fill="#f6efe0"/><circle cx="572" cy="352" r="12" fill="#f6efe0"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.observatory = (id, o) => {
    let s = `<rect width="800" height="600" fill="url(#${id}sky)"/>`;
    s += stars(id, 220, 5, 0, 0, 800, 460, 2) + milkyWay(id, 19);
    s += mountains(29, 420, ['#1d2250', '#151a3c'], 90);
    s += `<path d="M0,500Q400,450 800,500L800,600L0,600Z" fill="#11152f"/>`;
    // armillary sphere
    s += `<g transform="translate(610,380)" stroke="#e6b64d" fill="none" stroke-width="5"><ellipse rx="90" ry="90"/><ellipse rx="90" ry="30" transform="rotate(-24)"/><ellipse rx="30" ry="90" transform="rotate(20)"/><circle r="10" fill="#e6b64d"/><path d="M0,90L0,150M-50,150L50,150" stroke-width="8"/></g>`;
    return s;
  };

  P.palace = (id, o) => {
    const { tod } = o;
    let s = outdoorBase(id, o, { milky: false });
    s += `<rect x="0" y="260" width="800" height="340" fill="#b8323f"/>`;
    s += roof(40, 90, 720, 150, '#e0a940', '#b8862e');
    s += roof(160, 10, 480, 110, '#e0a940', '#b8862e');
    s += `<rect x="80" y="232" width="640" height="200" fill="#c7364a"/>`;
    for (let i = 0; i < 7; i++) s += `<rect x="${100 + i * 100}" y="232" width="20" height="200" fill="#8a2230"/>`;
    s += `<rect x="330" y="250" width="140" height="50" fill="#1f3f8a" stroke="#e6b64d" stroke-width="4"/><text x="400" y="286" font-size="30" text-anchor="middle" fill="#f2cf7a" font-family="'Ma Shan Zheng',serif">太和殿</text>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${140 - i * 24}" y="${430 + i * 28}" width="${520 + i * 48}" height="28" fill="${i % 2 ? '#efe9df' : '#f7f3ec'}"/>`;
    s += lantern(170, 330, 24, '#d93a3a', tod !== 'day', id) + lantern(630, 330, 24, '#d93a3a', tod !== 'day', id);
    s += nightTint(id, tod);
    return s;
  };

  P.mountain = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(31, 200, ['#d5dde6', '#b7c6d4', '#94a9bd', '#6f879d'], 170);
    s += `<rect x="0" y="360" width="800" height="120" fill="url(#${id}mist)"/>`;
    s += `<path d="M560,160q14,120 6,260" stroke="#eef6fb" stroke-width="12" opacity=".8" fill="none"/>`;
    // pines
    const pine = (x, y, sc) => `<g transform="translate(${x},${y}) scale(${sc})"><path d="M0,0l0,-70" stroke="#4a3a2a" stroke-width="6"/><path d="M-40,-40q40,-20 80,0q-40,-14 -80,0M-32,-62q32,-18 64,0q-32,-12 -64,0M-22,-82q22,-14 44,0q-22,-10 -44,0" fill="${season === 'winter' ? '#dfe7ef' : '#3f6b50'}" stroke="${season === 'winter' ? '#dfe7ef' : '#3f6b50'}" stroke-width="10" stroke-linejoin="round"/></g>`;
    s += pine(90, 520, 1.3) + pine(160, 540, 1) + pine(720, 530, 1.2);
    s += `<path d="M0,520Q300,480 800,530L800,600L0,600Z" fill="${season === 'winter' ? '#eef2f8' : '#6b8a6a'}"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.lake = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(37, 280, ['#c3d2df', '#a6bbcd'], 100);
    s += `<rect x="0" y="330" width="800" height="270" fill="url(#${id}water)"/>`;
    for (let i = 0; i < 18; i++) s += `<path d="M${(i * 97) % 800},${360 + (i * 37) % 220}q20,-4 40,0" stroke="#fff" stroke-width="2" opacity=".45" fill="none"/>`;
    // arched bridge
    s += `<path d="M420,380Q560,250 700,380" stroke="#f3ede2" stroke-width="16" fill="none"/><path d="M420,380Q560,250 700,380" stroke="#c7364a" stroke-width="3" fill="none" transform="translate(0,-12)"/>`;
    s += `<path d="M450,370Q560,300 670,370" stroke="#d8cfc0" stroke-width="3" fill="none" opacity=".6" transform="translate(0,40) scale(1,-1) translate(0,-760)"/>`;
    if (season === 'summer' || season === 'spring') {
      for (let i = 0; i < 9; i++) {
        const x = 40 + ((i * 131) % 360), y = 470 + ((i * 53) % 110);
        s += `<ellipse cx="${x}" cy="${y}" rx="30" ry="10" fill="#5f9f6a"/>`;
        if (season === 'summer' && i % 2) s += `<path d="M${x},${y - 6}q-8,-16 0,-24q8,8 0,24M${x},${y - 6}q-16,-8 -14,-18q12,2 14,18M${x},${y - 6}q16,-8 14,-18q-12,2 -14,18" fill="#f7a8bd" stroke="#e07a98"/>`;
      }
    }
    if (season === 'winter') s += `<rect x="0" y="330" width="800" height="270" fill="#eef4fb" opacity=".45"/>`;
    s += tree(90, 380, 0.9, season, 61, 'willow');
    s += nightTint(id, tod);
    return s;
  };

  P.night = (id, o) => {
    let s = `<rect width="800" height="600" fill="url(#${id}sky)"/>`;
    s += stars(id, 240, 13, 0, 0, 800, 520, 2.1) + milkyWay(id, 23);
    if (o.magpies) {
      for (let i = 0; i < 16; i++) {
        const x = 120 + i * 36, y = 150 - Math.sin((i / 15) * Math.PI) * 70 + (i % 2) * 6;
        s += `<g transform="translate(${x},${y}) rotate(${-20 + i * 3})" class="bob" style="animation-delay:${(i * 0.13).toFixed(2)}s"><path d="M0,0q10,-10 22,-2q-10,2 -12,8z" fill="#20243a"/><path d="M2,-2q-10,-10 -20,-6q8,4 14,10z" fill="#e8ecf8"/><circle cx="18" cy="-4" r="3" fill="#20243a"/></g>`;
      }
    }
    s += roof(-60, 420, 420, 90, '#141833', '#0d1024') + `<rect x="-40" y="500" width="380" height="100" fill="#141833"/>`;
    s += roof(520, 440, 360, 80, '#141833', '#0d1024') + `<rect x="540" y="512" width="300" height="88" fill="#141833"/>`;
    s += `<rect x="120" y="530" width="30" height="40" fill="#f6c86a" opacity=".85"/><rect x="620" y="540" width="26" height="34" fill="#f6c86a" opacity=".75"/>`;
    return s;
  };

  P.field = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(41, 250, ['#c5d3de', '#a7bccd'], 110);
    const g = season === 'autumn' ? ['#e7c35a', '#d9b04a'] : season === 'winter' ? ['#eef2f8', '#e3e9f2'] : ['#8cc47a', '#76b267'];
    for (let i = 0; i < 6; i++) {
      const y = 300 + i * 52;
      s += `<path d="M-20,${y}Q400,${y - 30} 820,${y}L820,${y + 60}L-20,${y + 60}Z" fill="${g[i % 2]}"/>`;
      s += `<path d="M-20,${y + 6}Q400,${y - 24} 820,${y + 6}" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/>`;
    }
    s += nightTint(id, tod);
    return s;
  };

  P.silk = (id, o) => {
    const { tod } = o;
    let s = `<rect width="800" height="600" fill="#f0e2ee"/><rect width="800" height="600" fill="url(#${id}paper)" opacity=".4"/>`;
    const cols = ['#e4718f', '#8fd1d9', '#f2c14e', '#b06ac9', '#8cc47a', '#f7a8bd', '#4a8cc4'];
    s += `<rect x="40" y="60" width="720" height="10" fill="#8e5a38"/>`;
    cols.forEach((c, i) => {
      s += `<path d="M${80 + i * 100},70Q${60 + i * 100},200 ${90 + i * 100},330L${130 + i * 100},330Q${110 + i * 100},200 ${120 + i * 100},70Z" fill="${c}" opacity=".85"/>`;
    });
    // loom
    s += `<rect x="440" y="360" width="300" height="14" fill="#8e5a38"/><rect x="450" y="374" width="12" height="130" fill="#8e5a38"/><rect x="718" y="374" width="12" height="130" fill="#8e5a38"/>`;
    for (let i = 0; i < 24; i++) s += `<path d="M${470 + i * 11},374L${470 + i * 11},470" stroke="#fdf7ff" stroke-width="2"/>`;
    s += `<rect x="462" y="440" width="258" height="30" fill="#b06ac9" opacity=".8"/>`;
    s += `<rect x="0" y="500" width="800" height="100" fill="#c9a98a"/>`;
    s += nightTint(id, tod);
    return s;
  };

  P.garden = (id, o) => {
    const { season, tod } = o;
    let s = outdoorBase(id, o);
    s += mountains(47, 280, ['#c7d6e2', '#aec2d3'], 90);
    s += `<path d="M-20,380Q300,320 820,390L820,600L-20,600Z" fill="${season === 'winter' ? '#f1f4fa' : season === 'autumn' ? '#d9b46a' : '#9fcf88'}"/>`;
    s += tree(110, 470, 1.1, season, 71) + tree(700, 450, 1.0, season, 73) + tree(420, 400, 0.6, season, 75);
    if (season !== 'winter') {
      const r = rng(81);
      for (let i = 0; i < 40; i++) s += `<circle cx="${f(r() * 800)}" cy="${f(420 + r() * 170)}" r="${f(2 + r() * 3)}" fill="${['#fff', '#f7a8bd', '#f2d46a'][i % 3]}" opacity=".9"/>`;
    }
    s += nightTint(id, tod);
    return s;
  };

  P.sky = (id) => {
    let s = `<rect width="800" height="600" fill="url(#${id}sky)"/>`;
    s += stars(id, 260, 97, 0, 0, 800, 600, 2.4) + milkyWay(id, 29);
    return s;
  };

  S.list = Object.keys(P);

  /** o = { season, tod, items, magpies } */
  S.render = function (name, o = {}) {
    const id = 'sc' + ++uid + '_';
    const season = o.season || 'spring';
    let tod = o.tod || 'day';
    if (name === 'observatory' || name === 'night' || name === 'sky') tod = 'night';
    const opts = Object.assign({}, o, { season, tod });
    const painter = P[name] || P.home;
    const defs = `<defs>${defsSky(id, tod, season)}
      <linearGradient id="${id}mw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b8ff" stop-opacity="0"/><stop offset=".5" stop-color="#e9e4ff" stop-opacity=".55"/><stop offset="1" stop-color="#b9b8ff" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id}glow"><stop offset="0" stop-color="#fff6d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}lglow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fcde0"/><stop offset="1" stop-color="#5f9fbf"/></linearGradient>
      <linearGradient id="${id}mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <pattern id="${id}lat" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fdf6e6" opacity=".35"/><path d="M0,20L40,20M20,0L20,40M0,0L40,40M40,0L0,40" stroke="#7a4e32" stroke-width="3" opacity=".7"/></pattern>
      <pattern id="${id}paper" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0,30q30,-8 60,0t60,0M0,90q30,-8 60,0t60,0" stroke="#d9c3a0" stroke-width="1" fill="none" opacity=".35"/></pattern>
    </defs>`;
    return `<svg class="scene-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${painter(id, opts)}</svg>`;
  };
})();
