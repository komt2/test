/* Silver River — the daughter's portrait, drawn as layered SVG in a soft anime style.
   She ages continuously from 10 to 18: face, eyes, neck, shoulders and hair all morph with age. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const A = (G.Art = {});
  const f = U.f;
  let uid = 0;

  // ---------------------------------------------------------------- palettes
  const HP = (base, light, shade, deep, line, shine) => ({ base, light, shade, deep, line, outline: U.mix(line, shade, 0.35), shine });
  A.HAIR = {
    gold: { name: 'Starlight gold', pal: HP('#f6ca4c', '#fde892', '#e5a53a', '#c98529', '#a8641d', '#fff7d1') },
    ink: { name: 'Ink black', pal: HP('#35303f', '#524b66', '#26222f', '#1a1722', '#110f17', '#7b76a3') },
    chestnut: { name: 'Chestnut', pal: HP('#9c5c3d', '#bb7752', '#7f4531', '#613325', '#4b261b', '#e2aa82') },
    silver: { name: 'Moon silver', pal: HP('#e6e8f4', '#ffffff', '#bcc1dc', '#9ca2c8', '#7d83ab', '#ffffff') },
    rose: { name: 'Peach blossom', pal: HP('#f3adbd', '#fdd6df', '#dc849c', '#c56888', '#a04f6e', '#fff2f5') },
    copper: { name: 'Autumn copper', pal: HP('#dd7f45', '#f5a86c', '#bf6132', '#9d4b25', '#7a3819', '#ffd2a8') },
    plum: { name: 'Plum', pal: HP('#8f6cc6', '#b294e0', '#7152a8', '#583e8a', '#43306b', '#ddccff') },
  };
  A.EYES = {
    blossom: { name: 'Peach blossom', base: '#e0607e', dark: '#a8345a', ring: '#6c1f3c', light: '#ffb8c7' },
    amber: { name: 'Amber', base: '#e29a33', dark: '#a8641b', ring: '#6a3a10', light: '#ffdc8f' },
    jade: { name: 'Jade', base: '#3ea57b', dark: '#1f7152', ring: '#123f2f', light: '#a5e8c8' },
    sky: { name: 'Sky', base: '#4d93dc', dark: '#2b5fa5', ring: '#173866', light: '#aed7ff' },
    violet: { name: 'Violet', base: '#9166d8', dark: '#5d3ba3', ring: '#35205f', light: '#d2bbff' },
    ink: { name: 'Ink brown', base: '#7a513e', dark: '#4a2d21', ring: '#24140f', light: '#c99b82' },
  };
  A.SKIN = {
    porcelain: { name: 'Porcelain', base: '#fff1e8' },
    fair: { name: 'Fair', base: '#fde3d3' },
    warm: { name: 'Warm', base: '#f4cfb3' },
    tan: { name: 'Tan', base: '#dcaa84' },
    deep: { name: 'Deep', base: '#a56f4f' },
  };
  A.STYLES = {
    wavy: { name: 'Long waves' },
    buns: { name: 'Twin buns' },
    ponytail: { name: 'High ponytail' },
    straight: { name: 'Long & straight' },
    braid: { name: 'Side braid' },
    updo: { name: 'Elegant updo' },
  };

  function skinPal(hex) {
    return {
      base: hex,
      shade: U.tone(hex, -0.06, 0.1, -6),
      deep: U.tone(hex, -0.13, 0.12, -8),
      line: U.mix(U.tone(hex, -0.3, 0.12, -10), '#9a4a4a', 0.35),
      blush: U.mix('#ff7896', hex, 0.08),
    };
  }

  // ---------------------------------------------------------------- geometry
  function geom(age) {
    const t = U.clamp((age - 10) / 8, 0, 1);
    const L = (a, b) => a + (b - a) * t;
    return {
      t,
      cx: 200,
      headTop: L(72, 62),
      fw: L(85, 79),
      cheekY: L(214, 212),
      jawY: L(258, 266),
      jw: L(58, 50),
      chinY: L(287, 297),
      chinW: L(24, 16),
      eyeY: L(222, 219),
      eyeDX: L(38, 37),
      eyeW: L(51, 47),
      eyeH: L(42, 38),
      browY: L(185, 183),
      noseY: L(250, 253),
      mouthY: L(265, 272),
      nw: L(16, 15),
      shY: L(352, 348),
      shW: L(94, 112),
      hairLen: L(440, 505),
    };
  }
  A.geom = geom;

  // Catmull-Rom spline through points -> cubic bezier path
  function spline(pts, closed, move = true) {
    const n = pts.length;
    if (n < 2) return '';
    let d = (move ? 'M' : 'L') + f(pts[0][0]) + ',' + f(pts[0][1]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
  }
  A.spline = spline;

  // A tapered ribbon of hair around a centreline. widths[i] is the full width at point i.
  function lock(pts, widths, opts = {}) {
    const n = pts.length;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      const w = (typeof widths === 'function' ? widths(i / (n - 1)) : widths[i]) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    const tip = pts[n - 1];
    const outline = L.slice(0, n - 1).concat([tip]).concat(R.slice(0, n - 1).reverse());
    if (opts.flatRoot) return spline(outline, false) + 'Z';
    return spline(outline, true);
  }

  function starPath(x, y, r, rot = -90, inner = 0.45) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = ((rot + i * 36) * Math.PI) / 180;
      const rr = i % 2 === 0 ? r : r * inner;
      d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ',' + f(y + Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  A.starPath = starPath;
  function flower(x, y, r, petal, center, n = 5, rot = 0) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const px = x + Math.cos(a) * r * 0.62, py = y + Math.sin(a) * r * 0.62;
      s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r * 0.55)}" ry="${f(r * 0.42)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(px)} ${f(py)})" fill="${petal}" stroke="${U.tone(petal, -0.18)}" stroke-width=".8"/>`;
    }
    return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.28)}" fill="${center}"/>`;
  }
  A.flower = flower;

  // ---------------------------------------------------------------- expressions
  const EXPR = {
    neutral: { eyes: 'open', lid: [0.04, 0.06], low: 0.04, brow: { r: 0, t: 1 }, mouth: 'soft', blush: 0.45 },
    happy: { eyes: 'open', lid: [0.1, 0.12], low: 0.16, brow: { r: 2, t: 2 }, mouth: 'smile', blush: 0.7, tilt: -3 },
    joy: { eyes: 'joy', brow: { r: 5, t: 3 }, mouth: 'grin', blush: 0.85, tilt: -4 },
    laugh: { eyes: 'joy', brow: { r: 6, t: 4 }, mouth: 'laugh', blush: 0.9, tilt: 3 },
    sad: { eyes: 'open', lid: [0.08, 0.34], look: [0, 0.4], brow: { r: 3, t: 7 }, mouth: 'frown', blush: 0.25, tilt: 2 },
    cry: { eyes: 'open', lid: [0.1, 0.3], look: [0, 0.2], brow: { r: 4, t: 8 }, mouth: 'wobble', blush: 0.75, tears: 2, shine: 1.3 },
    teary: { eyes: 'open', lid: [0.08, 0.16], low: 0.12, brow: { r: 3, t: 6 }, mouth: 'smile', blush: 0.8, tears: 1, shine: 1.35 },
    angry: { eyes: 'open', lid: [0.36, 0.12], brow: { r: -4, t: -8 }, mouth: 'grit', blush: 0.4, vein: true },
    pout: { eyes: 'open', lid: [0.3, 0.26], look: [0.6, 0.05], brow: { r: -2, t: -4 }, mouth: 'pout', blush: 0.85, puff: true, tilt: 3 },
    surprised: { eyes: 'open', lid: [-0.06, -0.06], iris: 0.84, brow: { r: 9, t: 1 }, mouth: 'o', blush: 0.35 },
    shy: { eyes: 'open', lid: [0.22, 0.24], low: 0.1, look: [-0.5, 0.45], brow: { r: 3, t: 5 }, mouth: 'small', blush: 1.1, hatch: true, tilt: 4 },
    tired: { eyes: 'open', lid: [0.46, 0.5], look: [0, 0.25], brow: { r: -1, t: 4 }, mouth: 'flat', blush: 0.2, sweat: true },
    determined: { eyes: 'open', lid: [0.2, 0.04], brow: { r: -3, t: -5 }, mouth: 'firm', blush: 0.4, sparkle: true },
    worried: { eyes: 'open', lid: [0.04, 0.2], look: [0.25, 0.25], brow: { r: 5, t: 7 }, mouth: 'wavy', blush: 0.35, sweat: true },
    wink: { eyes: 'wink', lid: [0.08, 0.1], low: 0.14, brow: { r: 3, t: 0 }, mouth: 'cat', blush: 0.7, tilt: -4 },
    sleep: { eyes: 'calm', brow: { r: 0, t: 3 }, mouth: 'soft', blush: 0.5 },
    smug: { eyes: 'open', lid: [0.34, 0.32], look: [0.3, 0], brow: { r: 3, t: -3 }, mouth: 'smirk', blush: 0.35, tilt: -2 },
    thinking: { eyes: 'open', lid: [0.12, 0.1], look: [0.55, -0.5], brow: { r: 4, t: -1 }, mouth: 'flat', blush: 0.35, tilt: 5 },
    love: { eyes: 'open', lid: [0.08, 0.1], low: 0.14, brow: { r: 3, t: 3 }, mouth: 'smile', blush: 1, sparkle: true, shine: 1.25, tilt: -3 },
    calm: { eyes: 'calm', brow: { r: 1, t: 2 }, mouth: 'smile', blush: 0.6, tilt: -2 },
  };
  A.EXPRESSIONS = Object.keys(EXPR);

  // eye outline samples, u: -0.5 (inner corner) .. 0.5 (outer corner), y as a fraction of eye height
  const EU = [-0.5, -0.35, -0.17, 0, 0.18, 0.35, 0.5];
  const ETOP = [0.14, -0.26, -0.44, -0.5, -0.48, -0.38, -0.08];
  const EBOT = [0.14, 0.36, 0.48, 0.5, 0.46, 0.32, -0.08];

  function eye(ctx, side, E) {
    const { g, ep, lash, id, sp } = ctx;
    const w = g.eyeW, h = g.eyeH;
    const cx = g.cx + side * g.eyeDX, cy = g.eyeY;
    const X = (u) => cx + side * u * w; // +u points to the outer corner
    const lid = E.lid || [0, 0];
    const low = E.low || 0;
    const top = [], bot = [];
    EU.forEach((u, i) => {
      const k = u + 0.5;
      const amt = lid[0] + (lid[1] - lid[0]) * k;
      const yt = ETOP[i] * h, yb = EBOT[i] * h;
      const edge = i === 0 || i === EU.length - 1;
      top.push([X(u), cy + (edge ? yt : yt + (yb - yt) * amt)]);
      bot.push([X(u), cy + (edge ? yb : yb - (yb - yt) * low * Math.sin(Math.PI * k))]);
    });
    const outline = spline(top, false) + spline(bot.slice().reverse(), false, false) + 'Z';
    const cid = `${id}e${side > 0 ? 'r' : 'l'}`;
    const look = E.look || [0, 0];
    const irisS = E.iris || 1;
    const icx = cx + look[0] * w * 0.13;
    const icy = cy + h * 0.06 + look[1] * h * 0.1;
    const irx = w * 0.31 * irisS, iry = h * 0.5 * irisS;
    const shine = E.shine || 1;
    let s = `<clipPath id="${cid}"><path d="${outline}"/></clipPath>`;
    s += `<path d="${outline}" fill="url(#${id}white)"/>`;
    s += `<g clip-path="url(#${cid})">`;
    s += `<ellipse cx="${f(icx)}" cy="${f(icy)}" rx="${f(irx)}" ry="${f(iry)}" fill="url(#${id}iris)"/>`;
    s += `<ellipse cx="${f(icx)}" cy="${f(icy + iry * 0.02)}" rx="${f(irx * 0.44)}" ry="${f(iry * 0.46)}" fill="${ep.ring}" opacity=".75"/>`;
    s += `<ellipse cx="${f(icx)}" cy="${f(icy + iry * 0.5)}" rx="${f(irx * 0.72)}" ry="${f(iry * 0.34)}" fill="${ep.light}" opacity=".6"/>`;
    s += `<ellipse cx="${f(icx)}" cy="${f(icy)}" rx="${f(irx)}" ry="${f(iry)}" fill="none" stroke="${ep.ring}" stroke-width="1.3" opacity=".8"/>`;
    // shadow from the upper lid
    s += `<path d="${spline(top, false)}" stroke="${ep.ring}" stroke-width="${f(h * 0.26)}" opacity=".28" fill="none"/>`;
    // highlights: one big soft one, one small bright one, and a tiny pink glint
    s += `<ellipse cx="${f(icx - irx * 0.32)}" cy="${f(icy - iry * 0.3)}" rx="${f(irx * 0.36 * shine)}" ry="${f(iry * 0.27 * shine)}" fill="#fff" transform="rotate(-20 ${f(icx - irx * 0.32)} ${f(icy - iry * 0.3)})"/>`;
    s += `<circle cx="${f(icx + irx * 0.42)}" cy="${f(icy + iry * 0.3)}" r="${f(irx * 0.14 * shine)}" fill="#fff"/>`;
    s += `<circle cx="${f(icx + irx * 0.2)}" cy="${f(icy - iry * 0.45)}" r="${f(irx * 0.08)}" fill="#fff" opacity=".85"/>`;
    if (E.sparkle) {
      const sx = icx + irx * 0.1, sy = icy + iry * 0.12, r = irx * 0.32;
      s += `<path d="M${f(sx)},${f(sy - r)}Q${f(sx)},${f(sy)} ${f(sx + r)},${f(sy)}Q${f(sx)},${f(sy)} ${f(sx)},${f(sy + r)}Q${f(sx)},${f(sy)} ${f(sx - r)},${f(sy)}Q${f(sx)},${f(sy)} ${f(sx)},${f(sy - r)}Z" fill="#fff" opacity=".95"/>`;
    }
    s += `</g>`;
    // upper lash line: soft brown band, thickest toward the outer corner, with a little flick
    const thick = top.map((p, i) => {
      const k = EU[i] + 0.5;
      return [p[0] - side * 1.2 * k, p[1] - h * (0.045 + 0.085 * Math.pow(k, 0.9))];
    });
    const o = top[top.length - 1];
    const flick = [o[0] + side * w * 0.13, o[1] + h * 0.06];
    s += `<path d="${spline(top, false)}L${f(flick[0])},${f(flick[1])}${spline(thick.slice().reverse(), false, false)}Z" fill="${lash}" stroke="${lash}" stroke-width=".6" stroke-linejoin="round"/>`;
    // two small outer lashes
    const l1 = top[5], l2 = top[6];
    s += `<path d="M${f(l1[0])},${f(l1[1] - h * 0.08)}q${f(side * w * 0.08)},${f(-h * 0.1)} ${f(side * w * 0.16)},${f(-h * 0.08)}M${f(l2[0])},${f(l2[1] - h * 0.05)}q${f(side * w * 0.1)},${f(-h * 0.02)} ${f(side * w * 0.17)},${f(h * 0.05)}" stroke="${lash}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    // lower lash
    const lb = bot.slice(3);
    s += `<path d="${spline(lb, false)}" stroke="${lash}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
    s += `<path d="M${f(bot[1][0])},${f(bot[1][1] - 1)}Q${f(bot[0][0])},${f(bot[0][1] + 2)} ${f(bot[0][0] - side * 2)},${f(bot[0][1])}" stroke="${lash}" stroke-width="1" fill="none" opacity=".35"/>`;
    // double eyelid crease
    const crease = top.slice(2, 6).map((p, i) => [p[0], p[1] - h * (0.22 + i * 0.01)]);
    s += `<path d="${spline(crease, false)}" stroke="${U.mix(lash, sp.base, 0.35)}" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>`;
    return s;
  }

  function closedEye(ctx, side, kind) {
    const { g, lash } = ctx;
    const w = g.eyeW, h = g.eyeH;
    const cx = g.cx + side * g.eyeDX, cy = g.eyeY;
    const X = (u) => cx + side * u * w;
    if (kind === 'joy') {
      const d = `M${f(X(-0.44))},${f(cy + h * 0.16)}Q${f(X(0.02))},${f(cy - h * 0.42)} ${f(X(0.46))},${f(cy + h * 0.12)}`;
      return `<path d="${d}" stroke="${lash}" stroke-width="${f(h * 0.11)}" fill="none" stroke-linecap="round"/><path d="M${f(X(0.42))},${f(cy + h * 0.02)}l${f(side * w * 0.12)},${f(-h * 0.12)}" stroke="${lash}" stroke-width="2" stroke-linecap="round"/>`;
    }
    const d = `M${f(X(-0.44))},${f(cy + h * 0.04)}Q${f(X(0))},${f(cy + h * 0.32)} ${f(X(0.48))},${f(cy)}`;
    let s = `<path d="${d}" stroke="${lash}" stroke-width="${f(h * 0.09)}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${f(X(0.44))},${f(cy + h * 0.05)}l${f(side * w * 0.1)},${f(h * 0.12)}M${f(X(0.3))},${f(cy + h * 0.13)}l${f(side * w * 0.06)},${f(h * 0.13)}" stroke="${lash}" stroke-width="1.7" stroke-linecap="round"/>`;
    return s;
  }

  function brows(ctx, E) {
    const { g, hp } = ctx;
    const B = E.brow || { r: 0, t: 0 };
    let s = '';
    [-1, 1].forEach((side) => {
      const cx = g.cx + side * g.eyeDX;
      const X = (u) => cx + side * u * g.eyeW;
      const by = g.browY;
      const yi = by - B.r - B.t + 2, yo = by - B.r + B.t * 0.35 + 3;
      const ym = by - B.r - 6 - (B.t > 0 ? B.t * 0.2 : 0);
      s += `<path d="M${f(X(-0.36))},${f(yi)}Q${f(X(0.06))},${f(ym)} ${f(X(0.44))},${f(yo)}" stroke="${U.mix(hp.line, hp.shade, 0.3)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>`;
    });
    return s;
  }

  function mouth(ctx, kind) {
    const { g, sp } = ctx;
    const x = g.cx, y = g.mouthY;
    const line = U.mix(sp.line, '#8a2f40', 0.45);
    const inside = '#b8475e';
    const tongue = '#f394a6';
    const st = `stroke="${line}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'smile':
        return `<path d="M${x - 9},${y - 2}Q${x},${y + 6} ${x + 9},${y - 2}" ${st}/>`;
      case 'grin':
        return `<path d="M${x - 11},${y - 3}Q${x},${y - 1} ${x + 11},${y - 3}Q${x + 8},${y + 11} ${x},${y + 12}Q${x - 8},${y + 11} ${x - 11},${y - 3}Z" fill="${inside}" stroke="${line}" stroke-width="1.5"/><path d="M${x - 6},${y + 8}Q${x},${y + 3} ${x + 6},${y + 8}Q${x + 3},${y + 11} ${x},${y + 11}Q${x - 3},${y + 11} ${x - 6},${y + 8}Z" fill="${tongue}"/>`;
      case 'laugh':
        return `<path d="M${x - 13},${y - 5}Q${x},${y - 2} ${x + 13},${y - 5}Q${x + 10},${y + 15} ${x},${y + 16}Q${x - 10},${y + 15} ${x - 13},${y - 5}Z" fill="${inside}" stroke="${line}" stroke-width="1.5"/><path d="M${x - 8},${y + 11}Q${x},${y + 4} ${x + 8},${y + 11}Q${x + 4},${y + 15} ${x},${y + 15}Q${x - 4},${y + 15} ${x - 8},${y + 11}Z" fill="${tongue}"/>`;
      case 'frown':
        return `<path d="M${x - 7},${y + 4}Q${x},${y - 2} ${x + 7},${y + 4}" ${st}/>`;
      case 'wobble':
        return `<path d="M${x - 10},${y + 1}Q${x - 5},${y - 3} ${x - 1},${y + 1}Q${x + 3},${y - 3} ${x + 10},${y + 1}Q${x + 7},${y + 10} ${x},${y + 9}Q${x - 7},${y + 10} ${x - 10},${y + 1}Z" fill="${inside}" stroke="${line}" stroke-width="1.5"/>`;
      case 'grit':
        return `<path d="M${x - 9},${y - 1}L${x + 9},${y - 1}Q${x + 7},${y + 7} ${x},${y + 7}Q${x - 7},${y + 7} ${x - 9},${y - 1}Z" fill="#fff" stroke="${line}" stroke-width="1.7" stroke-linejoin="round"/><path d="M${x - 8},${y + 3}L${x + 8},${y + 3}" stroke="${line}" stroke-width="1" opacity=".6"/>`;
      case 'pout':
        return `<path d="M${x - 5},${y + 3}Q${x - 2.5},${y - 1} ${x},${y + 2}Q${x + 2.5},${y - 1} ${x + 5},${y + 3}" ${st}/>`;
      case 'o':
        return `<ellipse cx="${x}" cy="${y + 3}" rx="5" ry="6.5" fill="${inside}" stroke="${line}" stroke-width="1.5"/>`;
      case 'small':
        return `<path d="M${x - 4.5},${y}Q${x},${y + 3.5} ${x + 4.5},${y}" ${st}/>`;
      case 'flat':
        return `<path d="M${x - 5.5},${y + 1}L${x + 5.5},${y + 1}" ${st}/>`;
      case 'firm':
        return `<path d="M${x - 7},${y}Q${x},${y + 3} ${x + 7},${y - 1}" ${st}/>`;
      case 'wavy':
        return `<path d="M${x - 8},${y + 2}Q${x - 4},${y - 2} ${x},${y + 2}Q${x + 4},${y + 5} ${x + 8},${y + 1}" ${st}/>`;
      case 'cat':
        return `<path d="M${x - 8},${y - 1}Q${x - 4},${y + 5} ${x},${y}Q${x + 4},${y + 5} ${x + 8},${y - 1}" ${st}/>`;
      case 'smirk':
        return `<path d="M${x - 6},${y + 2}Q${x + 2},${y + 4} ${x + 8},${y - 3}" ${st}/>`;
      case 'talk':
        return `<path d="M${x - 6},${y - 1}Q${x},${y - 2} ${x + 6},${y - 1}Q${x + 4.5},${y + 7} ${x},${y + 7}Q${x - 4.5},${y + 7} ${x - 6},${y - 1}Z" fill="${inside}" stroke="${line}" stroke-width="1.4"/><path d="M${x - 3.5},${y + 4.5}Q${x},${y + 3} ${x + 3.5},${y + 4.5}Q${x + 2},${y + 6.5} ${x},${y + 6.5}Q${x - 2},${y + 6.5} ${x - 3.5},${y + 4.5}Z" fill="${tongue}"/>`;
      case 'soft':
      default:
        return `<path d="M${x - 6},${y}Q${x},${y + 4} ${x + 6},${y - 0.5}" ${st}/>`;
    }
  }

  // ---------------------------------------------------------------- face & body
  function facePath(g) {
    const { cx, fw, cheekY, jawY, jw, chinY, chinW } = g;
    const top = 150;
    return `M${f(cx - fw)},${top}C${f(cx - fw - 2)},${f(cheekY + 14)} ${f(cx - jw - 22)},${f(jawY - 14)} ${f(cx - jw)},${f(jawY)}C${f(cx - jw + 14)},${f(jawY + 16)} ${f(cx - chinW - 10)},${f(chinY)} ${cx},${f(chinY)}C${f(cx + chinW + 10)},${f(chinY)} ${f(cx + jw - 14)},${f(jawY + 16)} ${f(cx + jw)},${f(jawY)}C${f(cx + jw + 22)},${f(jawY - 14)} ${f(cx + fw + 2)},${f(cheekY + 14)} ${f(cx + fw)},${top}C${f(cx + fw)},${top - 106} ${f(cx - fw)},${top - 106} ${f(cx - fw)},${top}Z`;
  }

  // shoulders and arms silhouette. The top edge is the neck opening.
  function torsoPath(g, inset = 0, neckOpen = 5) {
    const { cx, shY, shW, nw } = g;
    const l = cx - shW + inset, r = cx + shW - inset;
    const ny = shY - 30;
    const nl = cx - nw - neckOpen, nr = cx + nw + neckOpen;
    let d = `M${f(nl)},${f(ny)}`;
    d += `C${f(nl - 22)},${f(ny + 10)} ${f(l + 34)},${f(shY - 10)} ${f(l + 10)},${f(shY + 10)}`;
    d += `C${f(l - 4)},${f(shY + 24)} ${f(l - 12)},${f(shY + 80)} ${f(l - 18)},520`;
    d += `L${f(r + 18)},520`;
    d += `C${f(r + 12)},${f(shY + 80)} ${f(r + 4)},${f(shY + 24)} ${f(r - 10)},${f(shY + 10)}`;
    d += `C${f(r - 34)},${f(shY - 10)} ${f(nr + 22)},${f(ny + 10)} ${f(nr)},${f(ny)}Z`;
    return d;
  }

  function neck(ctx) {
    const { g, sp, id } = ctx;
    const { cx, nw, shY } = g;
    let s = `<path d="M${f(cx - nw)},250L${f(cx - nw - 1)},${f(shY - 22)}Q${cx},${f(shY - 6)} ${f(cx + nw + 1)},${f(shY - 22)}L${f(cx + nw)},250Z" fill="${sp.base}"/>`;
    s += `<path d="${torsoPath(g, 3)}" fill="${sp.base}"/>`;
    s += `<path d="M${f(cx - nw - 2)},258Q${cx},${f(g.chinY + 28)} ${f(cx + nw + 2)},258L${f(cx + nw + 2)},248L${f(cx - nw - 2)},248Z" fill="${sp.shade}"/>`;
    return s;
  }

  // ---------------------------------------------------------------- outfits (hanfu)
  // jacket: cross-collared top; collar: collar band; inner: inner collar; skirt: chest-high skirt;
  // pibo: draped shawl; belt: sash at the waist; pattern: 'flowers'|'stars'|'clouds'|'scales'|'brocade'
  A.OUTFITS = {
    everyday: { name: 'Blossom ruqun', jacket: '#fbd3dc', collar: '#e4718f', inner: '#fffaf7', skirt: '#a9d8c4', bow: '#e4718f', pibo: '#fff1c9', pattern: 'petals' },
    festival: { name: 'Festival silks', jacket: '#fff0d6', collar: '#d8434f', inner: '#fffaf2', skirt: '#e35d62', bow: '#f2c14e', pibo: '#ffd9e1', pattern: 'flowers', hairFlower: true },
    martial: { name: 'Martial wear', jacket: '#3d4a6b', collar: '#c9404c', inner: '#f4efe6', belt: '#c9404c', bracer: true, pattern: null },
    scholar: { name: 'Scholar robe', jacket: '#dbe8f4', collar: '#2f4166', inner: '#ffffff', belt: '#2f4166', pattern: null },
    work: { name: 'Work clothes', jacket: '#d9c2a2', collar: '#8a6a4a', inner: '#fbf6ee', apron: '#f4ecdf', pattern: null, kerchief: '#c9594f' },
    temple: { name: 'Temple robe', jacket: '#cfd5dc', collar: '#6b7584', inner: '#ffffff', belt: '#8a93a3', pattern: null },
    dancer: { name: 'Dancer silks', jacket: '#ffd6e3', collar: '#d9577f', inner: '#ffffff', skirt: '#ff9fb9', bow: '#ffffff', pibo: '#dff3ff', pattern: 'petals', sleeves: '#ffffff' },
    scholarOfficial: { name: 'Official robe', jacket: '#b3303d', collar: '#7d1d28', inner: '#fff7ea', belt: '#e6b64d', pattern: 'clouds', hat: 'official' },
    royal: { name: 'Crown princess robes', jacket: '#fff3e0', collar: '#c7364a', inner: '#fffdf7', skirt: '#d8434f', bow: '#e6b64d', pibo: '#ffe3a8', pattern: 'clouds', crown: 'phoenix', layered: ['#e6b64d', '#fffdf7'] },
    empress: { name: 'Empress regalia', jacket: '#c7263f', collar: '#e6b64d', inner: '#fff6e0', skirt: '#9e1c30', bow: '#e6b64d', pibo: '#ffd98a', pattern: 'brocade', crown: 'phoenixGrand', layered: ['#1f3f8a', '#fff6e0'] },
    general: { name: 'General\'s armor', jacket: '#7d1f2a', collar: '#3a2a2a', inner: '#f4efe6', armor: true, cape: '#b52a37', hairRibbon: '#b52a37' },
    immortal: { name: 'Immortal robes', jacket: '#f4fbff', collar: '#9fd1ea', inner: '#ffffff', skirt: '#dff1fb', bow: '#9fd1ea', pibo: '#e9f7ff', pattern: 'clouds', crown: 'jade', glow: true },
    physician: { name: 'Physician robe', jacket: '#e4efe3', collar: '#5f9072', inner: '#ffffff', belt: '#5f9072', pattern: null, pouch: true },
    musician: { name: 'Musician silks', jacket: '#e7dcf6', collar: '#7c5cb5', inner: '#ffffff', skirt: '#b9a2e6', bow: '#f3d27a', pibo: '#fff5d8', pattern: 'petals' },
    poet: { name: 'Poet\'s robe', jacket: '#eef3e2', collar: '#5c6f47', inner: '#ffffff', belt: '#9aaa6e', pattern: 'bamboo' },
    astronomer: { name: 'Star-watcher robe', jacket: '#2b2f63', collar: '#e6c56a', inner: '#f4f0ff', belt: '#e6c56a', pattern: 'stars' },
    chef: { name: 'Kitchen whites', jacket: '#fbf8f2', collar: '#c9594f', inner: '#ffffff', apron: '#f0e6d6', kerchief: '#c9594f', pattern: null },
    merchant: { name: 'Merchant brocade', jacket: '#2c6a64', collar: '#e0b04a', inner: '#fff8ea', belt: '#e0b04a', pattern: 'brocade', pendant: true },
    teahouse: { name: 'Teahouse hostess', jacket: '#f6e3c5', collar: '#6f8f5b', inner: '#fffaf2', skirt: '#8fb37c', bow: '#6f8f5b', pattern: 'petals' },
    farmer: { name: 'Tea picker', jacket: '#b9d3a8', collar: '#4e7a45', inner: '#fbf7ec', apron: '#efe6d3', hat: 'straw', pattern: null },
    silk: { name: 'Weaver silks', jacket: '#f4e6ff', collar: '#b06ac9', inner: '#ffffff', skirt: '#8fd1d9', bow: '#b06ac9', pibo: '#ffffff', pattern: 'flowers' },
    envoy: { name: 'Envoy\'s coat', jacket: '#1f4a73', collar: '#e0b04a', inner: '#fff8ea', belt: '#e0b04a', pattern: 'clouds', furCollar: true },
    priestess: { name: 'Taoist vestments', jacket: '#f3f1ea', collar: '#3b4c7a', inner: '#ffffff', belt: '#3b4c7a', pattern: 'clouds', crown: 'lotus' },
    swordswoman: { name: 'Wanderer blacks', jacket: '#2a2730', collar: '#b52a37', inner: '#f4efe6', belt: '#b52a37', bracer: true, cape: '#3a3540', hat: 'veil' },
    artisan: { name: 'Artisan wear', jacket: '#c5a36b', collar: '#5a4630', inner: '#fbf6ee', belt: '#5a4630', apron: '#8a6a4a', pattern: null },
    celestial: { name: 'Robes of the Silver River', jacket: '#fdfbff', collar: '#b9c6ff', inner: '#ffffff', skirt: '#cfd8ff', bow: '#f3d27a', pibo: '#e8ecff', pattern: 'stars', crown: 'stars', glow: true },
    traveler: { name: 'Road clothes', jacket: '#8a7a64', collar: '#4f5b6f', inner: '#f4efe6', belt: '#4f5b6f', cape: '#4f5b6f', hat: 'straw' },
  };

  function patternMarks(kind, color, cx, y0, y1, xw) {
    if (!kind) return '';
    let s = '';
    const spots = [[-0.62, 0.18], [0.66, 0.3], [-0.34, 0.62], [0.36, 0.72], [-0.78, 0.8], [0.12, 0.42], [0.82, 0.62], [-0.1, 0.9]];
    spots.forEach(([u, v], i) => {
      const x = cx + u * xw, y = y0 + v * (y1 - y0);
      if (kind === 'petals') s += flower(x, y, 6, U.tone(color, 0.08), '#f2c14e', 5, i);
      else if (kind === 'flowers') s += flower(x, y, 8, color, '#f2c14e', 5, i * 0.7);
      else if (kind === 'stars') s += `<path d="${starPath(x, y, 5.5)}" fill="${color}" opacity=".9"/>`;
      else if (kind === 'clouds') s += `<path d="M${f(x - 12)},${f(y)}q0,-8 8,-7q2,-7 10,-4q8,-2 8,6q6,1 4,6z" fill="none" stroke="${color}" stroke-width="1.6" opacity=".75"/>`;
      else if (kind === 'brocade') s += `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="none" stroke="${color}" stroke-width="1.6" opacity=".7"/><circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="${color}" opacity=".7"/>`;
      else if (kind === 'bamboo') s += `<path d="M${f(x)},${f(y - 12)}l0,24M${f(x)},${f(y - 2)}q7,-6 12,-4M${f(x)},${f(y + 6)}q-7,-5 -12,-2" stroke="${color}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    });
    return s;
  }

  function outfitLayer(ctx, O) {
    const { g, id } = ctx;
    const { cx, shY, shW, nw } = g;
    const J = O.jacket;
    const jShade = U.tone(J, -0.1, 0.04);
    const jLine = U.tone(J, -0.3, 0.05);
    const ny = shY - 30;
    let s = '';
    if (O.cape) {
      s += `<path d="M${f(cx - shW - 2)},${f(shY + 6)}C${f(cx - shW - 30)},${f(shY + 60)} ${f(cx - shW - 36)},470 ${f(cx - shW - 42)},520L${f(cx + shW + 42)},520C${f(cx + shW + 36)},470 ${f(cx + shW + 30)},${f(shY + 60)} ${f(cx + shW + 2)},${f(shY + 6)}Z" fill="${O.cape}" stroke="${U.tone(O.cape, -0.2)}" stroke-width="1.4"/>`;
    }
    if (O.glow) {
      s += `<ellipse cx="${cx}" cy="${f(shY + 90)}" rx="${f(shW + 70)}" ry="150" fill="url(#${id}glow)"/>`;
    }
    // jacket body with wide sleeves flaring at the bottom
    s += `<path d="${torsoPath(g)}" fill="url(#${id}cloth)" stroke="${jLine}" stroke-width="1.4"/>`;
    const ax = shW - 28;
    // sleeves: outer thirds, shaded
    [-1, 1].forEach((sd) => {
      s += `<path d="M${f(cx + sd * (shW - 8))},${f(shY + 22)}Q${f(cx + sd * (shW + 6))},${f(shY + 110)} ${f(cx + sd * (shW + 18))},520L${f(cx + sd * (ax + 2))},520Q${f(cx + sd * (ax + 4))},${f(shY + 110)} ${f(cx + sd * ax)},${f(shY + 60)}Z" fill="${jShade}" opacity=".55"/>`;
      s += `<path d="M${f(cx + sd * ax)},${f(shY + 60)}Q${f(cx + sd * (ax + 4))},${f(shY + 110)} ${f(cx + sd * (ax + 2))},520" stroke="${jLine}" stroke-width="1.6" fill="none" opacity=".55"/>`;
      s += `<path d="M${f(cx + sd * (shW - 20))},${f(shY + 80)}q${f(sd * 10)},30 ${f(sd * 6)},70" stroke="${jLine}" stroke-width="1.2" fill="none" opacity=".35"/>`;
      if (O.sleeves) {
        s += `<path d="M${f(cx + sd * (shW - 4))},470Q${f(cx + sd * (shW + 30))},490 ${f(cx + sd * (shW + 40))},520L${f(cx + sd * (shW - 20))},520Z" fill="${O.sleeves}" opacity=".9"/>`;
      }
    });
    if (O.pattern) s += patternMarks(O.pattern, O.collar, cx, shY + 30, 505, shW - 20);
    if (O.armor) {
      // lamellar armour: rows of small plates over the chest, round shoulder guards
      let rows = '';
      for (let r = 0; r < 6; r++) {
        const y = shY + 14 + r * 16;
        for (let c = -4; c <= 4; c++) {
          const x = cx + c * 15 + (r % 2) * 7;
          rows += `<rect x="${f(x - 7)}" y="${f(y)}" width="14" height="15" rx="3" fill="url(#${id}steel)" stroke="#5e6780" stroke-width="1"/>`;
        }
      }
      s += `<clipPath id="${id}ac"><path d="M${f(cx - 66)},${f(shY + 2)}Q${cx},${f(shY - 12)} ${f(cx + 66)},${f(shY + 2)}L${f(cx + 62)},${f(shY + 108)}Q${cx},${f(shY + 124)} ${f(cx - 62)},${f(shY + 108)}Z"/></clipPath><g clip-path="url(#${id}ac)">${rows}</g>`;
      s += `<path d="M${f(cx - 66)},${f(shY + 2)}Q${cx},${f(shY - 12)} ${f(cx + 66)},${f(shY + 2)}L${f(cx + 62)},${f(shY + 108)}Q${cx},${f(shY + 124)} ${f(cx - 62)},${f(shY + 108)}Z" fill="none" stroke="#4d5670" stroke-width="2"/>`;
      s += `<circle cx="${cx}" cy="${f(shY + 52)}" r="13" fill="#e6b64d" stroke="#9c7426" stroke-width="2"/><circle cx="${cx}" cy="${f(shY + 52)}" r="5" fill="#9c7426"/>`;
      [-1, 1].forEach((sd) => {
        const px = cx + sd * (shW - 14);
        s += `<path d="M${f(px - sd * 42)},${f(shY - 4)}C${f(px - sd * 4)},${f(shY - 34)} ${f(px + sd * 32)},${f(shY - 4)} ${f(px + sd * 26)},${f(shY + 46)}C${f(px + sd * 4)},${f(shY + 54)} ${f(px - sd * 26)},${f(shY + 30)} ${f(px - sd * 42)},${f(shY - 4)}Z" fill="url(#${id}steel)" stroke="#4d5670" stroke-width="2"/>`;
        s += `<path d="M${f(px - sd * 30)},${f(shY + 8)}Q${f(px)},${f(shY - 8)} ${f(px + sd * 22)},${f(shY + 22)}M${f(px - sd * 20)},${f(shY + 22)}Q${f(px + sd * 4)},${f(shY + 8)} ${f(px + sd * 22)},${f(shY + 36)}" stroke="#4d5670" stroke-width="1.4" fill="none"/>`;
      });
    }
    // chest-high skirt (Tang style) with a ribbon bow
    if (O.skirt) {
      const sy = shY + 48;
      s += `<path d="M${f(cx - shW + 24)},${f(sy)}Q${cx},${f(sy - 8)} ${f(cx + shW - 24)},${f(sy)}L${f(cx + shW - 16)},520L${f(cx - shW + 16)},520Z" fill="url(#${id}skirt)" stroke="${U.tone(O.skirt, -0.25)}" stroke-width="1.4"/>`;
      for (let i = -3; i <= 3; i++) {
        s += `<path d="M${f(cx + i * 26)},${f(sy + 14)}Q${f(cx + i * 28)},${f(sy + 80)} ${f(cx + i * 30)},520" stroke="${U.tone(O.skirt, -0.14)}" stroke-width="1.4" fill="none" opacity=".6"/>`;
      }
      s += `<path d="M${f(cx - shW + 24)},${f(sy)}Q${cx},${f(sy - 8)} ${f(cx + shW - 24)},${f(sy)}L${f(cx + shW - 22)},${f(sy + 13)}Q${cx},${f(sy + 5)} ${f(cx - shW + 22)},${f(sy + 13)}Z" fill="${O.bow}" opacity=".95"/>`;
      const bx = cx, by = sy + 4;
      const bw = O.bow, bd = U.tone(O.bow, -0.22);
      s += `<path d="M${bx},${by}C${bx - 12},${by - 16} ${bx - 34},${by - 12} ${bx - 30},${by + 2}C${bx - 28},${by + 12} ${bx - 10},${by + 8} ${bx},${by}Z" fill="${bw}" stroke="${bd}" stroke-width="1.3"/>`;
      s += `<path d="M${bx},${by}C${bx + 12},${by - 16} ${bx + 34},${by - 12} ${bx + 30},${by + 2}C${bx + 28},${by + 12} ${bx + 10},${by + 8} ${bx},${by}Z" fill="${bw}" stroke="${bd}" stroke-width="1.3"/>`;
      s += `<path d="M${bx - 3},${by + 3}Q${bx - 10},${by + 50} ${bx - 18},${by + 96}M${bx + 3},${by + 3}Q${bx + 8},${by + 56} ${bx + 14},${by + 104}" stroke="${bw}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<ellipse cx="${bx}" cy="${by + 1}" rx="6" ry="5" fill="${U.tone(bw, -0.08)}" stroke="${bd}" stroke-width="1.2"/>`;
    }
    if (O.apron) {
      const at = shY + 60;
      s += `<path d="M${f(cx - 50)},${f(at)}L${f(cx + 50)},${f(at)}L${f(cx + 60)},520L${f(cx - 60)},520Z" fill="${O.apron}" stroke="${U.tone(O.apron, -0.2)}" stroke-width="1.4"/>`;
      s += `<path d="M${f(cx - 56)},${f(at - 2)}L${f(cx + 56)},${f(at - 2)}L${f(cx + 56)},${f(at + 9)}L${f(cx - 56)},${f(at + 9)}Z" fill="${U.tone(O.apron, -0.12)}"/>`;
    }
    if (O.belt) {
      const by = shY + 92;
      s += `<path d="M${f(cx - shW + 26)},${f(by)}Q${cx},${f(by - 6)} ${f(cx + shW - 26)},${f(by)}L${f(cx + shW - 24)},${f(by + 20)}Q${cx},${f(by + 14)} ${f(cx - shW + 24)},${f(by + 20)}Z" fill="${O.belt}" stroke="${U.tone(O.belt, -0.25)}" stroke-width="1.2"/>`;
      s += `<path d="M${f(cx + 20)},${f(by + 14)}q-6,40 -2,70M${f(cx + 30)},${f(by + 14)}q4,34 10,62" stroke="${O.belt}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      if (O.pendant || O.pouch) {
        s += O.pendant
          ? `<path d="M${f(cx - 26)},${f(by + 18)}l0,20" stroke="#c7364a" stroke-width="2"/><circle cx="${f(cx - 26)}" cy="${f(by + 46)}" r="9" fill="#6fbf94" stroke="#3f7d5c" stroke-width="2"/><circle cx="${f(cx - 26)}" cy="${f(by + 46)}" r="3" fill="#dff5e8"/>`
          : `<path d="M${f(cx - 40)},${f(by + 18)}q-14,6 -10,26q12,10 24,0q4,-20 -14,-26Z" fill="#b98a5a" stroke="#7a5634" stroke-width="1.5"/>`;
      }
    }
    // cross collar: the wearer's left panel crosses over to her right (viewer's left)
    const cl = O.collar, clLine = U.tone(cl, -0.25);
    const low = O.skirt ? shY + 50 : shY + 94;
    const crossX = cx - 40;
    // under-collar (from viewer's left neck down to the centre, mostly hidden)
    s += `<path d="M${f(cx - nw - 6)},${f(ny - 4)}L${f(cx - nw + 8)},${f(ny - 6)}L${f(cx + 16)},${f(ny + 44)}L${f(cx + 4)},${f(ny + 50)}Z" fill="${O.inner}" stroke="${U.tone(O.inner, -0.2)}" stroke-width="1"/>`;
    // inner collar peeking out
    s += `<path d="M${f(cx + nw + 6)},${f(ny - 2)}L${f(crossX + 14)},${f(low)}" stroke="${O.inner}" stroke-width="12" stroke-linecap="butt"/>`;
    if (O.layered) {
      O.layered.forEach((c, i) => {
        s += `<path d="M${f(cx + nw + 8 + i * 7)},${f(ny - 4 + i * 5)}L${f(crossX + 14 + i * 8)},${f(low)}" stroke="${c}" stroke-width="9" stroke-linecap="butt"/>`;
      });
    }
    // over-collar band
    s += `<path d="M${f(cx + nw + 20)},${f(ny)}L${f(crossX + 34)},${f(low)}" stroke="${cl}" stroke-width="15" stroke-linecap="butt"/>`;
    s += `<path d="M${f(cx + nw + 13)},${f(ny - 3)}L${f(crossX + 27)},${f(low)}M${f(cx + nw + 27)},${f(ny + 3)}L${f(crossX + 41)},${f(low)}" stroke="${clLine}" stroke-width="1.2"/>`;
    // back of the collar around the neck
    s += `<path d="M${f(cx - nw - 7)},${f(ny - 2)}Q${cx},${f(ny - 16)} ${f(cx + nw + 24)},${f(ny + 2)}" stroke="${cl}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    if (O.furCollar) {
      s += `<path d="M${f(cx - nw - 26)},${f(ny + 6)}Q${cx},${f(ny - 30)} ${f(cx + nw + 26)},${f(ny + 6)}Q${f(cx + nw + 30)},${f(ny + 26)} ${f(cx + nw + 12)},${f(ny + 22)}Q${cx},${f(ny - 4)} ${f(cx - nw - 12)},${f(ny + 22)}Q${f(cx - nw - 30)},${f(ny + 26)} ${f(cx - nw - 26)},${f(ny + 6)}Z" fill="#f6efe2" stroke="#d6cbb6" stroke-width="1.5"/>`;
    }
    if (O.bracer) {
      [-1, 1].forEach((sd) => {
        s += `<path d="M${f(cx + sd * (shW - 2))},478L${f(cx + sd * (shW + 16))},478L${f(cx + sd * (shW + 20))},520L${f(cx + sd * (shW - 6))},520Z" fill="${U.tone(J, -0.18)}" stroke="${jLine}"/>`;
      });
    }
    // draped shawl (pibo): a translucent silk band over each upper arm
    if (O.pibo) {
      const pc = O.pibo, pl = U.tone(pc, -0.2);
      [-1, 1].forEach((sd) => {
        const a = [cx + sd * (shW - 36), shY - 12];
        const pts = [a, [cx + sd * (shW - 2), shY + 8], [cx + sd * (shW + 12), shY + 60], [cx + sd * (shW + 8), shY + 110], [cx + sd * (shW + 22), 470], [cx + sd * (shW + 30), 525]];
        s += `<path d="${lock(pts, (u) => 26 + 8 * Math.sin(u * 5), { flatRoot: true })}" fill="${pc}" opacity=".62" stroke="${pl}" stroke-width="1"/>`;
        s += `<path d="${spline(pts.slice(1).map((p) => [p[0] - sd * 4, p[1]]), false)}" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>`;
      });
    }
    return s;
  }

  // ---------------------------------------------------------------- hair
  function capPath(g) {
    const { cx, fw, headTop, browY } = g;
    const L = cx - fw - 12, R = cx + fw + 12;
    const hl = headTop + 50; // hairline at the centre
    return `M${f(L)},${f(browY + 10)}C${f(L - 6)},${f(headTop + 24)} ${f(cx - 66)},${f(headTop - 14)} ${cx},${f(headTop - 14)}C${f(cx + 66)},${f(headTop - 14)} ${f(R + 6)},${f(headTop + 24)} ${f(R)},${f(browY + 10)}C${f(R - 10)},${f(hl + 20)} ${f(cx + 50)},${f(hl)} ${cx},${f(hl)}C${f(cx - 50)},${f(hl)} ${f(L + 10)},${f(hl + 20)} ${f(L)},${f(browY + 10)}Z`;
  }

  // soft, slightly messy bang wisps: [root x, root y, tip x, tip y, width, bend]
  function bangWisps(g, style) {
    const { cx, fw, headTop, browY, eyeY } = g;
    const r = headTop + 34;
    if (style === 'updo' || style === 'ponytail') {
      // hair swept back: a few parted wisps
      return [
        [cx - 40, r + 4, cx - 62, browY + 2, 30, -10],
        [cx - 14, r - 2, cx - 36, browY - 6, 24, -8],
        [cx + 22, r, cx + 46, browY - 2, 26, 8],
        [cx + fw - 8, r + 20, cx + fw + 2, eyeY - 6, 22, 10],
        [cx - fw + 8, r + 20, cx - fw + 2, eyeY - 4, 22, -10],
      ];
    }
    return [
      [cx - fw + 6, r + 22, cx - fw + 4, eyeY + 4, 26, -10],
      [cx - 60, r + 8, cx - 58, browY + 14, 26, -9],
      [cx - 38, r + 2, cx - 34, browY + 20, 24, 7],
      [cx - 14, r - 4, cx - 8, browY + 30, 26, -5],
      [cx + 8, r - 4, cx + 14, browY + 12, 22, 6],
      [cx + 30, r, cx + 36, browY + 22, 26, 9],
      [cx + 56, r + 8, cx + 58, browY + 10, 24, 6],
      [cx + fw - 6, r + 22, cx + fw - 2, eyeY + 2, 26, 10],
    ];
  }

  function wispPath(w) {
    const [rx, ry, tx, ty, width, bend] = w;
    const pts = [[rx, ry], [U.lerp(rx, tx, 0.35) + bend * 0.8, U.lerp(ry, ty, 0.35)], [U.lerp(rx, tx, 0.7) + bend * 0.7, U.lerp(ry, ty, 0.7)], [tx, ty]];
    return lock(pts, (u) => width * Math.pow(1 - u, 0.75) + 0.5);
  }

  // long wavy side lock that frames the face and falls over the shoulder
  function sideLockPts(g, side, len, wave = 1) {
    const { cx, fw, browY, cheekY, shY } = g;
    const pts = [];
    const y0 = browY - 30;
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const y = y0 + (len - y0) * u;
      let x = cx + side * (fw + 8);
      if (y > shY - 40) x += side * (y - (shY - 40)) * 0.22;
      x += side * Math.sin(u * Math.PI * 2.6) * 9 * wave * Math.min(1, u * 2.2);
      if (i === n) x -= side * 14;
      pts.push([x, y]);
    }
    return pts;
  }

  function hairBack(ctx, style) {
    const { g, hp, id } = ctx;
    const { cx, fw, headTop, cheekY, shY, shW, jawY } = g;
    const fill = `url(#${id}hairback)`;
    const stroke = `stroke="${hp.outline}" stroke-width="1.5" stroke-linejoin="round"`;
    let s = '';
    const len = g.hairLen;
    if (style === 'wavy' || style === 'straight' || style === 'buns') {
      const wave = style === 'straight' ? 0 : 1;
      const prof = [[headTop + 40, fw + 2], [cheekY, fw + 22], [shY - 30, fw + 30], [shY + 40, shW + 16], [len, shW + 26]];
      const offAt = (y) => {
        for (let k = 1; k < prof.length; k++) {
          if (y <= prof[k][0]) {
            const [y0, o0] = prof[k - 1], [y1, o1] = prof[k];
            return U.lerp(o0, o1, U.clamp((y - y0) / (y1 - y0), 0, 1));
          }
        }
        return prof[prof.length - 1][1];
      };
      const edge = (side) => {
        const pts = [];
        const n = 13;
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const y = headTop + 40 + (len - headTop - 40) * u;
          const x = cx + side * (offAt(y) + Math.sin(u * Math.PI * 3.4) * 10 * wave * Math.min(1, u * 1.8));
          pts.push([x, y]);
        }
        return pts;
      };
      const R = edge(1), Lf = edge(-1);
      // scalloped bottom with curls
      const bottom = [];
      const bx0 = R[R.length - 1][0], bx1 = Lf[Lf.length - 1][0];
      const nb = 7;
      for (let i = 1; i < nb; i++) {
        const u = i / nb;
        bottom.push([bx0 + (bx1 - bx0) * u, len + (i % 2 ? 14 : -10) * (wave ? 1 : 0.4) - Math.sin(u * Math.PI) * 6]);
      }
      const pts = [[cx, headTop - 8]].concat(R).concat(bottom).concat(Lf.reverse());
      s += `<path d="${spline(pts, true)}" fill="${fill}" ${stroke}/>`;
      // darker inner hair behind the neck
      s += `<path d="M${f(cx - fw + 2)},${f(cheekY - 10)}Q${cx},${f(cheekY + 44)} ${f(cx + fw - 2)},${f(cheekY - 10)}L${f(cx + shW - 16)},${f(shY + 70)}Q${cx},${f(shY + 20)} ${f(cx - shW + 16)},${f(shY + 70)}Z" fill="${hp.shade}" opacity=".9"/>`;
      // wave shine on the back mass
      [-1, 1].forEach((sd) => {
        s += `<path d="M${f(cx + sd * (fw + 26))},${f(shY - 10)}q${f(sd * 14)},40 ${f(sd * 4)},80q${f(-sd * 8)},30 ${f(sd * 10)},60" stroke="${hp.light}" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`;
      });
    } else if (style === 'braid') {
      const pts = [[cx, headTop - 14], [cx + fw + 26, headTop + 60], [cx + fw + 26, cheekY + 20], [cx + fw + 6, jawY + 16], [cx, jawY + 24], [cx - fw - 6, jawY + 16], [cx - fw - 26, cheekY + 20], [cx - fw - 26, headTop + 60]];
      s += `<path d="${spline(pts, true)}" fill="${fill}" ${stroke}/>`;
      s += `<path d="M${f(cx - fw + 6)},${f(cheekY - 10)}Q${cx},${f(cheekY + 40)} ${f(cx + fw - 6)},${f(cheekY - 10)}L${f(cx + fw - 10)},${f(jawY + 16)}Q${cx},${f(jawY + 24)} ${f(cx - fw + 10)},${f(jawY + 16)}Z" fill="${hp.shade}" opacity=".9"/>`;
    } else {
      // ponytail / updo: hair gathered back
      const pts = [[cx, headTop - 14], [cx + fw + 22, headTop + 60], [cx + fw + 20, cheekY + 10], [cx + fw + 2, jawY + 4], [cx, jawY + 12], [cx - fw - 2, jawY + 4], [cx - fw - 20, cheekY + 10], [cx - fw - 22, headTop + 60]];
      s += `<path d="${spline(pts, true)}" fill="${fill}" ${stroke}/>`;
      s += `<path d="M${f(cx - fw + 8)},${f(cheekY - 10)}Q${cx},${f(cheekY + 40)} ${f(cx + fw - 8)},${f(cheekY - 10)}L${f(cx + fw - 14)},${f(jawY + 4)}Q${cx},${f(jawY + 12)} ${f(cx - fw + 14)},${f(jawY + 4)}Z" fill="${hp.shade}" opacity=".9"/>`;
      if (style === 'ponytail') {
        const ax = cx + 30, ay = headTop - 4;
        const tail = [[ax, ay], [ax + 50, ay + 10], [ax + 86, cheekY - 30], [ax + 96, cheekY + 50], [ax + 84, shY + 20], [ax + 92, shY + 90], [ax + 70, len - 40]];
        s += `<path d="${lock(tail, (u) => 70 * (1 - Math.pow(u, 1.4) * 0.92) + 10)}" fill="${fill}" ${stroke}/>`;
        s += `<path d="${spline(tail.slice(1).map((p) => [p[0] + 4, p[1]]), false)}" stroke="${hp.light}" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>`;
      }
    }
    return s;
  }

  function hairFront(ctx, style) {
    const { g, hp, id, sp } = ctx;
    const { cx, fw, cheekY, shY, jawY, headTop } = g;
    const stroke = `stroke="${hp.outline}" stroke-width="1.4" stroke-linejoin="round"`;
    const fill = `url(#${id}hair)`;
    let s = '';
    // buns sit on top of the head (drawn before the cap so the cap overlaps their base)
    if (style === 'buns') {
      [-1, 1].forEach((sd) => {
        const bx = cx + sd * 58, by = headTop - 6;
        s += `<circle cx="${f(bx)}" cy="${f(by)}" r="31" fill="${fill}" ${stroke}/>`;
        s += `<path d="M${f(bx - 18)},${f(by - 6)}q14,-20 32,-4M${f(bx - 16)},${f(by + 10)}q18,-14 34,2" stroke="${hp.line}" stroke-width="1.4" fill="none" opacity=".4"/>`;
        s += `<path d="M${f(bx - 12)},${f(by - 18)}q12,-8 24,0" stroke="${hp.shine}" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`;
      });
    }
    if (style === 'updo') {
      const bx = cx + 6, by = headTop - 18;
      s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="46" ry="30" fill="${fill}" ${stroke}/>`;
      s += `<path d="M${f(bx - 34)},${f(by + 2)}q30,-26 66,-6M${f(bx - 26)},${f(by + 14)}q30,-16 56,0" stroke="${hp.line}" stroke-width="1.4" fill="none" opacity=".4"/>`;
      s += `<path d="M${f(bx - 20)},${f(by - 16)}q20,-10 40,0" stroke="${hp.shine}" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`;
    }
    // side locks
    const loose = style === 'wavy' || style === 'straight' || style === 'buns';
    const lockLen = loose ? Math.min(g.hairLen - 30, 480) : style === 'braid' ? jawY + 30 : jawY + 34;
    [-1, 1].forEach((sd) => {
      if (style === 'braid' && sd < 0) return;
      const pts = sideLockPts(g, sd, lockLen, style === 'straight' ? 0.15 : loose ? 1 : 0.5);
      const w0 = loose ? 38 : 28;
      s += `<path d="${lock(pts, (u) => w0 * (0.8 + 0.3 * Math.sin(u * Math.PI)) * Math.pow(1 - u, 0.55) + 1)}" fill="${fill}" ${stroke}/>`;
      if (loose) {
        const pts2 = pts.slice(0, -2).map((p, i) => [p[0] - sd * (6 + i * 1.5), p[1] + 10]);
        s += `<path d="${lock(pts2, (u) => 18 * Math.pow(1 - u, 0.6) + 1)}" fill="${fill}" ${stroke}/>`;
      }
      s += `<path d="${spline(pts.slice(1, -1).map((p) => [p[0] + sd * 5, p[1]]), false)}" stroke="${hp.shine}" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>`;
      s += `<path d="${spline(pts.slice(1, -1).map((p) => [p[0] - sd * 8, p[1] + 6]), false)}" stroke="${hp.line}" stroke-width="1.2" fill="none" opacity=".35"/>`;
      // a small curl in front of the ear
      const c = [[cx + sd * (fw - 2), g.browY - 4], [cx + sd * (fw - 6), cheekY + 10], [cx + sd * (fw - 18), jawY + 6]];
      s += `<path d="${lock(c, (u) => 20 * (1 - u * 0.9))}" fill="${fill}" ${stroke}/>`;
    });
    if (style === 'braid') {
      // braid over her right shoulder (viewer's left)
      let x = cx - fw - 2, y = cheekY + 4;
      s += `<path d="${lock([[cx - fw + 4, g.browY - 20], [cx - fw - 8, cheekY - 10], [x, y + 10]], (u) => 36 * (1 - u * 0.2))}" fill="${fill}" ${stroke}/>`;
      for (let i = 0; i < 8; i++) {
        const r = 15 - i * 0.8;
        const xx = x - i * 1.5 + Math.sin(i * 0.9) * 2;
        s += `<ellipse cx="${f(xx - 5)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.86)}" fill="${fill}" ${stroke} transform="rotate(-26 ${f(xx - 5)} ${f(y)})"/>`;
        s += `<ellipse cx="${f(xx + 5)}" cy="${f(y + 12)}" rx="${f(r)}" ry="${f(r * 0.86)}" fill="${fill}" ${stroke} transform="rotate(26 ${f(xx + 5)} ${f(y + 12)})"/>`;
        y += 24;
      }
      s += `<path d="${lock([[x - 10, y - 4], [x - 16, y + 24], [x - 8, y + 48]], (u) => 22 * (1 - u * 0.8))}" fill="${fill}" ${stroke}/>`;
      s += `<rect x="${f(x - 24)}" y="${f(y - 12)}" width="26" height="10" rx="5" fill="${ctx.ribbon}" stroke="${U.tone(ctx.ribbon, -0.25)}"/>`;
    }
    // cap + bang wisps
    const cap = capPath(g);
    s += `<path d="${cap}" fill="${fill}" ${stroke}/>`;
    const wisps = bangWisps(g, style);
    // soft shadow of the bangs on the forehead
    let shadows = '';
    wisps.forEach((w) => {
      shadows += `<path d="${wispPath([w[0], w[1] + 6, w[2] + 2, w[3] + 7, w[4], w[5]])}" fill="${sp.shade}"/>`;
    });
    s += `<g clip-path="url(#${id}face)" opacity=".8">${shadows}</g>`;
    wisps.forEach((w, i) => {
      s += `<path d="${wispPath(w)}" fill="${fill}" ${stroke}/>`;
      const [rx, ry, tx, ty, , bend] = w;
      s += `<path d="M${f(rx + bend * 0.2)},${f(ry + 8)}Q${f((rx + tx) / 2 + bend)},${f((ry + ty) / 2)} ${f(tx + (rx - tx) * 0.25)},${f(ty - (ty - ry) * 0.25)}" stroke="${hp.line}" stroke-width="1.1" fill="none" opacity=".3" stroke-linecap="round"/>`;
    });
    // glossy highlight band across the crown
    const hy = headTop + 30;
    s += `<path d="M${f(cx - fw + 14)},${f(hy + 16)}Q${f(cx - 30)},${f(hy - 12)} ${f(cx + 6)},${f(hy - 8)}Q${f(cx + 40)},${f(hy - 12)} ${f(cx + fw - 12)},${f(hy + 14)}" stroke="${hp.shine}" stroke-width="7" fill="none" opacity=".65" stroke-linecap="round" stroke-dasharray="26 7 14 9 30 6"/>`;
    return s;
  }

  function ahoge(ctx) {
    const { g, hp } = ctx;
    const x = g.cx + 6, y = g.headTop - 12;
    return `<path d="M${f(x)},${f(y + 10)}C${f(x - 4)},${f(y - 22)} ${f(x + 26)},${f(y - 40)} ${f(x + 40)},${f(y - 28)}C${f(x + 24)},${f(y - 30)} ${f(x + 10)},${f(y - 14)} ${f(x + 8)},${f(y + 12)}Z" fill="${hp.base}" stroke="${hp.outline}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${f(x + 30)},${f(y - 30)}C${f(x + 44)},${f(y - 30)} ${f(x + 46)},${f(y - 16)} ${f(x + 38)},${f(y - 10)}" stroke="${hp.outline}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  }

  // ---------------------------------------------------------------- ornaments
  function ornaments(ctx, style, O, age) {
    const { g, ribbon } = ctx;
    const { cx, fw, headTop, browY } = g;
    let s = '';
    const rd = U.tone(ribbon, -0.22);
    if (style === 'buns') {
      [-1, 1].forEach((sd) => {
        const bx = cx + sd * 58, by = headTop - 6;
        s += `<path d="M${f(bx - 27)},${f(by + 12)}Q${f(bx)},${f(by + 26)} ${f(bx + 27)},${f(by + 12)}" stroke="${ribbon}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
        const kx = bx + sd * 24, ky = by + 14;
        s += `<path d="M${f(kx)},${f(ky)}c${f(sd * 6)},-14 ${f(sd * 22)},-10 ${f(sd * 18)},2c${f(-sd * 2)},8 ${f(-sd * 12)},6 ${f(-sd * 18)},-2Z" fill="${ribbon}" stroke="${rd}" stroke-width="1.2"/>`;
        s += `<path d="M${f(kx)},${f(ky + 2)}q${f(sd * 12)},26 ${f(sd * 6)},58M${f(kx + sd * 4)},${f(ky)}q${f(sd * 20)},20 ${f(sd * 22)},48" stroke="${ribbon}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
        s += `<circle cx="${f(kx)}" cy="${f(ky)}" r="4" fill="#f6d06b" stroke="${rd}"/>`;
      });
    }
    if (style === 'ponytail') {
      const ax = cx + 30, ay = headTop - 4;
      s += `<path d="M${f(ax - 8)},${f(ay - 10)}q12,-8 22,4q-4,12 -16,10z" fill="${ribbon}" stroke="${rd}" stroke-width="1.2"/>`;
      s += `<path d="M${f(ax + 8)},${f(ay)}q18,20 14,54M${f(ax + 12)},${f(ay - 4)}q28,12 30,44" stroke="${ribbon}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    }
    if (style === 'updo' || age >= 16) {
      // golden hairpins with dangling pearls (buyao)
      const px = cx + fw - 18, py = headTop + 18;
      s += `<path d="M${f(px - 30)},${f(py + 14)}L${f(px + 34)},${f(py - 20)}" stroke="#e2b04c" stroke-width="4" stroke-linecap="round"/>`;
      s += flower(px + 30, py - 18, 11, '#f7a8bd', '#f6d06b', 5, 0.3);
      for (let i = 0; i < 3; i++) {
        const dx = px + 22 + i * 7, len = 26 + i * 8;
        s += `<path d="M${f(dx)},${f(py - 8)}l0,${len}" stroke="#e2b04c" stroke-width="1.2"/><circle cx="${f(dx)}" cy="${f(py - 8 + len)}" r="3.2" fill="#fff8ec" stroke="#d6b27a"/>`;
      }
    }
    if (O.hairFlower || style === 'wavy' || style === 'straight') {
      s += flower(cx + fw - 6, browY - 44, 10, '#f7a8bd', '#f6d06b', 5, 0.2);
      s += flower(cx + fw + 10, browY - 30, 7, '#ffd1dc', '#f6d06b', 5, 0.8);
    }
    return s;
  }

  function starPin(ctx) {
    const { g } = ctx;
    const x = g.cx - g.fw + 20, y = g.browY - 36;
    return `<g class="star-pin"><path d="${starPath(x, y, 13, -80)}" fill="#f7d774" stroke="#c9953a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${f(x - 3)}" cy="${f(y - 3)}" r="2.8" fill="#fffbe6"/><path d="M${f(x + 2)},${f(y + 10)}l-2,18" stroke="#c9953a" stroke-width="1.1"/><circle cx="${f(x)}" cy="${f(y + 30)}" r="3" fill="#fff8ec" stroke="#d6b27a"/></g>`;
  }

  function headgear(ctx, kind, O) {
    const { g } = ctx;
    const { cx, fw, headTop } = g;
    if (kind === 'phoenix' || kind === 'phoenixGrand') {
      const y = headTop + 8;
      const grand = kind === 'phoenixGrand';
      let s = `<path d="M${f(cx - 74)},${f(y + 34)}Q${cx},${f(y - 16)} ${f(cx + 74)},${f(y + 34)}" stroke="#e2b04c" stroke-width="6" fill="none"/>`;
      // phoenix wings
      [-1, 1].forEach((sd) => {
        s += `<path d="M${f(cx + sd * 10)},${f(y + 4)}C${f(cx + sd * 40)},${f(y - 30)} ${f(cx + sd * 80)},${f(y - 26)} ${f(cx + sd * 96)},${f(y - 4)}C${f(cx + sd * 70)},${f(y - 8)} ${f(cx + sd * 50)},${f(y + 6)} ${f(cx + sd * 28)},${f(y + 16)}Z" fill="#f0c95a" stroke="#a97f2a" stroke-width="1.5"/>`;
        s += `<path d="M${f(cx + sd * 30)},${f(y - 4)}q${f(sd * 24)},-14 ${f(sd * 54)},-8M${f(cx + sd * 34)},${f(y + 6)}q${f(sd * 24)},-10 ${f(sd * 50)},-2" stroke="#a97f2a" stroke-width="1.2" fill="none"/>`;
        for (let i = 0; i < (grand ? 5 : 3); i++) {
          const dx = cx + sd * (60 + i * 9), l = 22 + i * 6;
          s += `<path d="M${f(dx)},${f(y + 12)}l0,${l}" stroke="#e2b04c" stroke-width="1.2"/><circle cx="${f(dx)}" cy="${f(y + 12 + l)}" r="3.2" fill="#fff8ec" stroke="#d6b27a"/>`;
        }
      });
      s += `<path d="${starPath(cx, y - 6, grand ? 16 : 12, -90, 0.5)}" fill="#f7d774" stroke="#a97f2a" stroke-width="1.5"/>`;
      s += `<circle cx="${cx}" cy="${f(y + 18)}" r="7" fill="${grand ? '#c7263f' : '#e4718f'}" stroke="#fff" stroke-width="1.5"/>`;
      return s;
    }
    if (kind === 'jade' || kind === 'lotus') {
      const y = headTop - 6;
      if (kind === 'lotus') {
        return `<path d="M${f(cx - 22)},${f(y + 16)}Q${f(cx - 26)},${f(y - 8)} ${f(cx - 10)},${f(y - 12)}Q${cx},${f(y - 30)} ${f(cx + 10)},${f(y - 12)}Q${f(cx + 26)},${f(y - 8)} ${f(cx + 22)},${f(y + 16)}Z" fill="#e8eef9" stroke="#3b4c7a" stroke-width="1.8"/><path d="M${f(cx - 44)},${f(y + 8)}L${f(cx + 44)},${f(y + 4)}" stroke="#c9a24c" stroke-width="3" stroke-linecap="round"/>`;
      }
      return `<path d="M${f(cx - 24)},${f(y + 14)}L${f(cx - 18)},${f(y - 10)}L${cx},${f(y - 20)}L${f(cx + 18)},${f(y - 10)}L${f(cx + 24)},${f(y + 14)}Z" fill="#bfe8d6" stroke="#4f9a7c" stroke-width="1.8"/><path d="M${f(cx - 50)},${f(y + 6)}L${f(cx + 50)},${f(y + 2)}" stroke="#e8f6ff" stroke-width="3" stroke-linecap="round"/>`;
    }
    if (kind === 'stars') {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.1 + (i / 6) * 0.8);
        s += `<path d="${starPath(cx + Math.cos(a) * (fw + 18), headTop + 70 + Math.sin(a) * 76, 6 + (i % 2) * 3)}" fill="#fff4c2" stroke="#e2b04c" stroke-width="1"/>`;
      }
      return s;
    }
    if (kind === 'official') {
      const y = headTop + 22;
      return `<path d="M${f(cx - 70)},${f(y + 16)}Q${cx},${f(y - 4)} ${f(cx + 70)},${f(y + 16)}L${f(cx + 64)},${f(y - 24)}Q${cx},${f(y - 58)} ${f(cx - 64)},${f(y - 24)}Z" fill="#26222c" stroke="#111" stroke-width="1.5"/><path d="M${f(cx - 36)},${f(y - 34)}Q${cx},${f(y - 70)} ${f(cx + 36)},${f(y - 34)}Z" fill="#2f2a36" stroke="#111" stroke-width="1.5"/><path d="M${f(cx - 66)},${f(y - 6)}L${f(cx - 150)},${f(y - 16)}L${f(cx - 150)},${f(y - 2)}L${f(cx - 66)},${f(y + 4)}ZM${f(cx + 66)},${f(y - 6)}L${f(cx + 150)},${f(y - 16)}L${f(cx + 150)},${f(y - 2)}L${f(cx + 66)},${f(y + 4)}Z" fill="#26222c" stroke="#111" stroke-width="1.2"/><path d="M${f(cx - 60)},${f(y + 6)}Q${cx},${f(y - 10)} ${f(cx + 60)},${f(y + 6)}" stroke="#e6b64d" stroke-width="2" fill="none"/>`;
    }
    if (kind === 'straw' || kind === 'veil') {
      const y = headTop + 20;
      let s = '';
      if (kind === 'veil') {
        s += `<path d="M${f(cx - 104)},${f(y + 20)}L${f(cx - 112)},${f(y + 170)}Q${cx},${f(y + 186)} ${f(cx + 112)},${f(y + 170)}L${f(cx + 104)},${f(y + 20)}Z" fill="#f4f1ff" opacity=".42" stroke="#ddd8f0"/>`;
      }
      s += `<path d="M${f(cx - 118)},${f(y + 24)}Q${cx},${f(y + 44)} ${f(cx + 118)},${f(y + 24)}L${cx},${f(y - 58)}Z" fill="${kind === 'veil' ? '#3a3540' : '#e6c983'}" stroke="${kind === 'veil' ? '#1f1c24' : '#a98a4a'}" stroke-width="2" stroke-linejoin="round"/>`;
      for (let i = -3; i <= 3; i++) s += `<path d="M${cx},${f(y - 56)}L${f(cx + i * 36)},${f(y + 30 - Math.abs(i) * 2)}" stroke="${kind === 'veil' ? '#26222c' : '#b99a5a'}" stroke-width="1" opacity=".7"/>`;
      return s;
    }
    return '';
  }

  // ---------------------------------------------------------------- effects & emotes
  function effects(ctx, E) {
    const { g } = ctx;
    const { cx, eyeY, eyeDX, fw, headTop } = g;
    let s = '';
    if (E.tears) {
      [-1, 1].forEach((sd) => {
        const x = cx + sd * (eyeDX + 12), y = eyeY + 16;
        if (E.tears > 1) s += `<path d="M${f(x - 5)},${f(y)}Q${f(x - 8)},${f(y + 30)} ${f(x - 2)},${f(y + 56)}L${f(x + 6)},${f(y + 56)}Q${f(x + 4)},${f(y + 28)} ${f(x + 5)},${f(y)}Z" fill="#c9e8ff" opacity=".8"/>`;
        s += `<path d="M${f(x + sd * 8)},${f(y - 2)}q-5,9 0,12q5,-3 0,-12Z" fill="#e4f4ff" stroke="#8cc5ec" stroke-width="1"/>`;
      });
    }
    if (E.sweat) {
      const x = cx + fw + 14, y = headTop + 92;
      s += `<path d="M${f(x)},${f(y)}q-9,15 0,20q9,-5 0,-20Z" fill="#d6eeff" stroke="#7ab6e0" stroke-width="1.5"/>`;
    }
    if (E.vein) {
      const x = cx + fw - 18, y = headTop + 46;
      s += `<g stroke="#e0485e" stroke-width="3" fill="none" stroke-linecap="round"><path d="M${x - 10},${y - 3}q7,-1 8,-8M${x + 3},${y - 11}q1,7 8,8M${x + 11},${y + 3}q-7,1 -8,8M${x - 2},${y + 11}q-1,-7 -8,-8"/></g>`;
    }
    if (E.hatch) {
      [-1, 1].forEach((sd) => {
        const x = cx + sd * (fw - 30), y = g.cheekY + 30;
        s += `<path d="M${f(x - 10)},${f(y + 5)}l6,-9M${f(x - 2)},${f(y + 5)}l6,-9M${f(x + 6)},${f(y + 5)}l6,-9" stroke="#ec6f86" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`;
      });
    }
    return s;
  }

  const EMOTE = {
    note: (x, y) => `<g fill="#9a6ad2"><path d="M${x},${y}l0,-26l16,-5l0,24" stroke="#9a6ad2" stroke-width="3" fill="none"/><ellipse cx="${x - 4}" cy="${y}" rx="6" ry="4.5"/><ellipse cx="${x + 12}" cy="${y - 3}" rx="6" ry="4.5"/></g>`,
    heart: (x, y) => `<path d="M${x},${y + 10}C${x - 22},${y - 4} ${x - 12},${y - 22} ${x},${y - 10}C${x + 12},${y - 22} ${x + 22},${y - 4} ${x},${y + 10}Z" fill="#ef6f8f" stroke="#fff" stroke-width="2"/>`,
    spark: (x, y) => `<path d="${starPath(x, y, 14)}" fill="#f6d06b" stroke="#fff" stroke-width="1.5"/><path d="${starPath(x + 20, y + 16, 7)}" fill="#fff1b0"/>`,
    bang: (x, y) => `<path d="M${x - 3},${y - 22}L${x + 5},${y - 22}L${x + 3},${y + 2}L${x - 1},${y + 2}Z" fill="#e0485e"/><circle cx="${x + 1}" cy="${y + 10}" r="3.5" fill="#e0485e"/>`,
    q: (x, y) => `<text x="${x}" y="${y + 10}" font-size="34" font-family="Georgia,serif" font-weight="700" fill="#4a8cc4" text-anchor="middle">?</text>`,
    drop: (x, y) => `<path d="M${x},${y - 12}q-10,16 0,22q10,-6 0,-22Z" fill="#d6eeff" stroke="#7ab6e0" stroke-width="1.5"/>`,
    gloom: (x, y) => `<path d="M${x - 14},${y - 10}q10,-10 20,0q10,-10 16,4" stroke="#7b7fa6" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${x - 8},${y + 4}l-4,10M${x + 4},${y + 4}l-2,12M${x + 16},${y + 4}l-4,10" stroke="#9aa0c6" stroke-width="2.5" stroke-linecap="round"/>`,
    anger: (x, y) => `<g stroke="#e0485e" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M${x - 11},${y - 3}q8,-1 9,-9M${x + 3},${y - 12}q1,8 9,9M${x + 12},${y + 3}q-8,1 -9,9M${x - 2},${y + 12}q-1,-8 -9,-9"/></g>`,
    zzz: (x, y) => `<text x="${x}" y="${y}" font-size="22" font-family="Georgia,serif" font-weight="700" fill="#8a93c8">z<tspan dy="-10" font-size="16">z</tspan><tspan dy="-8" font-size="12">z</tspan></text>`,
    dots: (x, y) => `<g fill="#7b7fa6"><circle cx="${x - 12}" cy="${y}" r="3.5"/><circle cx="${x}" cy="${y}" r="3.5"/><circle cx="${x + 12}" cy="${y}" r="3.5"/></g>`,
  };
  A.EMOTES = Object.keys(EMOTE);

  // ---------------------------------------------------------------- main entry
  /** o = { look:{hair, eyes, skin, style, ribbon, freckles}, age, expr, outfit, ahoge, emote, blink, cls, styleOverride } */
  A.portrait = function (o) {
    const id = 'sp' + ++uid + '_';
    const age = o.age || 12;
    const g = geom(age);
    const look = o.look || {};
    const hp = (A.HAIR[look.hair] || A.HAIR.gold).pal;
    const sp = skinPal((A.SKIN[look.skin] || A.SKIN.fair).base);
    const ep = A.EYES[look.eyes] || A.EYES.blossom;
    const E = EXPR[o.expr] || EXPR.neutral;
    const O = typeof o.outfit === 'object' ? o.outfit : A.OUTFITS[o.outfit] || A.OUTFITS.everyday;
    let style = o.styleOverride || look.style || 'wavy';
    if (O.crown === 'phoenix' || O.crown === 'phoenixGrand' || O.hat === 'official') style = 'updo';
    if (O.hairRibbon && style !== 'updo') style = 'ponytail';
    const lash = U.mix(hp.line, '#3a1a22', 0.55);
    const ribbon = look.ribbon || O.hairRibbon || O.collar || '#e4718f';
    const ctx = { g, hp, sp, ep, id, lash, ribbon };
    const { cx } = g;

    const defs = `<defs>
      <linearGradient id="${id}hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hp.light}"/><stop offset=".5" stop-color="${hp.base}"/><stop offset="1" stop-color="${hp.shade}"/></linearGradient>
      <linearGradient id="${id}hairback" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hp.shade}"/><stop offset=".55" stop-color="${hp.base}"/><stop offset="1" stop-color="${hp.shade}"/></linearGradient>
      <linearGradient id="${id}white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2dcea"/><stop offset=".45" stop-color="#fdfbff"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
      <linearGradient id="${id}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ep.ring}"/><stop offset=".38" stop-color="${ep.dark}"/><stop offset=".78" stop-color="${ep.base}"/><stop offset="1" stop-color="${ep.light}"/></linearGradient>
      <linearGradient id="${id}skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sp.base}"/><stop offset="1" stop-color="${U.tone(sp.base, -0.015, 0.03)}"/></linearGradient>
      <linearGradient id="${id}cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${U.tone(O.jacket, 0.03)}"/><stop offset="1" stop-color="${U.tone(O.jacket, -0.06, 0.03)}"/></linearGradient>
      <linearGradient id="${id}skirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${U.tone(O.skirt || '#fff', 0.05)}"/><stop offset="1" stop-color="${U.tone(O.skirt || '#fff', -0.06, 0.03)}"/></linearGradient>
      <linearGradient id="${id}steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f4f9"/><stop offset=".5" stop-color="#b9c2d3"/><stop offset="1" stop-color="#8a95ab"/></linearGradient>
      <radialGradient id="${id}blush"><stop offset="0" stop-color="${sp.blush}" stop-opacity=".9"/><stop offset="1" stop-color="${sp.blush}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}glow"><stop offset="0" stop-color="#fffbe6" stop-opacity=".9"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}face"><path d="${facePath(g)}"/></clipPath>
    </defs>`;

    const back = hairBack(ctx, style);
    const body = neck(ctx) + outfitLayer(ctx, O);

    let face = `<path d="${facePath(g)}" fill="url(#${id}skin)" stroke="${sp.line}" stroke-width="1.5"/>`;
    const bl = E.blush == null ? 0.45 : E.blush;
    [-1, 1].forEach((sd) => {
      face += `<ellipse cx="${f(cx + sd * (g.fw - 30))}" cy="${f(g.cheekY + 28)}" rx="${E.puff ? 25 : 22}" ry="${E.puff ? 13 : 11}" fill="url(#${id}blush)" opacity="${f(Math.min(1, 0.15 + bl))}"/>`;
    });
    if (look.freckles) {
      [[-44, 0], [-36, 6], [-28, -2], [-50, 8], [44, 0], [36, 6], [28, -2], [50, 8]].forEach(([dx, dy]) => {
        face += `<circle cx="${f(cx + dx)}" cy="${f(g.cheekY + 18 + dy)}" r="1.5" fill="${sp.deep}" opacity=".55"/>`;
      });
    }
    face += `<path d="M${cx + 1},${f(g.noseY - 3)}q2,2.5 -0.5,4" stroke="${sp.line}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".5"/>`;

    let eyes = '';
    if (E.eyes === 'joy') eyes = closedEye(ctx, -1, 'joy') + closedEye(ctx, 1, 'joy');
    else if (E.eyes === 'calm') eyes = closedEye(ctx, -1, 'calm') + closedEye(ctx, 1, 'calm');
    else if (E.eyes === 'wink') eyes = eye(ctx, -1, E) + closedEye(ctx, 1, 'joy');
    else {
      const open = eye(ctx, -1, E) + eye(ctx, 1, E);
      const shut = closedEye(ctx, -1, 'calm') + closedEye(ctx, 1, 'calm');
      eyes = o.blink === false ? open : `<g class="eyes-open">${open}</g><g class="eyes-shut">${shut}</g>`;
    }
    const talkKind = E.mouth === 'grin' || E.mouth === 'laugh' ? 'grin' : 'talk';
    const mouths = `<g class="mouth-rest">${mouth(ctx, E.mouth)}</g><g class="mouth-talk">${mouth(ctx, talkKind)}</g>`;

    let front = hairFront(ctx, style);
    if (o.ahoge !== false && !O.hat && !O.crown) front += ahoge(ctx);
    let acc = '';
    if (O.hat) acc += headgear(ctx, O.hat, O);
    else {
      acc += ornaments(ctx, style, O, age);
      acc += starPin(ctx);
      if (O.crown) acc += headgear(ctx, O.crown, O);
    }
    const fx = effects(ctx, E);
    const em = o.emote && EMOTE[o.emote] ? `<g class="emote">${EMOTE[o.emote](cx + g.fw + 44, g.headTop + 34)}</g>` : '';
    const tilt = E.tilt || 0;
    const headT = tilt ? ` transform="rotate(${tilt} ${cx} 300)"` : '';

    return `<svg class="portrait-svg ${o.cls || ''}" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}<g class="p-all"><g class="p-back"${headT}>${back}</g><g class="p-body">${body}</g><g class="p-head"${headT}>${face}<g class="p-eyes">${eyes}</g>${brows(ctx, E)}${mouths}<g class="p-front">${front}</g>${acc}${fx}</g></g>${em}</svg>`;
  };
})();
