/* Silver River — ambient particles drawn on a canvas layered over a scene. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MODES = {
    petals: { n: 26, make: (w, h) => ({ x: Math.random() * w, y: Math.random() * -h, s: 4 + Math.random() * 5, vx: 0.25 + Math.random() * 0.5, vy: 0.45 + Math.random() * 0.6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.05, ph: Math.random() * 6, c: Math.random() < 0.5 ? '#f7b8c9' : '#fde1e8' }) },
    leaves: { n: 18, make: (w, h) => ({ x: Math.random() * w, y: Math.random() * -h, s: 6 + Math.random() * 5, vx: 0.4 + Math.random() * 0.6, vy: 0.6 + Math.random() * 0.6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.06, ph: Math.random() * 6, c: ['#f0a04b', '#e5703f', '#f6c35a', '#d4553a'][Math.floor(Math.random() * 4)] }) },
    snow: { n: 60, make: (w, h) => ({ x: Math.random() * w, y: Math.random() * -h, s: 1.2 + Math.random() * 2.6, vx: (Math.random() - 0.3) * 0.3, vy: 0.3 + Math.random() * 0.6, ph: Math.random() * 6, c: '#ffffff' }) },
    fireflies: { n: 22, make: (w, h) => ({ x: Math.random() * w, y: h * 0.3 + Math.random() * h * 0.7, s: 1.5 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, ph: Math.random() * 6, c: '#fff3a6', glow: true }) },
    motes: { n: 16, make: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, s: 1 + Math.random() * 1.6, vx: 0.1 + Math.random() * 0.2, vy: -0.05 - Math.random() * 0.15, ph: Math.random() * 6, c: '#fffbe6', glow: true }) },
    lanterns: { n: 14, make: (w, h) => ({ x: Math.random() * w, y: h + Math.random() * h, s: 6 + Math.random() * 8, vx: (Math.random() - 0.5) * 0.15, vy: -0.25 - Math.random() * 0.35, ph: Math.random() * 6, c: '#ffb45a', lantern: true }) },
    stars: { n: 0, make: () => ({}) },
  };

  class FX {
    constructor(canvas) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.parts = [];
      this.bursts = [];
      this.mode = null;
      this.shooting = [];
      this.running = false;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      if (window.ResizeObserver) new ResizeObserver(this.resize).observe(canvas);
      window.addEventListener('resize', this.resize);
      this.resize();
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const d = Math.min(2, window.devicePixelRatio || 1);
      this.w = Math.max(1, r.width);
      this.h = Math.max(1, r.height);
      this.c.width = Math.round(this.w * d);
      this.c.height = Math.round(this.h * d);
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    setMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      const M = MODES[mode];
      this.parts = [];
      if (M) {
        const n = reduce() ? Math.ceil(M.n / 4) : M.n;
        for (let i = 0; i < n; i++) {
          const p = M.make(this.w, this.h);
          if (mode !== 'fireflies' && mode !== 'motes' && mode !== 'lanterns') p.y = Math.random() * this.h;
          this.parts.push(p);
        }
      }
      this.start();
    }
    burst(x, y, kind = 'spark', n = 16) {
      if (reduce()) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
        this.bursts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, kind, s: 3 + Math.random() * 4, c: kind === 'heart' ? '#ef6f8f' : kind === 'petal' ? '#f7b8c9' : '#f6d06b', r: Math.random() * 6 });
      }
      this.start();
    }
    start() {
      if (!this.running) {
        this.running = true;
        requestAnimationFrame(this.tick);
      }
    }
    tick(t) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      const M = MODES[this.mode];
      const still = reduce();
      for (const p of this.parts) {
        p.ph += 0.02;
        if (!still) {
          p.x += p.vx + Math.sin(p.ph) * 0.3;
          p.y += p.vy;
          if (p.r !== undefined) p.r += p.vr || 0;
        }
        if (p.y > h + 20 || p.x > w + 20 || p.x < -20 || p.y < -h - 40) {
          Object.assign(p, M.make(w, h));
          if (this.mode === 'lanterns') p.y = h + 20;
          else if (this.mode !== 'fireflies' && this.mode !== 'motes') p.y = -10;
          else p.x = Math.random() * w;
        }
        if (this.mode === 'fireflies' || this.mode === 'motes') {
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }
        this.draw(p);
      }
      if (this.mode === 'stars' && !still) {
        if (Math.random() < 0.012) this.shooting.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.35, life: 1 });
        this.shooting = this.shooting.filter((s) => (s.life -= 0.02) > 0);
        for (const s of this.shooting) {
          const len = 90;
          const x = s.x - (1 - s.life) * 260, y = s.y + (1 - s.life) * 120;
          const g = ctx.createLinearGradient(x, y, x + len, y - len * 0.46);
          g.addColorStop(0, `rgba(255,248,220,${s.life})`);
          g.addColorStop(1, 'rgba(255,248,220,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len, y - len * 0.46);
          ctx.stroke();
        }
      }
      this.bursts = this.bursts.filter((b) => (b.life -= 0.018) > 0);
      for (const b of this.bursts) {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.06;
        ctx.globalAlpha = b.life;
        if (b.kind === 'heart') this.heart(b.x, b.y, b.s * 1.4, b.c);
        else if (b.kind === 'petal') this.petal(b.x, b.y, b.s, b.r, b.c);
        else this.star(b.x, b.y, b.s, b.c);
        ctx.globalAlpha = 1;
      }
      const busy = this.parts.length || this.bursts.length || this.mode === 'stars';
      if (busy && !document.hidden) requestAnimationFrame(this.tick);
      else {
        this.running = false;
        if (busy) setTimeout(() => this.start(), 500);
      }
    }
    draw(p) {
      const { ctx } = this;
      if (this.mode === 'petals') this.petal(p.x, p.y, p.s, p.r, p.c);
      else if (this.mode === 'leaves') this.leaf(p.x, p.y, p.s, p.r, p.c);
      else if (p.lantern) {
        const fl = 0.8 + Math.sin(p.ph * 3) * 0.2;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
        g.addColorStop(0, `rgba(255,190,100,${0.45 * fl})`);
        g.addColorStop(1, 'rgba(255,190,100,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - p.s * 3, p.y - p.s * 3, p.s * 6, p.s * 6);
        ctx.fillStyle = '#ffcf7a';
        ctx.fillRect(p.x - p.s * 0.5, p.y - p.s * 0.7, p.s, p.s * 1.3);
      } else if (p.glow) {
        const a = 0.5 + Math.sin(p.ph * 2) * 0.5;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 5);
        g.addColorStop(0, `rgba(255,246,170,${0.8 * a})`);
        g.addColorStop(1, 'rgba(255,246,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    petal(x, y, s, r, c) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s);
      ctx.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s);
      ctx.fill();
      ctx.restore();
    }
    leaf(x, y, s, r, c) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.fillStyle = c;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        const b = a + Math.PI / 5;
        ctx.lineTo(Math.cos(b) * s * 0.45, Math.sin(b) * s * 0.45);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    star(x, y, s, c) {
      const { ctx } = this;
      ctx.fillStyle = c;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? s * 0.45 : s;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
    heart(x, y, s, c) {
      const { ctx } = this;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.5);
      ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.5, y - s, x, y - s * 0.4);
      ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.2, x, y + s * 0.5);
      ctx.fill();
    }
  }
  G.FX = FX;
})();
