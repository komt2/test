/* Silver River — procedural music and sound. A plucked-zither voice (Karplus-Strong) plays pentatonic
   phrases over a soft drone; each season uses a different Chinese pentatonic mode. Starts only after a click. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const Au = (G.Audio = {});
  let ctx = null, master = null, musicBus = null, sfxBus = null, verb = null;
  let playing = false, timer = null, mood = 'spring';
  const settings = { music: 0.5, sfx: 0.7 };
  const cache = new Map();

  // gong-mode pentatonic degrees (semitones): do re mi sol la
  const PENTA = [0, 2, 4, 7, 9];
  const MODES = {
    spring: { root: 62, deg: 0, tempo: 76 },
    summer: { root: 67, deg: 0, tempo: 84 },
    autumn: { root: 69, deg: 4, tempo: 70 },
    winter: { root: 64, deg: 1, tempo: 64 },
    night: { root: 60, deg: 4, tempo: 58 },
    title: { root: 64, deg: 4, tempo: 60 },
    festival: { root: 67, deg: 0, tempo: 96 },
    sad: { root: 57, deg: 4, tempo: 54 },
  };

  function mtof(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.gain.value = settings.music * 0.5;
    sfxBus.gain.value = settings.sfx * 0.6;
    // simple generated reverb
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    verb.connect(wet).connect(master);
    musicBus.connect(master);
    musicBus.connect(verb);
    sfxBus.connect(master);
    sfxBus.connect(verb);
    return true;
  }

  // Karplus-Strong plucked string rendered once per pitch and cached
  function pluckBuffer(freq) {
    const key = Math.round(freq * 10);
    if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate;
    const dur = 2.4;
    const buf = ctx.createBuffer(1, Math.floor(sr * dur), sr);
    const out = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0, prev = 0;
    for (let i = 0; i < out.length; i++) {
      const cur = ring[idx];
      const next = 0.5 * (cur + prev) * 0.996;
      prev = cur;
      ring[idx] = next;
      out[i] = cur * (i < 40 ? i / 40 : 1);
      idx = (idx + 1) % N;
    }
    cache.set(key, buf);
    return buf;
  }

  function pluck(midi, when, vel = 0.5, bus = musicBus, bend = 0) {
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(mtof(midi));
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 2.3);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    if (bend) {
      src.playbackRate.setValueAtTime(1, when + 0.25);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, bend / 12), when + 0.55);
    }
    src.connect(lp).connect(g).connect(bus);
    src.start(when);
    src.stop(when + 2.4);
  }

  // breathy bamboo-flute-like tone
  function flute(midi, when, dur, vel = 0.12) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(midi);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vg = ctx.createGain();
    vg.gain.value = mtof(midi) * 0.006;
    vib.connect(vg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vel, when + 0.18);
    g.gain.setValueAtTime(vel, when + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(musicBus);
    o.start(when);
    vib.start(when);
    o.stop(when + dur + 0.05);
    vib.stop(when + dur + 0.05);
  }

  function drone(midi, when, dur) {
    [0, 7].forEach((iv, k) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(midi - 24 + iv);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(k ? 0.018 : 0.03, when + 1.5);
      g.gain.linearRampToValueAtTime(0.0001, when + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      o.connect(lp).connect(g).connect(musicBus);
      o.start(when);
      o.stop(when + dur + 0.1);
    });
  }

  function scaleNote(M, step) {
    // step counts pentatonic degrees from the mode's starting degree
    const s = step + M.deg;
    const oct = Math.floor(s / 5);
    const d = ((s % 5) + 5) % 5;
    return M.root + oct * 12 + PENTA[d] - PENTA[M.deg];
  }

  // one 8-bar phrase: stepwise melody on the zither, occasional flute answer
  function phrase(t0) {
    const M = MODES[mood] || MODES.spring;
    const beat = 60 / M.tempo;
    let step = 0;
    const bars = 8;
    drone(scaleNote(M, 0), t0, bars * 3 * beat + 1);
    for (let b = 0; b < bars; b++) {
      const bt = t0 + b * 3 * beat;
      // bass pluck
      pluck(scaleNote(M, b % 4 === 3 ? 3 : 0) - 12, bt, 0.28);
      const pattern = [[0, 1], [1, 0.5], [1.5, 0.5], [2, 1]];
      const rest = Math.random() < 0.25;
      pattern.forEach(([at], i) => {
        if (rest && i > 1) return;
        const move = [-1, 1, 1, -2, 2, 0][Math.floor(Math.random() * 6)];
        step = Math.max(-2, Math.min(7, step + move));
        const cadence = b === bars - 1 && i === pattern.length - 1;
        const note = cadence ? scaleNote(M, 0) : scaleNote(M, step);
        pluck(note, bt + at * beat, 0.22 + Math.random() * 0.1, musicBus, Math.random() < 0.08 ? 2 : 0);
      });
      if (b % 4 === 1 && Math.random() < 0.6) flute(scaleNote(M, step + 5), bt + beat, beat * 3.5, 0.05);
    }
    return bars * 3 * beat;
  }

  function loop() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime + 0.1;
    const dur = phrase(now);
    timer = setTimeout(loop, (dur + (1 + Math.random() * 2)) * 1000);
  }

  Au.start = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return;
    playing = true;
    loop();
  };
  Au.stop = function () {
    playing = false;
    clearTimeout(timer);
  };
  Au.setMood = function (m) {
    mood = m;
  };
  Au.setVolume = function (kind, v) {
    settings[kind] = v;
    if (!ctx) return;
    if (kind === 'music') musicBus.gain.value = v * 0.5;
    else sfxBus.gain.value = v * 0.6;
  };
  Au.unlocked = () => !!ctx && ctx.state === 'running';

  // a single zither note (used by the recital mini-game)
  Au.note = function (midi) {
    if (!ctx || ctx.state !== 'running') return;
    pluck(midi, ctx.currentTime + 0.01, 0.34, sfxBus);
  };
  let lastBlip = 0;
  Au.blip = function () {
    if (!ctx || ctx.state !== 'running' || settings.sfx <= 0) return;
    const now = ctx.currentTime;
    if (now - lastBlip < 0.07) return;
    lastBlip = now;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 520 + Math.random() * 120;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.018, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.06);
  };

  // ---------- sound effects ----------
  Au.sfx = function (kind) {
    if (!ctx || ctx.state !== 'running' || settings.sfx <= 0) return;
    const t = ctx.currentTime + 0.01;
    const M = MODES.spring;
    switch (kind) {
      case 'tap':
        pluck(M.root + 12, t, 0.18, sfxBus);
        break;
      case 'select':
        pluck(M.root + 7, t, 0.22, sfxBus);
        pluck(M.root + 12, t + 0.06, 0.18, sfxBus);
        break;
      case 'confirm':
        [0, 4, 7, 12].forEach((d, i) => pluck(M.root + d, t + i * 0.07, 0.24, sfxBus));
        break;
      case 'coin':
        pluck(M.root + 24, t, 0.2, sfxBus);
        pluck(M.root + 28, t + 0.08, 0.2, sfxBus);
        break;
      case 'up':
        [0, 2, 4, 7, 9].forEach((d, i) => pluck(M.root + 12 + d, t + i * 0.045, 0.16, sfxBus));
        break;
      case 'down':
        [7, 4, 0].forEach((d, i) => pluck(M.root + d - 5, t + i * 0.09, 0.2, sfxBus));
        break;
      case 'bell':
        pluck(M.root + 19, t, 0.3, sfxBus);
        pluck(M.root + 31, t, 0.1, sfxBus);
        break;
      case 'heart':
        pluck(M.root + 16, t, 0.22, sfxBus);
        pluck(M.root + 19, t + 0.12, 0.22, sfxBus);
        break;
      case 'page':
        pluck(M.root + 2, t, 0.12, sfxBus);
        break;
    }
  };
})();
