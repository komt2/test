/* Silver River — shared helpers. Every module hangs off window.SilverRiver (G). */
(function () {
  'use strict';
  const G = (window.SilverRiver = window.SilverRiver || {});
  const U = (G.U = {});

  U.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.sigmoid = (x) => 1 / (1 + Math.exp(-x));
  U.f = (n) => (Math.round(n * 10) / 10).toString();

  // ---------- seeded randomness (game logic only; visuals use Math.random) ----------
  let seed = 1;
  U.setSeed = (s) => { seed = (s >>> 0) || 1; };
  U.getSeed = () => seed;
  U.rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  U.chance = (p) => U.rand() < p;
  U.randInt = (a, b) => a + Math.floor(U.rand() * (b - a + 1));
  U.randf = (a, b) => a + U.rand() * (b - a);
  U.pick = (arr) => arr[Math.floor(U.rand() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(U.rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.weighted = (items, wfn) => {
    let tot = 0;
    const ws = items.map((it) => {
      const w = Math.max(0, wfn(it) || 0);
      tot += w;
      return w;
    });
    if (tot <= 0) return null;
    let r = U.rand() * tot;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  // ---------- colour ----------
  U.hex2rgb = (h) => {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgb2hex = (r, g, b) =>
    '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };
  U.hsl2rgb = (h, s, l) => {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
  };
  // shift lightness / saturation / hue of a hex colour
  U.tone = (hex, dl = 0, ds = 0, dh = 0) => {
    const [h, s, l] = U.rgb2hsl(...U.hex2rgb(hex));
    const rgb = U.hsl2rgb(h + dh, U.clamp(s + ds, 0, 1), U.clamp(l + dl, 0.04, 0.98));
    return U.rgb2hex(...rgb);
  };
  U.mix = (a, b, t) => {
    const x = U.hex2rgb(a), y = U.hex2rgb(b);
    return U.rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  };
  U.lum = (hex) => U.rgb2hsl(...U.hex2rgb(hex))[2];

  // ---------- text ----------
  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  U.list = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);

  // ---------- storage (browser-local, never required) ----------
  const NS = 'silverriver.v1.';
  U.store = {
    get(k, d) {
      try {
        const v = window.localStorage.getItem(NS + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(NS + k, JSON.stringify(v));
        return true;
      } catch (e) {
        return false;
      }
    },
    del(k) {
      try {
        window.localStorage.removeItem(NS + k);
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  U.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  U.deepCopy = (o) => JSON.parse(JSON.stringify(o));
})();
