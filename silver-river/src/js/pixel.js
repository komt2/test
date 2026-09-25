/* Silver River — tiny pixel-art engine.
   Sprites are authored as text grids; each character is a palette key ('.' is transparent).
   Palettes are merged (base + her look + outfit) and rendered sprites are cached per palette. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const PX = (G.PX = {});

  const parsed = new Map();
  const rendered = new Map();

  PX.parse = function (src) {
    if (parsed.has(src)) return parsed.get(src);
    const rows = src.replace(/^\n+|\s+$/g, '').split('\n').map((r) => r.replace(/^\s+/, '').replace(/\s+$/, ''));
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const px = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.push(rows[y][x] || '.');
    const sp = { w, h, px, src };
    parsed.set(src, sp);
    return sp;
  };

  function palKey(pal) {
    return Object.keys(pal).sort().map((k) => k + pal[k]).join('');
  }

  /** Render a sprite (or an array of layered sprites with offsets) to a canvas with a palette. */
  PX.render = function (src, pal, flip = false) {
    const sp = typeof src === 'string' ? PX.parse(src) : src;
    const key = sp.src + '|' + palKey(pal) + (flip ? '|f' : '');
    if (rendered.has(key)) return rendered.get(key);
    const c = document.createElement('canvas');
    c.width = sp.w;
    c.height = sp.h;
    const g = c.getContext('2d');
    const img = g.createImageData(sp.w, sp.h);
    for (let y = 0; y < sp.h; y++) {
      for (let x = 0; x < sp.w; x++) {
        const ch = sp.px[y * sp.w + (flip ? sp.w - 1 - x : x)];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        const [r, gg, b, a] = rgba(col);
        const i = (y * sp.w + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = gg;
        img.data[i + 2] = b;
        img.data[i + 3] = a;
      }
    }
    g.putImageData(img, 0, 0);
    rendered.set(key, c);
    if (rendered.size > 1500) rendered.delete(rendered.keys().next().value);
    return c;
  };

  const rgbaCache = new Map();
  function rgba(col) {
    if (rgbaCache.has(col)) return rgbaCache.get(col);
    let r = 0, g = 0, b = 0, a = 255;
    if (col[0] === '#') {
      let h = col.slice(1);
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16);
    }
    const out = [r, g, b, a];
    rgbaCache.set(col, out);
    return out;
  }
  PX.rgba = rgba;

  /** Compose layers [{src, x, y, flip}] into one text sprite (later layers overwrite). */
  PX.compose = function (w, h, layers) {
    const px = new Array(w * h).fill('.');
    layers.forEach((L) => {
      if (!L || !L.src) return;
      const sp = PX.parse(L.src);
      const ox = L.x || 0, oy = L.y || 0;
      for (let y = 0; y < sp.h; y++) {
        for (let x = 0; x < sp.w; x++) {
          const ch = sp.px[y * sp.w + (L.flip ? sp.w - 1 - x : x)];
          if (ch === '.' || ch === ' ') continue;
          const tx = ox + x, ty = oy + y;
          if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
          px[ty * w + tx] = ch;
        }
      }
    });
    const rows = [];
    for (let y = 0; y < h; y++) rows.push(px.slice(y * w, y * w + w).join(''));
    return rows.join('\n');
  };

  /** Draw text-sprite at integer coords. */
  PX.draw = function (g, src, pal, x, y, flip = false) {
    const c = PX.render(src, pal, flip);
    g.drawImage(c, Math.round(x), Math.round(y));
    return c;
  };

  // ---------- drawing helpers for backgrounds (all integer coordinates) ----------
  PX.rect = (g, x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  PX.dot = (g, x, y, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
  };
  PX.hline = (g, x0, x1, y, col) => PX.rect(g, Math.min(x0, x1), y, Math.abs(x1 - x0) + 1, 1, col);
  PX.vline = (g, x, y0, y1, col) => PX.rect(g, x, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, col);
  PX.line = (g, x0, y0, x1, y1, col) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    g.fillStyle = col;
    for (;;) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  PX.disc = (g, cx, cy, r, col) => {
    g.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  };
  PX.ellipse = (g, cx, cy, rx, ry, col) => {
    g.fillStyle = col;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5))));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  };
  // ordered 4x4 Bayer dithering between two colours; t in 0..1 is the share of colour b
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  PX.dither = (g, x, y, w, h, a, b, t) => {
    PX.rect(g, x, y, w, h, a);
    if (t <= 0) return;
    g.fillStyle = b;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (BAYER[((y + yy) & 3) * 4 + ((x + xx) & 3)] / 16 < t) g.fillRect(x + xx, y + yy, 1, 1);
    }
  };
  // vertical gradient through colour stops using dithered bands
  PX.gradient = (g, x, y, w, h, stops) => {
    const n = stops.length - 1;
    for (let yy = 0; yy < h; yy++) {
      const u = (yy / Math.max(1, h - 1)) * n;
      const i = Math.min(n - 1, Math.floor(u));
      const t = u - i;
      g.fillStyle = stops[i];
      g.fillRect(x, y + yy, w, 1);
      if (t > 0) {
        g.fillStyle = stops[i + 1];
        for (let xx = 0; xx < w; xx++) if (BAYER[((y + yy) & 3) * 4 + ((x + xx) & 3)] / 16 < t) g.fillRect(x + xx, y + yy, 1, 1);
      }
    }
  };
  // seeded random for stable scenery
  PX.rng = (seed) => {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  };
  PX.canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  };
})();
