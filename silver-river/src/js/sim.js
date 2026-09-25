/* Silver River — the simulation: game state, seasons, months, events and the event-script context. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const Sim = (G.Sim = {});
  const VERSION = 3;

  // ---------------------------------------------------------------- new game
  Sim.newGame = function (o) {
    const seed = o.seed || (Math.floor(Math.random() * 2147483000) + 1);
    U.setSeed(seed);
    const L = D.LENGTHS[o.length] || D.LENGTHS.standard;
    const P = D.PARENTS[o.background] || D.PARENTS.scholar;
    const mind = M.create(L.startAge, o.background);
    const base = L.startAge <= 10 ? 6 : L.startAge <= 13 ? 13 : 20;
    const stats = {};
    D.STAT_IDS.forEach((k) => (stats[k] = base + U.randInt(0, 6)));
    stats[P.stat] += 8;
    const t = mind.traits;
    stats.vigor += Math.max(0, Math.round(t.bold / 12));
    stats.wit += Math.max(0, Math.round(t.diligent / 12));
    stats.art += Math.max(0, Math.round(t.dreamy / 12));
    stats.heart += Math.max(0, Math.round(-t.fiery / 12));
    stats.grace += Math.max(0, Math.round(-t.playful / 14));
    stats.craft += Math.max(0, Math.round(t.playful / 14));
    const s = Object.assign(mind, {
      v: VERSION,
      seed,
      code: Sim.codeFor(seed, o),
      parent: { role: o.role || 'mom', address: o.address || (o.role === 'dad' ? 'Baba' : 'Mama'), bg: o.background || 'scholar' },
      name: o.name || 'Xing',
      look: o.look,
      style: o.look.style,
      length: o.length || 'standard',
      startAge: L.startAge,
      age: L.startAge,
      turn: 0,
      turns: L.years * 4,
      stats,
      stress: 12,
      gold: P.gold,
      focus: 'balanced',
      parenting: { warmth: 0, control: 0 },
      flags: {},
      counts: {},
      friends: { mei: 15, tao: 8, prince: 0, wanyin: 0 },
      outfit: 'everyday',
      wardrobe: ['everyday'],
      earned: 0,
      star: 0,
      journeys: 0,
      log: [],
      seen: {},
      heights: [],
      album: [],
      phase: 'intro',
      rngSeed: U.getSeed(),
    });
    s.lenMult = Math.pow(20 / s.turns, 0.9);
    return s;
  };

  Sim.codeFor = function (seed, o) {
    const n = (seed >>> 0).toString(36).toUpperCase();
    return 'SR-' + n;
  };
  Sim.seedFromCode = function (code) {
    const m = String(code || '').trim().toUpperCase().match(/^SR-([0-9A-Z]+)$/);
    if (!m) return null;
    const n = parseInt(m[1], 36);
    return n > 0 ? n : null;
  };

  // ---------------------------------------------------------------- time
  Sim.season = (s) => D.SEASONS[s.turn % 4];
  Sim.year = (s) => Math.floor(s.turn / 4) + 1;
  Sim.isLastSeason = (s) => s.turn === s.turns - 1;
  Sim.tod = (s) => 'day';

  // ---------------------------------------------------------------- activities available
  Sim.available = function (s) {
    return D.ACTS.filter((a) => Sim.canDo(s, a).ok).map((a) => a.id);
  };
  Sim.canDo = function (s, a) {
    if (a.minAge && s.age < a.minAge) return { ok: false, why: 'From age ' + a.minAge };
    if (a.needFlag && !s.flags[a.needFlag]) return { ok: false, why: a.reqText };
    if (a.needStat && s.stats[a.needStat[0]] < a.needStat[1]) return { ok: false, why: a.reqText };
    return { ok: true };
  };
  Sim.cost = function (s, id) {
    const a = D.ACT[id];
    let c = a.cost || 0;
    const P = D.PARENTS[s.parent.bg];
    if (c > 0 && P.discount && P.discount.includes(id)) c = Math.round(c * 0.6);
    if (c < 0) {
      let pay = -c;
      if (P.payBonus) pay *= 1 + P.payBonus;
      if (id === 'tea' && P.payTea) pay *= 1 + P.payTea;
      c = -Math.round(pay);
    }
    return c;
  };
  Sim.planCost = (s, plan) => plan.reduce((t, id) => t + (id ? Math.max(0, Sim.cost(s, id)) : 0), 0);
  Sim.planPay = (s, plan) => plan.reduce((t, id) => t + (id && id !== 'free' ? Math.max(0, -Sim.cost(s, id)) : 0), 0);
  // lessons are paid in the month they happen, so work earlier in the season can pay for lessons later on
  Sim.shortfall = function (s, plan) {
    let g = s.gold, short = 0;
    for (const id of plan) {
      if (!id || id === 'free') continue;
      g -= Sim.cost(s, id);
      if (g < 0) short = Math.max(short, -g);
    }
    return short;
  };

  // ---------------------------------------------------------------- one month of an activity
  Sim.doMonth = function (s, id, opts = {}) {
    let A = D.ACT[id];
    const res = { act: id, gains: {}, stress: 0, gold: 0, outcome: 'good', text: '', chosen: !!opts.chosen, forced: !!opts.forced };
    // her choice: she decides what to do
    if (id === 'free') {
      const pick = M.chooseFree(s, Sim.available(s));
      res.free = true;
      if (pick.kind === 'act') {
        A = D.ACT[pick.id];
        res.act = pick.id;
        res.chosen = true;
      } else {
        const h = pick.hobby;
        res.hobby = h.id;
        res.text = s.name + ' ' + h.text;
        Object.entries(h.gain).forEach(([k, v]) => (res.gains[k] = Math.max(1, Math.round(v * s.lenMult))));
        if (h.practice) {
          const top = Object.keys(s.stats).sort((a, b) => s.stats[b] - s.stats[a])[0];
          res.gains[top] = Math.round(3 * s.lenMult);
        }
        res.stress = -12;
        res.gold = -10;
        apply(s, res);
        M.need(s, 'freedom', 14);
        M.need(s, 'fun', 10);
        return res;
      }
    }
    const a = s.aff[A.id] || 0;
    // exhaustion can overrule the plan
    if (s.stress >= 88 && A.stress > 0 && U.chance(0.55)) {
      res.collapsed = true;
      res.act = 'rest';
      res.text = s.name + ' was too exhausted to go. She slept through most of the month.';
      res.stress = -12;
      apply(s, res);
      return res;
    }
    const main = Object.keys(A.gain).sort((x, y) => A.gain[y] - A.gain[x])[0];
    const skill = main ? s.stats[main] : 50;
    let pGreat = 0.14 + a * 0.07 + skill / 400 + Math.max(0, s.traits.diligent) / 600 + (s.esteem - 50) / 500;
    let pPoor = 0.14 - a * 0.05 + Math.max(0, s.stress - 40) / 220 - skill / 900;
    if (res.forced) pPoor += 0.08;
    const r = U.rand();
    res.outcome = r < pGreat ? 'great' : r < pGreat + Math.max(0.03, pPoor) ? 'poor' : 'good';
    const outMult = { great: 1.5, good: 1, poor: 0.45 }[res.outcome];
    const affMult = U.clamp(1 + a * 0.18, 0.6, 1.4);
    const stressMult = s.stress < 50 ? 1 : s.stress < 75 ? 0.85 : 0.65;
    const dil = 1 + s.traits.diligent / 400;
    Object.entries(A.gain).forEach(([k, v]) => {
      const g = v * s.lenMult * affMult * stressMult * outMult * dil * (res.forced ? 0.85 : 1);
      res.gains[k] = Math.max(res.outcome === 'poor' ? 0 : 1, Math.round(g + U.randf(-0.3, 0.3)));
    });
    let st = A.stress;
    if (st > 0) st *= a < -0.4 ? 1.3 : a > 1 ? 0.7 : 1;
    if (res.outcome === 'poor' && st > 0) st += 2;
    if (res.chosen) st -= 4;
    res.stress = Math.round(st);
    const cost = Sim.cost(s, A.id);
    res.gold = -cost;
    if (cost < 0 && res.outcome === 'great') res.gold = Math.round(res.gold * 1.3);
    if (A.star) res.star = A.star;
    // lines
    const lines = (A.lines && A.lines[res.outcome]) || [];
    if (!res.text) res.text = lines.length ? U.pick(lines) : '';
    // taste drifts with experience
    const first = !s.tried[A.id];
    s.tried[A.id] = (s.tried[A.id] || 0) + 1;
    res.first = first;
    let da = res.outcome === 'great' ? 0.08 : res.outcome === 'poor' ? -0.05 : 0.01;
    if (res.forced) da -= 0.15;
    if (s.stress > 75) da -= 0.05;
    s.aff[A.id] = U.clamp(a + da, -2, 2);
    // she now knows (and shows) how she feels about it
    res.learned = M.learn(s, 'like', A.id);
    // traits bend a little
    Object.entries(A.trait || {}).forEach(([k, v]) => {
      if (U.chance(0.6)) s.traits[k] = U.clamp(s.traits[k] + v, -100, 100);
    });
    if (A.friend) s.friends[A.friend] = U.clamp(s.friends[A.friend] + 3, 0, 100);
    s.counts[A.id] = (s.counts[A.id] || 0) + 1;
    // needs
    if (A.cat === 'leisure') M.need(s, 'fun', A.id === 'play' ? 16 : 8);
    else if (a > 0.5) M.need(s, 'fun', 4);
    else if (a < -0.5) M.need(s, 'fun', -5);
    if (A.id === 'play') M.need(s, 'friends', 18);
    if (res.outcome === 'great') M.need(s, 'pride', 9), M.esteem(s, 1);
    if (res.outcome === 'poor') M.need(s, 'pride', -4);
    if (res.chosen) M.need(s, 'freedom', 10);
    if (res.forced) M.need(s, 'freedom', -8);
    if (A.id === 'journey') s.journeys++;
    apply(s, res);
    return res;
  };

  function apply(s, res) {
    Object.entries(res.gains).forEach(([k, v]) => (s.stats[k] = U.clamp(s.stats[k] + v, 0, 100)));
    s.stress = U.clamp(s.stress + res.stress, 0, 100);
    s.gold = Math.max(0, s.gold + res.gold);
    if (res.gold > 0) s.earned += res.gold;
    if (res.star) s.star += res.star;
  }
  Sim.apply = apply;

  // ---------------------------------------------------------------- the end of a season
  Sim.endSeason = function (s, log) {
    const P = D.PARENTS[s.parent.bg];
    let income = P.income;
    if (s.focus === 'work') income += 90;
    if (s.focus === 'family') income -= 40;
    s.gold += income;
    log.income = income;
    // natural recovery, and what tiredness costs
    s.stress = U.clamp(s.stress - (2 + (P.restBonus && log.months.some((m) => m.act === 'rest') ? P.restBonus : 0)), 0, 100);
    if (s.focus === 'work') {
      M.need(s, 'love', -8);
      M.bond(s, -2);
      log.diary.push(M.pick(s, { _: ['{P} worked late every night this season. The house is so quiet.'], sassy: ['{P} was never home. Not that I noticed. (I noticed.)'] }));
    }
    if (s.focus === 'family') {
      M.need(s, 'love', 8);
      M.bond(s, 2);
    }
    if (log.wishMet) {
      M.bond(s, 2);
      M.need(s, 'love', 4);
      s.stress = U.clamp(s.stress - 4, 0, 100);
    }
    if (s.stress >= 70) M.bond(s, -2);
    if (log.forced) M.bond(s, -2);
    M.seasonDecay(s);
    // low needs cost bond and esteem; adolescence pulls a little distance
    if (s.needs.love < 40) M.bond(s, -2);
    if (s.needs.freedom < 30 && s.age >= 13) M.bond(s, -2);
    if (s.age >= 14 && s.age <= 16 && s.trust < 65) M.bond(s, -1);
    if (s.needs.pride < 20) M.esteem(s, -2);
    if (s.needs.freedom < 15 && s.age >= 13) s.flags.rebellious = (s.flags.rebellious || 0) + 1;
    // promises that came due
    s.promises.forEach((p) => {
      if (!p.done && p.due <= s.turn) {
        p.done = true;
        if (!p.kept) {
          M.trust(s, -12);
          M.bond(s, -6);
          M.feel(s, 'hurt', 60);
          M.remember(s, { id: 'broken_' + p.id, text: 'You promised ' + p.text + ', and then you didn\'t.', letter: 'I remember when you promised ' + p.text + ' and forgot. I cried the whole night. I forgave you a long time ago, but I still remember.', weight: 7, val: -1, tags: ['parent', 'promise'] });
          log.diary.push(M.pick(s, { _: ['{P} promised ' + p.text + '. {P} forgot.'], sassy: ['{P} promised ' + p.text + '. Ha. Lesson learned.'] }));
        } else {
          M.trust(s, 6);
        }
      }
    });
    M.clampNeeds(s);
    M.coolDown(s);
    log.diaryText = M.diary(s, log);
    s.log.push({ turn: s.turn, months: log.months.map((m) => ({ act: m.act, outcome: m.outcome })), income });
    if (s.log.length > 12) s.log.shift();
  };

  // diary privacy: as a teenager she keeps it to herself unless she trusts you
  Sim.diaryOpen = function (s) {
    if (s.age < 14) return { open: true };
    if (s.flags.diaryShared) return { open: true, shared: true };
    if (s.trust >= 70 && s.bond >= 60) return { open: true, shared: true };
    return { open: false };
  };

  // ---------------------------------------------------------------- events
  G.Events = G.Events || [];
  Sim.pickEvents = function (s, phase, n = 1) {
    const out = [];
    const pool = G.Events.filter((e) => (e.phase || 'mid') === phase && !(e.once !== false && s.seen[e.id]) && safeWhen(e, s));
    // priority events always come first
    pool.filter((e) => e.priority).sort((a, b) => b.priority - a.priority).forEach((e) => {
      if (out.length < n) out.push(e);
    });
    const rest = pool.filter((e) => !e.priority);
    while (out.length < n && rest.length) {
      const e = U.weighted(rest, (x) => (typeof x.weight === 'function' ? x.weight(s) : x.weight || 1));
      if (!e) break;
      out.push(e);
      rest.splice(rest.indexOf(e), 1);
    }
    return out;
  };
  function safeWhen(e, s) {
    try {
      return !e.when || !!e.when(s);
    } catch (err) {
      return false;
    }
  }

  // The context an event script receives. `io` is the presentation layer (UI or a test stub).
  Sim.ctx = function (s, io, extra = {}) {
    const g = {
      s,
      io,
      get name() { return s.name; },
      get P() { return M.addr(s); },
      get Pc() { return M.addr(s, true); },
      get age() { return s.age; },
      get season() { return Sim.season(s); },
      get fav() { return s.fav; },
      v: (bank, vars) => M.pick(s, bank, vars),
      fill: (t, vars) => M.fill(s, t, vars),
      voice: () => M.voice(s),
      her: (expr, text, vars) => io.say('her', M.pick(s, text, vars), { expr }),
      say: (who, text, opts) => io.say(who, M.pick(s, text), opts || {}),
      nar: (text, vars) => io.say(null, M.pick(s, text, vars), {}),
      choose: (opts) => io.choose(opts.filter(Boolean).map((o) => (typeof o === 'string' ? { text: o } : o))),
      scene: (name, o) => io.scene(name, Object.assign({ season: Sim.season(s) }, o || {})),
      anim: (name) => io.anim && io.anim(name),
      npc: (id, where) => io.npc && io.npc(id, where),
      clearNpcs: () => io.clearNpcs && io.clearNpcs(),
      emote: (name) => io.emote && io.emote(name),
      fx: (name, arg) => (io.fx ? io.fx(name, arg) : Promise.resolve()),
      npcEmote: (id, name) => io.npcEmote && io.npcEmote(id, name),
      wait: (ms) => (io.wait ? io.wait(ms) : Promise.resolve()),
      input: (label, def) => (io.input ? io.input(label, def) : Promise.resolve(def)),
      minigame: (kind, opts) => (io.minigame ? io.minigame(kind, opts) : Promise.resolve({ win: U.chance(0.5), score: 0, skipped: true })),
      stat(k, d) {
        s.stats[k] = U.clamp(s.stats[k] + d, 0, 100);
        io.toast && io.toast({ kind: 'stat', stat: k, d });
      },
      stress(d) {
        s.stress = U.clamp(s.stress + d, 0, 100);
        io.toast && io.toast({ kind: 'stress', d });
      },
      bond(d) {
        const eff = M.bond(s, d);
        io.toast && io.toast({ kind: 'bond', d: eff });
      },
      trust: (d) => M.trust(s, d),
      esteem: (d) => M.esteem(s, d),
      need: (k, d) => M.need(s, k, d),
      feel: (k, a) => M.feel(s, k, a),
      gold(d) {
        // the family scrapes by: a cost never takes you below zero
        const before = s.gold;
        s.gold = Math.max(0, s.gold + d);
        const eff = s.gold - before;
        if (eff) io.toast && io.toast({ kind: 'gold', d: eff });
      },
      trait: (k, d) => (s.traits[k] = U.clamp(s.traits[k] + d, -100, 100)),
      parent: (w, c) => M.parent(s, w, c),
      flag(k, v) {
        if (v === undefined) return s.flags[k];
        s.flags[k] = v;
        return v;
      },
      friend(id, d) {
        s.friends[id] = U.clamp((s.friends[id] || 0) + d, 0, 100);
      },
      remember(m) {
        M.remember(s, m);
        if (m.photo) {
          s.album.push({ id: m.id, title: m.title || '', caption: m.caption || m.text, scene: m.photo.scene || 'home', tod: m.photo.tod || 'day', season: Sim.season(s), anim: m.photo.anim || 'idle', expr: m.photo.expr || 'happy', age: s.age, outfit: s.outfit, npcs: m.photo.npcs || [] });
          io.photo && io.photo(s.album[s.album.length - 1]);
        }
      },
      learn(kind, key, text) {
        const isNew = M.learn(s, kind, key, text);
        if (isNew && io.toast) io.toast({ kind: 'learn', text: text || key });
        return isNew;
      },
      knows: (kind, key) => M.knows(s, kind, key),
      diary: (line) => extra.log && extra.log.diary.push(line),
      promise(p) {
        s.promises.push(Object.assign({ kept: false, done: false }, p));
      },
      keep(id) {
        const p = s.promises.find((x) => x.id === id);
        if (p) p.kept = true;
      },
      check(stat, target, spread = 12) {
        const v = typeof stat === 'number' ? stat : s.stats[stat];
        return U.rand() < U.sigmoid((v - target) / spread);
      },
      chance: (p) => U.chance(p),
      pick: (arr) => U.pick(arr),
    };
    return g;
  };

  // ---------------------------------------------------------------- saving
  Sim.save = function (s) {
    s.rngSeed = U.getSeed();
    return U.store.set('save', s);
  };
  Sim.load = function () {
    const s = U.store.get('save', null);
    if (!s || s.v !== VERSION) return null;
    U.setSeed(s.rngSeed || s.seed);
    return s;
  };
  Sim.clearSave = () => U.store.del('save');
  Sim.profile = function () {
    const p = U.store.get('profile', null) || { endings: {}, register: [], seen: {}, achievements: {}, settings: { music: 0.5, sfx: 0.7, text: 1, skipSeen: true } };
    p.endings = p.endings || {};
    p.register = p.register || [];
    p.seen = p.seen || {};
    p.achievements = p.achievements || {};
    p.settings = Object.assign({ music: 0.5, sfx: 0.7, text: 1, skipSeen: true }, p.settings || {});
    return p;
  };
  Sim.saveProfile = (p) => U.store.set('profile', p);
})();
