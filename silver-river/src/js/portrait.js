/* Silver River — 64x64 dialogue portraits in a Stardew-like pixel style.
   Shapes are rasterised at pixel level, shaded with hand-picked hue-shifted ramps, outlined selectively,
   then the face details (eyes, brows, nose, mouth) are stamped from hand-drawn pixel stamps. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const P = (G.Portrait = {});
  const W = 64, H = 64;

  // ---------------------------------------------------------------- ramps (dark -> light)
  P.SKIN = {
    porcelain: ['#6b3240', '#a65a5d', '#d68e80', '#f1b9a6', '#fcd9ca', '#fff0e8'],
    fair: ['#6a2d35', '#a54f4d', '#d07a66', '#eba586', '#f9c8aa', '#ffe3cf'],
    warm: ['#5c2a2a', '#98483b', '#c67058', '#e19a79', '#f2c09d', '#fcdcc2'],
    tan: ['#482220', '#7a3d2f', '#a55f47', '#c6825c', '#e0a67b', '#f1c69e'],
    deep: ['#2c1313', '#522820', '#784130', '#985c43', '#b87b59', '#d19a75'],
  };
  P.HAIR = {
    gold: ['#6e3417', '#b3641f', '#dc9431', '#f1bd46', '#fbdb6f', '#fff5b6'],
    ink: ['#0c0912', '#1b1625', '#2b2337', '#3d3350', '#56496e', '#7b6d97'],
    chestnut: ['#2d130d', '#56261a', '#7e3e26', '#a55b35', '#c77f4e', '#e5a776'],
    silver: ['#474a6a', '#777c9f', '#a2a7c7', '#c8cce3', '#e5e7f5', '#ffffff'],
    rose: ['#5c2137', '#933f5b', '#c76583', '#ea93aa', '#f9bccb', '#ffe1e9'],
    copper: ['#48160b', '#7c2b12', '#b0491c', '#d76f2e', '#ee9a50', '#fac888'],
    plum: ['#22123e', '#3f2769', '#5e3e93', '#7f60ba', '#a388d7', '#ccb9ef'],
  };
  P.EYES = {
    blossom: ['#521631', '#ad3a5e', '#e97c99'],
    amber: ['#552c0b', '#b3691c', '#eea748'],
    jade: ['#0e3829', '#257d58', '#5cc190'],
    sky: ['#142f59', '#3a75bf', '#7cb3ef'],
    violet: ['#2a1656', '#6843b6', '#a387e4'],
    ink: ['#1d100b', '#583425', '#926045'],
  };
  const LINE = '#2d1824';
  const WHITE = '#fff7f2';

  function clothRamp(hex) {
    return [U.tone(hex, -0.42, 0.05, -10), U.tone(hex, -0.22, 0.06, -6), U.tone(hex, -0.1, 0.04, -3), hex, U.tone(hex, 0.07, 0), U.tone(hex, 0.14, -0.05, 4)];
  }

  // ---------------------------------------------------------------- geometry helpers
  function inPoly(poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // sample a Catmull-Rom spline into a dense polyline
  function sampleSpline(pts, closed, per = 6) {
    const out = [];
    const n = pts.length;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
      const p1 = pts[i], p2 = pts[(i + 1) % n];
      const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function bbox(poly) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    poly.forEach(([x, y]) => {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    });
    return [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(W - 1, Math.ceil(x1)), Math.min(H - 1, Math.ceil(y1))];
  }
  // projection of p onto a polyline: returns [u (0..1 along), signed distance]
  function project(line, cum, total, x, y) {
    let best = 1e9, bu = 0, bs = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1];
      const dx = bx - ax, dy = by - ay;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((x - ax) * dx + (y - ay) * dy) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + dx * t, py = ay + dy * t;
      const d = Math.hypot(x - px, y - py);
      if (d < best) {
        best = d;
        bu = (cum[i] + Math.sqrt(L2) * t) / total;
        bs = Math.sign(dx * (y - ay) - dy * (x - ax)) * d;
      }
    }
    return [bu, bs];
  }

  // ---------------------------------------------------------------- canvas-free pixel buffer
  function Buf() {
    this.mat = new Array(W * H).fill(0); // material id
    this.val = new Float32Array(W * H); // shading value 0..1
    this.col = new Array(W * H).fill(null); // final colour override
  }
  const M = { EMPTY: 0, BACKHAIR: 1, SKIN: 2, CLOTH: 3, TRIM: 4, INNER: 5, SKIRT: 6, HAIR: 7, GOLD: 8, RIBBON: 9, FLOWER: 10 };

  function fillPoly(b, poly, mat, shadeFn) {
    const [x0, y0, x1, y1] = bbox(poly);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inPoly(poly, x + 0.5, y + 0.5)) continue;
      const i = y * W + x;
      b.mat[i] = mat;
      b.val[i] = shadeFn ? shadeFn(x + 0.5, y + 0.5) : 0.5;
      b.col[i] = null;
    }
  }

  // a lock of hair along a centreline with a width profile; shading gives clumps
  function fillLock(b, pts, widthFn, mat, light = 0) {
    const line = sampleSpline(pts, false, 5);
    const cum = [0];
    for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const total = cum[cum.length - 1] || 1;
    const L = [], R = [];
    line.forEach((p, i) => {
      const a = line[Math.max(0, i - 1)], c = line[Math.min(line.length - 1, i + 1)];
      let tx = c[0] - a[0], ty = c[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      const w = widthFn(cum[i] / total) / 2;
      L.push([p[0] - ty * w, p[1] + tx * w]);
      R.push([p[0] + ty * w, p[1] - tx * w]);
    });
    const poly = L.concat(R.reverse());
    const [x0, y0, x1, y1] = bbox(poly);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inPoly(poly, x + 0.5, y + 0.5)) continue;
      const [u, s] = project(line, cum, total, x + 0.5, y + 0.5);
      const hw = Math.max(0.6, widthFn(u) / 2);
      const v = U.clamp(s / hw, -1, 1);
      // left side of the lock (screen) catches the light; edges and tips fall into shadow
      let sh = 0.56 + light - v * 0.2 * Math.sign(line[line.length - 1][1] - line[0][1] || 1) - Math.pow(Math.abs(v), 3) * 0.3 - u * 0.12;
      if (u > 0.12 && u < 0.34 && Math.abs(v) < 0.55) sh += 0.22; // highlight band
      const i = y * W + x;
      b.mat[i] = mat;
      b.val[i] = U.clamp(sh, 0, 1);
      b.col[i] = null;
    }
  }

  // ---------------------------------------------------------------- stamps (hand-drawn)
  // keys: k line, w white, 1/2/3 iris dark/mid/light, h highlight, s skin shadow, S skin, t lid (skin mid)
  const EYES = {
    open: ['.kkkkk.', 'kkh11w.', '.w122w.', '.w233w.', '..sss..'],
    happy: ['.......', '.kkkkk.', 'kkh12w.', '.s233s.', '.......'],
    joy: ['.......', '..kkk..', '.k...k.', 'k.....k', '.......'],
    closed: ['.......', '.......', 'k.....k', '.kkkkk.', '.......'],
    sad: ['...kkk.', '.kkh1w.', '.w122w.', '.w233w.', '..sss..'],
    angry: ['.k.....', '.kkkkk.', '.kh12w.', '.w233w.', '..sss..'],
    surprised: ['.kkkkk.', 'kw111wk', '.w1h1w.', '.w222w.', '..www..'],
    half: ['.......', '.kkkkk.', 'kkh11w.', '.w233w.', '..sss..'],
    shy: ['.......', '.kkkkk.', 'kw1h1k.', '.s233s.', '.......'],
    wide: ['.kkkkk.', 'kkh11wk', '.wh22w.', '.w233w.', '..sss..'],
  };
  const BROWS = {
    flat: ['.kkkk.'],
    up: ['..kkk.', 'kk....'],
    down: ['kk....', '..kkkk'],
    worried: ['....kk', '.kkk..'],
    arch: ['.kkk..', 'k...k.'],
  };
  // mouth: k line, r lip, R lip light, m inside dark, n tongue, T teeth
  const MOUTHS = {
    smile: ['k.....k', '.krrrk.', '..rRr..'],
    soft: ['.......', '.kkkkk.', '..rRr..'],
    grin: ['kkkkkkk', '.kTTTk.', '..knk..'],
    laugh: ['kkkkkkk', 'kTTTTTk', '.kmnnk.', '..kkk..'],
    open: ['.kkkkk.', '.kmmmk.', '..knk..'],
    o: ['..kkk..', '.km.mk.', '..kkk..'],
    frown: ['..kkk..', '.k...k.', '.......'],
    flat: ['.......', '..kkk..', '.......'],
    pout: ['.......', '..krk..', '...k...'],
    wavy: ['.......', '.kk.kk.', 'k..k..k'],
    smirk: ['.....k.', '.kkkk..', '..rr...'],
    small: ['.......', '..k.k..', '...k...'],
  };
  const EXPR = {
    neutral: { eyes: 'open', brow: 'flat', mouth: 'soft' },
    happy: { eyes: 'happy', brow: 'arch', mouth: 'smile', blush: 1 },
    joy: { eyes: 'joy', brow: 'arch', mouth: 'grin', blush: 2 },
    laugh: { eyes: 'joy', brow: 'up', mouth: 'laugh', blush: 2 },
    sad: { eyes: 'sad', brow: 'worried', mouth: 'frown' },
    cry: { eyes: 'sad', brow: 'worried', mouth: 'wavy', tears: 2, blush: 1 },
    teary: { eyes: 'happy', brow: 'worried', mouth: 'smile', tears: 1, blush: 2 },
    angry: { eyes: 'angry', brow: 'down', mouth: 'frown', vein: 1 },
    pout: { eyes: 'half', brow: 'down', mouth: 'pout', blush: 2 },
    surprised: { eyes: 'surprised', brow: 'up', mouth: 'o' },
    shy: { eyes: 'shy', brow: 'worried', mouth: 'small', blush: 3 },
    tired: { eyes: 'half', brow: 'worried', mouth: 'flat', sweat: 1 },
    determined: { eyes: 'open', brow: 'down', mouth: 'smirk', sparkle: 1 },
    worried: { eyes: 'open', brow: 'worried', mouth: 'wavy', sweat: 1 },
    wink: { eyes: 'open', eyesR: 'joy', brow: 'arch', mouth: 'smile', blush: 1 },
    sleep: { eyes: 'closed', brow: 'flat', mouth: 'soft' },
    smug: { eyes: 'half', brow: 'arch', mouth: 'smirk' },
    thinking: { eyes: 'open', brow: 'up', mouth: 'flat', look: 1 },
    love: { eyes: 'wide', brow: 'arch', mouth: 'smile', blush: 3, sparkle: 1 },
    calm: { eyes: 'closed', brow: 'arch', mouth: 'smile', blush: 1 },
  };
  P.EXPRESSIONS = Object.keys(EXPR);

  // ---------------------------------------------------------------- the painter
  function geom(age) {
    const t = U.clamp((age - 10) / 8, 0, 1);
    const L = (a, b) => a + (b - a) * t;
    return {
      t,
      cx: 32,
      top: L(9, 6.5),
      temple: L(20.5, 20.5),
      templeY: L(23, 21.5),
      cheek: L(18.6, 19.2),
      cheekY: L(32, 30.5),
      jaw: L(21.4, 22.2),
      jawY: L(40, 40.5),
      chinY: L(45, 46.6),
      chinW: L(3.6, 2.6),
      eyeY: L(32, 30.5),
      eyeDX: L(6.6, 6.4),
      browY: L(27.5, 26),
      noseY: L(36.5, 36),
      mouthY: L(40.5, 41),
      neckW: L(3.8, 3.8),
      neckY: L(43, 44),
      shY: L(53, 52),
      shW: L(22, 27),
      hairLen: L(62, 70),
    };
  }

  function faceOutline(g) {
    const { cx } = g;
    const pts = [
      [g.temple, g.templeY - 10],
      [g.temple, g.templeY],
      [g.cheek, g.cheekY],
      [g.jaw, g.jawY],
      [cx - g.chinW - 2.5, g.chinY - 1.4],
      [cx, g.chinY],
      [cx + g.chinW + 2.5, g.chinY - 1.4],
      [64 - g.jaw, g.jawY],
      [64 - g.cheek, g.cheekY],
      [64 - g.temple, g.templeY],
      [64 - g.temple, g.templeY - 10],
      [cx, g.top + 2],
    ];
    return sampleSpline(pts, true, 6);
  }

  function paint(o) {
    const age = o.age || 13;
    const g = geom(age);
    const b = new Buf();
    const style = o.style || 'wavy';
    const { cx } = g;
    const male = !!o.male;
    const loose = !male && (style === 'wavy' || style === 'straight' || style === 'buns');
    const wave = style === 'straight' ? 0 : 1;

    // --- back hair
    if (male) {
      const poly = sampleSpline([[cx, g.top - 1], [cx + 15, g.top + 6], [cx + 16, g.cheekY - 2], [cx + 13, g.jawY - 6], [cx, g.jawY - 4], [cx - 13, g.jawY - 6], [cx - 16, g.cheekY - 2], [cx - 15, g.top + 6]], true, 5);
      fillPoly(b, poly, M.BACKHAIR, (x) => 0.32 + (x < cx ? 0.1 : 0));
      const bx = cx, by = g.top - 2;
      fillPoly(b, sampleSpline([[bx - 5, by + 3], [bx - 4, by - 3], [bx, by - 5], [bx + 4, by - 3], [bx + 5, by + 3], [bx, by + 4]], true, 5), M.HAIR, (x, y) => 0.66 - (y - by) * 0.04 - (x - bx) * 0.03);
    } else if (loose || style === 'braid') {
      const len = style === 'braid' ? g.jawY + 8 : g.hairLen;
      const edge = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const y = g.top + 6 + (len - g.top - 6) * u;
        let off = y < g.cheekY ? 15 + (y - g.top) * 0.18 : 17 + (y - g.cheekY) * 0.42;
        off = Math.min(off, g.shW + 4);
        off += Math.sin(u * Math.PI * 3.2) * 1.6 * wave * Math.min(1, u * 2);
        edge.push([cx + off, y]);
      }
      const left = edge.map(([x, y]) => [64 - x, y]).reverse();
      const poly = sampleSpline([[cx, g.top - 1]].concat(edge).concat([[cx, len + 3]]).concat(left), true, 5);
      fillPoly(b, poly, M.BACKHAIR, (x, y) => 0.28 + (x < cx ? 0.12 : 0) - Math.max(0, (y - 40) / 90));
    } else {
      // gathered hair (ponytail / updo): only the back of the head shows
      const poly = sampleSpline([[cx, g.top - 1], [cx + 16, g.top + 8], [cx + 17, g.cheekY], [cx + 12, g.jawY + 2], [cx, g.jawY + 4], [cx - 12, g.jawY + 2], [cx - 17, g.cheekY], [cx - 16, g.top + 8]], true, 5);
      fillPoly(b, poly, M.BACKHAIR, (x) => 0.3 + (x < cx ? 0.1 : 0));
      if (style === 'ponytail') {
        fillLock(b, [[cx + 8, g.top - 1], [cx + 19, g.top + 3], [cx + 24, g.cheekY - 4], [cx + 23, g.shY], [cx + 20, 64]], (u) => 11 * (1 - u * 0.6), M.HAIR, -0.08);
      }
    }
    if (style === 'buns') {
      [-1, 1].forEach((sd) => {
        const bx = cx + sd * 12.5, by = g.top + 1;
        fillPoly(b, sampleSpline([[bx - 6, by + 2], [bx - 5, by - 4], [bx, by - 6.5], [bx + 5, by - 4], [bx + 6, by + 2], [bx, by + 5]], true, 5), M.HAIR, (x, y) => 0.62 - (y - by) * 0.04 - (x - bx) * 0.03 * sd);
      });
    }
    if (style === 'updo') {
      const bx = cx + 1, by = g.top - 1;
      fillPoly(b, sampleSpline([[bx - 10, by + 3], [bx - 8, by - 4], [bx, by - 7], [bx + 8, by - 4], [bx + 10, by + 3], [bx, by + 5]], true, 5), M.HAIR, (x, y) => 0.64 - (y - by) * 0.03 - (x - bx) * 0.02);
    }

    // --- neck & shoulders & clothes
    const O = o.outfit;
    const neck = [[cx - g.neckW, g.neckY - 6], [cx - g.neckW - 0.4, g.shY - 1], [cx + g.neckW + 0.4, g.shY - 1], [cx + g.neckW, g.neckY - 6]];
    fillPoly(b, neck, M.SKIN, (x, y) => (y < g.chinY + 2.5 ? 0.3 : 0.46) - (x > cx + 2 ? 0.08 : 0));
    const sh = [
      [cx - g.neckW - 1, g.shY - 3],
      [cx - g.shW * 0.55, g.shY - 1],
      [cx - g.shW, g.shY + 4],
      [cx - g.shW - 3, 66],
      [cx + g.shW + 3, 66],
      [cx + g.shW, g.shY + 4],
      [cx + g.shW * 0.55, g.shY - 1],
      [cx + g.neckW + 1, g.shY - 3],
    ];
    fillPoly(b, sampleSpline(sh, true, 5), M.CLOTH, (x, y) => 0.62 - (x - cx) / 70 - (y - g.shY) / 90);
    // cross collar (the wearer's left over right): inner white, then the trim band
    const low = 66;
    const cr = (dx, w, mat, sh) => {
      const a = [cx + g.neckW + dx, g.shY - 3], c = [cx - 7 + dx, low];
      const poly = [[a[0] - w / 2, a[1]], [a[0] + w / 2, a[1]], [c[0] + w / 2, c[1]], [c[0] - w / 2, c[1]]];
      fillPoly(b, poly, mat, sh);
    };
    // under-collar on the other side
    fillPoly(b, [[cx - g.neckW - 1.5, g.shY - 3], [cx - g.neckW + 1.5, g.shY - 3], [cx + 3, g.shY + 7], [cx, g.shY + 8]], M.INNER, () => 0.6);
    cr(-1.2, 3.2, M.INNER, () => 0.7);
    cr(2.2, 3.6, M.TRIM, (x) => 0.6 - (x - cx) / 60);
    if (O.skirt) {
      fillPoly(b, [[cx - g.shW + 3, 61], [cx + g.shW - 3, 61], [cx + g.shW, 66], [cx - g.shW, 66]], M.SKIRT, (x) => 0.6 - (x - cx) / 80);
      fillPoly(b, [[cx - g.shW + 3, 60], [cx + g.shW - 3, 60], [cx + g.shW - 3, 62], [cx - g.shW + 3, 62]], M.RIBBON, () => 0.6);
    }

    // --- face
    const face = faceOutline(g);
    const fcx = cx, fcy = (g.top + g.chinY) / 2 + 3, frx = 14, fry = (g.chinY - g.top) / 2 + 1;
    const Lx = -0.42, Ly = -0.5, Lz = 0.76;
    fillPoly(b, face, M.SKIN, (x, y) => {
      const nx = (x - fcx) / frx, ny = (y - fcy) / fry;
      const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx * 0.9 - ny * ny * 0.5));
      const l = (nx * Lx + ny * Ly + nz * Lz) / Math.sqrt(nx * nx + ny * ny + nz * nz);
      return U.clamp(0.42 + l * 0.52, 0, 1);
    });
    // ears (only when hair is up)
    if (!loose && style !== 'braid') {
      [-1, 1].forEach((sd) => {
        const ex = cx + sd * (g.cheek > 0 ? 32 - g.cheek + 0.3 : 13);
        fillPoly(b, sampleSpline([[ex, g.eyeY - 2], [ex + sd * 2.6, g.eyeY - 1], [ex + sd * 2.2, g.eyeY + 4], [ex, g.eyeY + 6]], true, 4), M.SKIN, () => 0.36);
      });
    }

    // --- front hair: side locks, then the cap as locks fanning from the parting
    const part = [cx + 3, g.top + 1];
    const lockLen = loose ? Math.min(66, g.hairLen - 4) : style === 'braid' ? g.jawY + 5 : g.jawY + 1;
    [-1, 1].forEach((sd) => {
      if (style === 'braid' && sd > 0) return;
      if (male) return;
      const x0 = cx + sd * 14.5;
      const pts = [[x0 - sd * 2, g.templeY - 7], [x0 + sd * 1.5, g.cheekY - 4], [x0 + sd * (2.4 + wave * 1.2), g.jawY], [x0 + sd * (3.4 - wave * 1.4), (g.jawY + lockLen) / 2], [x0 + sd * (4.6 + wave * 0.8), lockLen]];
      fillLock(b, pts, (u) => (loose ? 7.6 : 6) * (1 - Math.pow(u, 2.4) * 0.85), M.HAIR, sd < 0 ? 0.06 : -0.04);
    });
    if (style === 'braid') {
      for (let i = 0; i < 6; i++) {
        const y = g.jawY + 2 + i * 4.2, x = cx - 17 - i * 0.4;
        fillPoly(b, sampleSpline([[x - 3.2, y], [x, y - 2.4], [x + 3.2, y], [x, y + 2.6]], true, 4), M.HAIR, (xx) => 0.62 - (xx - x) * 0.05);
      }
      fillPoly(b, [[cx - 20, g.jawY + 28], [cx - 15, g.jawY + 28], [cx - 15, g.jawY + 30], [cx - 20, g.jawY + 30]], M.RIBBON, () => 0.6);
    }
    // crown/cap base
    const capBase = sampleSpline([[cx - 16, g.templeY + 1], [cx - 15, g.top + 6], [cx, g.top - 1.5], [cx + 15, g.top + 6], [cx + 16, g.templeY + 1], [cx + 9, g.top + 9], [cx, g.top + 10], [cx - 9, g.top + 9]], true, 6);
    fillPoly(b, capBase, M.HAIR, (x, y) => 0.5 - (x - cx) / 60 - (y - g.top) / 60);
    // bang locks: roots near the parting, tips spread over the forehead
    const by = g.browY;
    const tips = male
      ? [[cx - 14, g.templeY + 2, 6], [cx - 8, by - 3, 6], [cx - 1, by - 5, 5.5], [cx + 6, by - 3, 6], [cx + 13, g.templeY + 2, 6]]
      : loose || style === 'braid'
      ? [[cx - 15.5, g.eyeY + 1, 6], [cx - 11, by + 2.5, 6.5], [cx - 5.5, by + 3.5, 6], [cx - 0.5, by + 1.5, 5.5], [cx + 5, by + 4, 6], [cx + 10.5, by + 2, 6.5], [cx + 15.5, g.eyeY, 6]]
      : [[cx - 15, g.eyeY - 2, 5.5], [cx - 9, by - 1, 6], [cx - 3, by - 3, 5], [cx + 7, by - 2, 6], [cx + 14.5, g.eyeY - 3, 5.5]];
    // draw outer locks first so the central ones overlap them
    const order = tips.map((t, i) => i).sort((a, c) => Math.abs(tips[c][0] - cx) - Math.abs(tips[a][0] - cx));
    order.forEach((i) => {
      const [tx, ty, w] = tips[i];
      const root = [part[0] + (tx - cx) * 0.25, part[1] + 1];
      const mid = [U.lerp(root[0], tx, 0.55) + (tx - cx) * 0.25, U.lerp(root[1], ty, 0.55)];
      fillLock(b, [root, mid, [tx, ty]], (u) => w * Math.pow(1 - u, 0.7) + 0.4, M.HAIR, tx < cx ? 0.05 : -0.03);
    });
    // ahoge
    if (o.ahoge !== false && !male) fillLock(b, [[cx + 1, g.top + 1], [cx + 3, g.top - 4], [cx + 7, g.top - 5.5]], (u) => 2.2 * (1 - u * 0.7), M.HAIR, 0.05);
    return { b, g };
  }

  // quantise, outline and stamp details
  function finish(state, o) {
    const { b, g } = state;
    const skin = P.SKIN[o.skin] || P.SKIN.fair;
    const hair = P.HAIR[o.hair] || P.HAIR.gold;
    const iris = P.EYES[o.eyes] || P.EYES.blossom;
    const O = o.outfit;
    const cloth = clothRamp(O.jacket);
    const trim = clothRamp(O.collar);
    const skirt = clothRamp(O.skirt || O.jacket);
    const ribbon = clothRamp(O.bow || O.collar);
    const inner = ['#6d6570', '#a9a2ad', '#d7d1d6', '#efe9ec', '#fbf8f8', '#ffffff'];
    const rampOf = { [M.SKIN]: skin, [M.HAIR]: hair, [M.BACKHAIR]: hair, [M.CLOTH]: cloth, [M.TRIM]: trim, [M.INNER]: inner, [M.SKIRT]: skirt, [M.RIBBON]: ribbon };
    const out = new Array(W * H).fill(null);
    const idxOf = (mat, v) => {
      if (mat === M.BACKHAIR) return v > 0.36 ? 3 : 2;
      if (mat === M.SKIN) return v > 0.9 ? 5 : v > 0.56 ? 4 : v > 0.4 ? 3 : v > 0.2 ? 2 : 1;
      if (mat === M.HAIR) return v > 0.84 ? 5 : v > 0.66 ? 4 : v > 0.46 ? 3 : v > 0.28 ? 2 : 1;
      return v > 0.78 ? 4 : v > 0.5 ? 3 : v > 0.3 ? 2 : 1;
    };
    for (let i = 0; i < W * H; i++) {
      const m = b.mat[i];
      if (!m) continue;
      out[i] = rampOf[m] ? rampOf[m][idxOf(m, b.val[i])] : '#ff00ff';
    }
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : b.mat[y * W + x]);
    // skin under hair: cast shadow (1-2 px)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (b.mat[i] !== M.SKIN) continue;
      if (at(x, y - 1) === M.HAIR || at(x - 1, y) === M.HAIR || at(x + 1, y) === M.HAIR) out[i] = skin[2];
      else if (at(x, y - 2) === M.HAIR) out[i] = skin[Math.min(3, skin.indexOf(out[i]))] || out[i];
    }
    // selective outline: silhouette pixels take the darkest tone of their material; hair over skin gets a line too
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, m = b.mat[i];
      if (!m) continue;
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      const r = rampOf[m];
      if (edge && y < H - 1) out[i] = m === M.SKIN ? skin[0] : r ? r[0] : LINE;
      else if (m === M.HAIR && (at(x, y + 1) === M.SKIN || at(x + 1, y) === M.SKIN || at(x - 1, y) === M.SKIN)) out[i] = hair[1];
      else if ((m === M.CLOTH || m === M.TRIM || m === M.INNER) && at(x, y - 1) === M.HAIR) out[i] = r[1];
    }
    // --- face details
    const E = EXPR[o.expr] || EXPR.neutral;
    const put = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H || !c) return;
      out[y * W + x] = c;
    };
    const eyeKey = o.blink && E.eyes !== 'joy' && E.eyes !== 'closed' ? 'closed' : E.eyes;
    const stampEye = (key, x0, y0, mirror) => {
      const s = EYES[key];
      s.forEach((row, yy) => {
        for (let xx = 0; xx < row.length; xx++) {
          const ch = row[mirror ? row.length - 1 - xx : xx];
          const x = x0 + xx, y = y0 + yy;
          let c = null;
          if (ch === 'k') c = LINE;
          else if (ch === 'w') c = WHITE;
          else if (ch === '1') c = iris[0];
          else if (ch === '2') c = iris[1];
          else if (ch === '3') c = iris[2];
          else if (ch === 'h') c = '#ffffff';
          else if (ch === 's') c = skin[2];
          if (c) put(x, y, c);
        }
      });
    };
    const ey = Math.round(g.eyeY) - 3;
    const exL = Math.round(g.cx - g.eyeDX) - 3, exR = Math.round(g.cx + g.eyeDX) - 3;
    const lookShift = E.look ? 1 : 0;
    stampEye(eyeKey, exL + lookShift, ey, false);
    stampEye(o.blink ? 'closed' : E.eyesR || eyeKey, exR + lookShift, ey, true);
    // brows
    const brow = BROWS[E.brow] || BROWS.flat;
    const browCol = o.male ? hair[0] : hair[1];
    brow.forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        if (row[xx] === 'k') put(exL + xx, Math.round(g.browY) - 1 + yy, browCol);
        if (row[row.length - 1 - xx] === 'k') put(exR + 1 + xx, Math.round(g.browY) - 1 + yy, browCol);
      }
    });
    // nose: a soft shadow on the right and a lit tip
    const nx = g.cx, ny = Math.round(g.noseY);
    put(nx + 1, ny - 1, skin[3]);
    put(nx + 1, ny, skin[2]);
    put(nx, ny + 1, skin[2]);
    put(nx - 1, ny, skin[4]);
    // mouth
    const mo = o.talk ? (E.mouth === 'grin' || E.mouth === 'laugh' ? 'laugh' : 'open') : E.mouth;
    const lip = U.mix(skin[2], '#d24c62', 0.55), lipL = U.mix(skin[3], '#f07f8f', 0.5);
    (MOUTHS[mo] || MOUTHS.soft).forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        const ch = row[xx];
        const x = g.cx - 3 + xx, y = Math.round(g.mouthY) - 1 + yy;
        const c = ch === 'k' ? U.mix(skin[0], '#6e1f33', 0.4) : ch === 'r' ? lip : ch === 'R' ? lipL : ch === 'm' ? '#6b1f2e' : ch === 'n' ? '#e0707f' : ch === 'T' ? '#fffaf4' : null;
        if (c) put(x, y, c);
      }
    });
    if (o.male && o.beard) {
      const bcol = hair[2], bdark = hair[1];
      for (let y = Math.round(g.mouthY) + 1; y <= Math.round(g.chinY) + 1; y++) {
        const w = 2 + Math.round((y - g.mouthY) * 0.8);
        for (let x = g.cx - w; x <= g.cx + w; x++) put(x, y, (x + y) % 3 ? bcol : bdark);
      }
      for (let x = g.cx - 4; x <= g.cx + 4; x++) put(x, Math.round(g.mouthY) - 2, x === g.cx ? null : bcol);
    }
    // blush
    const bl = o.male ? Math.max(0, (E.blush || 0) - 1) : E.blush || 0;
    const blushC = U.mix(skin[4], '#ff6f8a', 0.45), blushD = U.mix(skin[3], '#ff5c7c', 0.5);
    [-1, 1].forEach((sd) => {
      const bx = Math.round(g.cx + sd * (g.eyeDX + 1)) - 2, byy = Math.round(g.eyeY) + 4;
      for (let xx = 0; xx < 4; xx++) put(bx + xx, byy, bl >= 1 || xx % 2 === 0 ? blushC : null);
      if (bl >= 2) for (let xx = 0; xx < 4; xx++) put(bx + xx, byy + 1, xx % 2 ? blushC : null);
      if (bl >= 3) { put(bx + 1, byy - 1, blushD); put(bx + 3, byy - 1, blushD); }
    });
    // tears / sweat / vein / sparkle
    if (E.tears) {
      [-1, 1].forEach((sd) => {
        const tx = sd < 0 ? exL + 1 : exR + 5, ty = ey + 4;
        put(tx, ty, '#bfe6ff');
        if (E.tears > 1) for (let k = 1; k < 5; k++) put(tx, ty + k, k % 2 ? '#9fd4f5' : '#d8f0ff');
      });
    }
    if (E.sweat) {
      const sx = g.cx + 17, sy = Math.round(g.browY) - 3;
      [[0, 0, '#d8f0ff'], [0, 1, '#9fd4f5'], [-1, 1, '#d8f0ff'], [1, 1, '#9fd4f5'], [0, 2, '#9fd4f5']].forEach(([dx, dy, c]) => put(sx + dx, sy + dy, c));
    }
    if (E.vein) {
      const vx = g.cx + 12, vy = g.top + 8;
      [[0, 0], [1, 0], [0, 1], [3, 0], [4, 0], [4, 1], [0, 3], [0, 4], [1, 4], [4, 3], [3, 4], [4, 4]].forEach(([dx, dy]) => put(vx + dx, vy + dy, '#e0485e'));
    }
    if (E.sparkle) {
      [[exL + 4, ey + 1], [exR + 2, ey + 1]].forEach(([x, y]) => put(x, y, '#ffffff'));
    }
    // --- ornaments: star pin (left) and a blossom pin (right)
    if (!o.noPins) {
      const sx = g.cx - 12, sy = g.top + 7;
      const gold = ['#8a5a1a', '#d9a13a', '#f6d46a', '#fff4c0'];
      ['..2..', '.232.', '23332', '.2.2.', '1...1'].forEach((row, yy) => {
        for (let xx = 0; xx < 5; xx++) {
          const ch = row[xx];
          if (ch !== '.') put(sx + xx, sy + yy, gold[+ch]);
        }
      });
      put(sx + 2, sy + 1, gold[3]);
      const fx = g.cx + 10, fy = g.top + 7;
      const pk = ['#b0405e', '#f28fab', '#ffd2de', '#f6d46a'];
      ['.1.1.', '12121', '.131.', '12121', '.1.1.'].forEach((row, yy) => {
        for (let xx = 0; xx < 5; xx++) {
          const ch = row[xx];
          if (ch !== '.') put(fx + xx, fy + yy, pk[+ch - 1 + 1] || pk[1]);
        }
      });
      put(fx + 2, fy + 2, pk[3]);
    }
    return out;
  }

  const cache = new Map();
  /** o = { hair, eyes, skin, style, age, expr, outfit (object), blink, talk, ahoge } -> canvas 64x64 */
  P.render = function (o) {
    const key = JSON.stringify([o.hair, o.eyes, o.skin, o.style, Math.round((o.age || 13) * 2) / 2, o.expr, o.outfitKey || o.outfit.jacket, o.blink ? 1 : 0, o.talk ? 1 : 0, o.ahoge, o.noPins, o.male ? 1 : 0, o.beard ? 1 : 0]);
    if (cache.has(key)) return cache.get(key);
    const px = finish(paint(o), o);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    px.forEach((col, i) => {
      if (!col) return;
      const [r, g, bb, a] = G.PX.rgba(col);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = bb;
      img.data[i * 4 + 3] = a;
    });
    ctx.putImageData(img, 0, 0);
    cache.set(key, c);
    if (cache.size > 400) cache.delete(cache.keys().next().value);
    return c;
  };
})();
