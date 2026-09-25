/* Silver River — the game flow: title, setup, seasons, courtyard life, endings, saving. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const Sim = G.Sim;
  const UI = G.UI;
  const T = G.Talk;
  const E = G.Endings;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = U.esc;
  const icon = (n) => G.icon(n);
  const App = (G.App = {});
  let s = null;
  let profile = Sim.profile();

  function show(id) {
    ['title', 'setup', 'game'].forEach((x) => ($('#' + x).hidden = x !== id));
    App.screen = id;
  }

  const io = {
    say: (w, t, o) => UI.say(w, t, o),
    choose: (o) => UI.choose(o),
    input: (l, d) => UI.input(l, d),
    freeText: (l) => UI.freeText(l),
    thinking: (on) => UI.thinking(on),
    scene: (n, o) => UI.scene(n, o),
    npc: (id, w) => UI.npc(id, w),
    clearNpcs: () => UI.clearNpcs(),
    emote: (n) => UI.herActor && UI.stage.emote(UI.herActor, n),
    npcEmote: (id, n) => UI.npcActors[id] && UI.stage.emote(UI.npcActors[id], n, 2.6),
    anim: (n) => UI.herAnim(n),
    herAnim: (n) => UI.herAnim(n),
    herAppear: async (anim) => {
      UI.placeHer(anim);
      G.Audio.sfx('bell');
    },
    refreshHer: () => UI.refreshHer(),
    toast: (t) => UI.toast(t),
    photo: (p) => UI.photo(p),
    wait: (ms) => U.wait(ms),
    minigame: (k, o) => App.minigame(k, o),
    fx: async (name, arg) => {
      const st = UI.stage;
      if (name !== 'ascend') return st.fx(name, arg);
      // she climbs the second bridge, fading into the sky
      const her = UI.herActor;
      if (!her) return;
      const { arch, down } = st.bridgePath();
      const pts = [[190, 162]].concat(down.slice(0, -1).reverse().map(([x, y]) => [x, y + 1]), arch.slice(12).reverse().map(([x, y]) => [x, y + 1]));
      her.speed = 0.55;
      await st.followPath(her, pts, (u) => (her.alpha = 1 - u * 0.9));
      her.alpha = 0;
    },
  };
  const ctx = (log) => Sim.ctx(s, io, { log });

  App.minigame = function (kind, opts) {
    const root = $('#minigame');
    if (!G.Minigames[kind]) return Promise.resolve({ skipped: true });
    return G.Minigames[kind](root, opts);
  };

  // ================================================================ boot
  App.start = function (hot) {
    UI.init();
    applySettings();
    G.LLM.init();
    bindGlobal();
    if (hot && hot.s) {
      s = hot.s;
      UI.state = s;
      U.setSeed(s.rngSeed || s.seed);
      enterGame();
      return;
    }
    title();
  };

  function applySettings() {
    const st = profile.settings;
    UI.settings.text = st.text;
    UI.settings.skipSeen = st.skipSeen;
    G.Audio.setVolume('music', st.music);
    G.Audio.setVolume('sfx', st.sfx);
  }

  function bindGlobal() {
    // first interaction unlocks audio
    const unlock = () => {
      G.Audio.start();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    $('#hud').addEventListener('click', (e) => {
      const b = e.target.closest('[data-hud]');
      if (!b || !s) return;
      G.Audio.sfx('page');
      const k = b.dataset.hud;
      if (k === 'her') UI.profile(s);
      if (k === 'diary') UI.diaryBook(s);
      if (k === 'album') UI.album(s);
      if (k === 'menu') gameMenu();
    });
    UI.onActorClick = (a) => clickActor(a);
    try {
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => (s ? { s } : {}));
    } catch (e) {
      /* hot reload unavailable */
    }
  }

  // ================================================================ title
  let titleStage = null;
  function title() {
    show('title');
    G.Audio.setMood('title');
    const c = $('#title-canvas');
    if (!titleStage) {
      titleStage = new G.World.Stage(c);
      titleStage.set('night', { season: 'summer', tod: 'night', weather: 'fireflies', shooting: true });
      titleStage.start();
    }
    const save = Sim.load();
    $('#btn-continue').hidden = !save;
    $('#btn-continue').onclick = () => {
      s = Sim.load();
      if (!s) return;
      UI.state = s;
      G.Audio.sfx('confirm');
      enterGame();
    };
    $('#btn-new').onclick = () => {
      G.Audio.sfx('confirm');
      setup();
    };
    $('#btn-register').onclick = () => register();
    $('#btn-settings').onclick = () => settings();
    const n = profile.register.length;
    $('#title-note').innerHTML = n ? `You have raised <b>${n}</b> ${n === 1 ? 'daughter' : 'daughters'}. ${Object.keys(profile.endings).length} of ${E.ALL.length} endings found.` : 'A short, cozy life-raising game. Every daughter is different. <b>Tip:</b> tap anywhere to turn on the music.';
  }

  // ================================================================ setup wizard
  const SETUP = { step: 0, role: 'mom', address: 'Mama', background: 'scholar', length: 'standard', look: { hair: 'gold', eyes: 'blossom', skin: 'fair', style: 'wavy' }, code: '' };
  function setup() {
    show('setup');
    SETUP.step = 0;
    renderSetup();
  }
  function renderSetup() {
    const st = SETUP;
    const root = $('#setup-card');
    const steps = `<div class="steps">${[0, 1, 2].map((i) => `<span class="${i <= st.step ? 'on' : ''}"></span>`).join('')}</div>`;
    let body = '';
    if (st.step === 0) {
      const roles = [['mom', 'Mother', 'You will be her mother.'], ['dad', 'Father', 'You will be her father.']];
      body = `<div class="setup-head"><h2>Who are you?</h2>${steps}</div>
        <div class="row">${roles.map(([id, nm, d]) => `<button class="opt" type="button" data-role="${id}" aria-pressed="${st.role === id}" style="flex:1;min-width:180px"><b>${nm}</b><small>${d}</small></button>`).join('')}</div>
        <div class="row"><span class="label">She calls you</span>${D.ADDRESS[st.role].slice(0, 3).map((a) => `<button class="opt" type="button" data-addr="${a}" aria-pressed="${st.address === a}" style="padding:6px 12px"><b>${a}</b></button>`).join('')}</div>
        <p class="label" style="margin:4px 0 -4px">Your life before her</p>
        <div class="setup-grid">${Object.entries(D.PARENTS).map(([id, p]) => `<button class="opt" type="button" data-bg="${id}" aria-pressed="${st.background === id}"><b>${p.name}</b><small>${esc(p.blurb)}</small><span class="perk">${esc(p.perk)}</span></button>`).join('')}</div>`;
    } else if (st.step === 1) {
      const sw = (kind, table, colorOf) => Object.entries(table).map(([id, v]) => `<button class="swatch" type="button" title="${esc(v.name || id)}" aria-label="${esc(v.name || id)}" data-${kind}="${id}" aria-pressed="${st.look[kind] === id}" style="background:${colorOf(v, id)}"></button>`).join('');
      body = `<div class="setup-head"><h2>The girl in the starlight</h2>${steps}</div>
        <div class="look-layout">
          <div class="look-preview"><canvas id="lp-port" width="64" height="64" style="width:192px;height:192px"></canvas><canvas id="lp-sprite" width="16" height="32" style="width:64px;height:128px"></canvas></div>
          <div class="look-controls">
            <div class="row"><span class="label">Hair</span>${sw('hair', G.Portrait.HAIR, (v) => v[3])}</div>
            <div class="row"><span class="label">Eyes</span>${sw('eyes', G.Portrait.EYES, (v) => v[1])}</div>
            <div class="row"><span class="label">Skin</span>${sw('skin', G.Portrait.SKIN, (v) => v[4])}</div>
            <div class="row"><span class="label">Hairstyle</span>${['wavy', 'straight', 'buns', 'ponytail', 'braid', 'updo'].map((x) => `<button class="opt" type="button" data-style="${x}" aria-pressed="${st.look.style === x}" style="padding:4px 10px"><b style="font-size:.85rem">${{ wavy: 'Long waves', straight: 'Straight', buns: 'Twin buns', ponytail: 'Ponytail', braid: 'Braid', updo: 'Updo' }[x]}</b></button>`).join('')}</div>
            <div class="row"><button class="btn btn-ghost" type="button" id="look-random">${icon('dice')} Surprise me</button></div>
            <p class="note">You choose how she looks. Who she <i>is</i> is up to her: her temperament, talents, fears and dreams are different every time, and you'll discover them as she grows.</p>
          </div>
        </div>`;
    } else {
      body = `<div class="setup-head"><h2>How long a tale?</h2>${steps}</div>
        <div class="setup-grid">${Object.entries(D.LENGTHS).map(([id, L]) => `<button class="opt" type="button" data-len="${id}" aria-pressed="${st.length === id}"><b>${L.name}</b><small>${esc(L.blurb)}</small><span class="perk">${L.years * 4} seasons</span></button>`).join('')}</div>
        <div class="row"><label class="label" for="code-in">Daughter code</label><input id="code-in" class="text-in" placeholder="Optional, e.g. SR-3F9K2A" value="${esc(st.code)}" style="flex:1;max-width:260px"><span class="note">Enter a code a friend shared to raise the very same daughter.</span></div>`;
    }
    const foot = `<div class="setup-foot"><button class="btn btn-ghost" type="button" id="setup-back">${st.step ? 'Back' : 'Title'}</button><button class="btn btn-big" type="button" id="setup-next">${st.step < 2 ? 'Next' : 'Begin on Qixi night'}</button></div>`;
    root.innerHTML = body + foot;
    root.querySelectorAll('[data-role]').forEach((b) => (b.onclick = () => { st.role = b.dataset.role; st.address = D.ADDRESS[st.role][0]; G.Audio.sfx('select'); renderSetup(); }));
    root.querySelectorAll('[data-addr]').forEach((b) => (b.onclick = () => { st.address = b.dataset.addr; G.Audio.sfx('select'); renderSetup(); }));
    root.querySelectorAll('[data-bg]').forEach((b) => (b.onclick = () => { st.background = b.dataset.bg; G.Audio.sfx('select'); renderSetup(); }));
    root.querySelectorAll('[data-len]').forEach((b) => (b.onclick = () => { st.length = b.dataset.len; G.Audio.sfx('select'); renderSetup(); }));
    ['hair', 'eyes', 'skin', 'style'].forEach((k) => root.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { st.look[k] = b.dataset[k]; G.Audio.sfx('select'); renderSetup(); })));
    const rnd = $('#look-random');
    if (rnd) rnd.onclick = () => {
      st.look.hair = pickKey(G.Portrait.HAIR);
      st.look.eyes = pickKey(G.Portrait.EYES);
      st.look.skin = pickKey(G.Portrait.SKIN);
      st.look.style = ['wavy', 'straight', 'buns', 'ponytail', 'braid', 'updo'][Math.floor(Math.random() * 6)];
      G.Audio.sfx('select');
      renderSetup();
    };
    const lp = $('#lp-port');
    if (lp) {
      lp.getContext('2d').drawImage(G.Portrait.render({ hair: st.look.hair, eyes: st.look.eyes, skin: st.look.skin, style: st.look.style, age: D.LENGTHS[st.length].startAge, expr: 'happy', outfit: D.OUTFITS.everyday, outfitKey: 'everyday' }), 0, 0);
      const sp = $('#lp-sprite');
      const fr = G.Sprites.build({ style: st.look.style }).idle[0];
      const g = sp.getContext('2d');
      g.clearRect(0, 0, 16, 32);
      G.PX.draw(g, G.Sprites.join(fr.rows), G.Sprites.palette(st.look, D.OUTFITS.everyday), 0, 0);
    }
    const codeIn = $('#code-in');
    if (codeIn) codeIn.oninput = () => (st.code = codeIn.value);
    $('#setup-back').onclick = () => {
      G.Audio.sfx('tap');
      if (st.step === 0) title();
      else {
        st.step--;
        renderSetup();
      }
    };
    $('#setup-next').onclick = () => {
      G.Audio.sfx('confirm');
      if (st.step < 2) {
        st.step++;
        renderSetup();
        return;
      }
      const seed = Sim.seedFromCode(st.code);
      beginNew(Object.assign({}, st, { seed: seed || undefined, look: Object.assign({}, st.look), name: G.suggestName() }));
    };
  }
  const pickKey = (o) => {
    const k = Object.keys(o);
    return k[Math.floor(Math.random() * k.length)];
  };

  // ================================================================ new game & loop
  async function beginNew(opts) {
    s = Sim.newGame(opts);
    s.diaryBook = [];
    UI.state = s;
    show('game');
    UI.hud(s);
    G.Audio.setMood('night');
    const arrival = G.Events.find((e) => e.id === 'arrival');
    await runEvent(arrival);
    s.phase = 'new';
    Sim.save(s);
    loop();
  }

  function enterGame() {
    show('game');
    s.diaryBook = s.diaryBook || [];
    UI.hud(s);
    if (s.turn >= s.turns) return finale();
    loop();
  }

  let looping = false;
  async function loop() {
    if (looping) return;
    looping = true;
    try {
      while (s.turn < s.turns) {
        await season();
        if (App.aborted) return;
      }
      await finale();
    } finally {
      looping = false;
    }
  }

  async function runEvent(e, log) {
    if (!e) return;
    s.seen[e.id] = true;
    const seenBefore = profile.seen[e.id] || 0;
    profile.seen[e.id] = seenBefore + 1;
    $('#dlg-skip').hidden = !(UI.settings.skipSeen && seenBefore > 0);
    UI.skipping = false;
    try {
      await e.run(ctx(log));
    } catch (err) {
      console.error('event failed', e.id, err);
    }
    UI.skipping = false;
    $('#dlg-skip').hidden = true;
    UI.showDialogue(false);
    UI.clearNpcs();
    UI.hud(s);
  }

  async function home() {
    const sea = Sim.season(s);
    await UI.scene('home', { tod: 'day' });
    G.Audio.setMood(sea);
    courtyardLife();
  }

  async function season() {
    const sea = Sim.season(s);
    if (s.phase !== 'plan') {
      await home();
      UI.hud(s);
      $('#planner').innerHTML = `<div class="plan-head"><h3>${D.SEASON_NAME[sea]} arrives</h3><span class="gold">${icon('coin')}${s.gold}</span></div><p class="note">A new season in Peach Blossom Town.</p>`;
      await UI.seasonCard(s);
      if (s.turn === 0) {
        const fm = G.Events.find((e) => e.id === 'first_morning');
        if (fm && !s.seen.first_morning) await runEvent(fm);
      } else {
        const starts = Sim.pickEvents(s, 'start', 1);
        for (const e of starts) if (e.priority || U.chance(0.55)) await runEvent(e);
      }
      s.phase = 'plan';
      s.wish = M.wish(s, Sim.available(s));
      s.talksLeft = s.focus === 'family' ? 2 : 1;
      s.outingsLeft = s.focus === 'family' ? 2 : s.focus === 'work' ? 0 : 1;
      s.outingNotes = [];
      s.clicks = 0;
      Sim.save(s);
    }
    await home();
    UI.hud(s);
    if (s.newsTurn !== s.turn) {
      s.newsTurn = s.turn;
      const news = G.Town.news(s);
      if (news && getComputedStyle($('#status')).display === 'none') setTimeout(() => UI.toast({ kind: 'town', text: news }), 1200);
    }
    const plan = await planning();
    if (App.aborted) return;
    s.phase = 'run';
    stopCourtyard();
    seasonProgress(plan, -1);
    const log = { months: [], diary: [], forced: false, listened: false, outing: (s.outingNotes || [])[0] || null, wishMet: false };
    // will she push back?
    const pr = M.protest(s, plan.acts.map((id, i) => (plan.locked[i] ? null : id)));
    if (pr) {
      const r = await T.protest(ctx(log), pr);
      UI.showDialogue(false);
      if (r === 'forced') {
        log.forced = true;
        plan.forced[pr.slot] = true;
      } else if (r === 'swap') {
        plan.acts[pr.slot] = 'free';
        plan.locked[pr.slot] = true;
        log.listened = true;
      } else log.listened = true;
    }
    if (s.wish && plan.acts.includes(s.wish.id)) log.wishMet = true;
    // the three months
    const months = D.MONTHS[sea];
    for (let i = 0; i < 3; i++) {
      seasonProgress(plan, i);
      const res = Sim.doMonth(s, plan.acts[i], { forced: plan.forced[i], chosen: plan.locked[i] });
      plan.done = plan.done || [];
      plan.done[i] = res;
      await montage(res, months[i]);
      if (res.act === 'journey') {
        const note = await T.journey(ctx(log));
        UI.showDialogue(false);
        if (note) log.diary.push(note);
      }
      log.months.push(res);
      UI.hud(s);
    }
    seasonProgress(plan, 3);
    // life happens
    await home();
    const mids = Sim.pickEvents(s, 'mid', 2);
    let ran = 0;
    for (const e of mids) {
      if (ran === 0 && (e.priority || U.chance(0.85))) {
        await runEvent(e, log);
        ran++;
      } else if (ran === 1 && e.priority && e.priority >= 20) {
        await runEvent(e, log);
        ran++;
      }
    }
    // the season closes
    Sim.endSeason(s, log);
    const open = Sim.diaryOpen(s).open;
    s.diaryBook.push({ turn: s.turn, label: D.SEASON_NAME[sea] + ', age ' + s.age, age: s.age, lines: log.diaryText, open });
    if (s.diaryBook.length > 40) s.diaryBook.shift();
    UI.hud(s);
    await diaryMoment(s.diaryBook[s.diaryBook.length - 1]);
    if (sea === 'summer' && !Sim.isLastSeason(s)) {
      await runEvent({ id: 'birthday_' + s.turn, run: (g) => T.birthday(g) });
      s.age++;
      UI.hud(s);
    }
    s.turn++;
    s.phase = 'new';
    s.wish = null;
    Sim.save(s);
  }

  function diaryMoment(entry) {
    return new Promise((res) => {
      UI.onSheetClose = res;
      const html = UI.diaryPage(s, entry) + `<div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close2>Continue</button></div>`;
      UI.sheet(entry.open ? s.name + '\'s diary' : 'The locked diary', html, (root, close) => {
        root.querySelector('[data-close2]').onclick = close;
      });
      G.Audio.sfx('page');
    });
  }

  async function montage(res, when) {
    const A = D.ACT[res.act] || D.ACT.rest;
    const sea = Sim.season(s);
    const scene = res.hobby ? 'garden' : A.scene;
    await UI.scene(scene, { tod: A.id === 'observatory' ? 'night' : 'day', noHer: true });
    UI.outfitOverride = A.outfit || null;
    const her = UI.placeHer(res.collapsed ? 'sleep' : res.hobby ? 'cheer' : A.anim || 'idle');
    UI.outfitOverride = null;
    if (A.who && !res.hobby) UI.npc(A.who, 'mentor');
    if (A.id === 'play' || (A.id === 'free' && res.act === 'play')) UI.npc('mei', 'right');
    if (A.id === 'stall') UI.npc('tao', 'right');
    ambientWalkers(scene);
    if (res.outcome === 'great') UI.stage.emote(her, 'sparkle', 3);
    else if (res.outcome === 'poor') UI.stage.emote(her, 'drop', 3);
    if (res.outcome === 'great') G.Audio.sfx('up');
    await UI.caption(res, when + ' · ' + D.SEASON_NAME[sea], profile.settings.text === 2);
    UI.clearNpcs();
  }

  // ================================================================ planning
  function planning() {
    return new Promise((resolve) => {
      const P = { acts: [null, null, null], forced: [false, false, false], locked: [false, false, false], sel: 0, tab: 'study' };
      if (s.flags.autonomy || s.age >= 17) {
        P.acts[2] = 'free';
        P.locked[2] = true;
        if (s.age >= 17 && s.bond < 30) {
          P.acts[1] = 'free';
          P.locked[1] = true;
        }
      }
      if (s.flags.grounded && s.flags.grounded >= s.turn) {
        // grounded: no play, no journeys this season
        P.grounded = true;
      }
      P.sel = P.acts.findIndex((x) => !x);
      App.plan = P;
      const render = () => renderPlanner(P, handlers);
      const handlers = {
        slot(i) {
          if (P.locked[i]) {
            UI.herActor && UI.bubble(UI.herActor, M.pick(s, { _: 'That month is mine, remember?', sassy: 'Hands off. That one\'s mine.' }));
            return;
          }
          P.sel = i;
          render();
        },
        act(id) {
          if (P.sel < 0) P.sel = P.acts.findIndex((x, i) => !P.locked[i]);
          if (P.sel < 0) return;
          const A = D.ACT[id];
          if (A.limit && P.acts.filter((x, i) => x === id && i !== P.sel).length >= A.limit) return;
          P.acts[P.sel] = id;
          const r = M.react(s, id);
          UI.herExpr(r.expr);
          if (UI.herActor) {
            UI.stage.emote(UI.herActor, r.emote || (r.lvl === 'hate' ? 'anger' : null), 2.5);
            UI.bubble(UI.herActor, r.text, 3200);
          }
          P.face = r.expr;
          G.Audio.sfx(r.lvl === 'hate' || r.lvl === 'dislike' ? 'down' : 'select');
          const next = P.acts.findIndex((x, i) => !x && !P.locked[i]);
          P.sel = next;
          render();
        },
        tab(t) {
          P.tab = t;
          render();
        },
        focus(f) {
          s.focus = f;
          s.talksLeft = Math.min(s.talksLeft, f === 'family' ? 2 : 1);
          render();
        },
        async talk() {
          if (s.talksLeft <= 0) return;
          const topics = T.topics(s);
          UI.sheet('Talk with ' + s.name, `<div class="talk-list">${topics.map((t) => `<button class="btn ${t.special ? 'btn-gold' : 'btn-ghost'}" type="button" data-t="${t.id}">${esc(t.label)}</button>`).join('')}</div>`, (root, close) => {
            root.querySelectorAll('[data-t]').forEach((b) =>
              (b.onclick = async () => {
                close();
                s.talksLeft--;
                stopCourtyard();
                await T.run(b.dataset.t, ctx());
                UI.showDialogue(false);
                UI.hud(s);
                await home();
                render();
              })
            );
          });
        },
        async outing() {
          if (s.outingsLeft <= 0) return;
          const list = T.outings(s);
          UI.sheet('Go out together', `<div class="talk-list">${list.map((o) => `<button class="btn ${o.festival ? 'btn-gold' : 'btn-ghost'}" type="button" data-o="${o.id}" ${o.cost > s.gold ? 'disabled' : ''}>${esc(o.name)} · ${o.cost} coins</button>`).join('')}</div><p class="note">Outings lift her mood and bring you closer. Festivals only come once a season.</p>`, (root, close) => {
            root.querySelectorAll('[data-o]').forEach((b) =>
              (b.onclick = async () => {
                close();
                s.outingsLeft--;
                stopCourtyard();
                const note = await T.outing(b.dataset.o, ctx());
                UI.showDialogue(false);
                UI.clearNpcs();
                if (note) s.outingNotes.push(note);
                UI.hud(s);
                await home();
                render();
              })
            );
          });
        },
        wardrobe() {
          wardrobe(render);
        },
        begin() {
          if (P.acts.some((x) => !x) || Sim.shortfall(s, P.acts) > 0) return;
          G.Audio.sfx('confirm');
          resolve(P);
        },
      };
      render();
    });
  }

  // while the season plays out, the planner shows what is happening instead of stale buttons
  function seasonProgress(plan, at) {
    const sea = Sim.season(s);
    const rows = plan.acts.map((id, i) => {
      const done = plan.done && plan.done[i];
      const A = D.ACT[done ? done.act : id] || D.ACT.rest;
      const state = i < at || (at === 3) ? (done ? (done.outcome === 'great' ? '✦ Great' : done.outcome === 'poor' ? 'Rough' : 'Done') : 'Done') : i === at ? 'Now' : 'Next';
      return `<div class="slot ${i === at ? 'sel' : ''}"><small>${D.MONTHS[sea][i]}</small>${icon(done && done.hobby ? 'sparkle' : A.icon)}<b>${esc(done && done.hobby ? 'Her own time' : plan.locked[i] && !done ? 'Her plans' : A.name)}</b><small>${state}</small></div>`;
    }).join('');
    $('#planner').innerHTML = `<div class="plan-head"><h3>${D.SEASON_NAME[sea]} is underway</h3><span class="gold">${icon('coin')}${s.gold}</span></div><div class="slots">${rows}</div><p class="note">${at >= 3 ? 'The season is drawing to a close...' : 'Watch how the months go. Tap the caption to move on.'}</p>`;
  }

  function affMark(id) {
    if (!s.known.likes[id]) return '<span class="aff" title="You don\'t know yet">?</span>';
    const l = M.affLevel(s.aff[id]);
    return `<span class="aff" title="${M.AFF_WORDS[l]}">${{ love: '♥♥', like: '♥', neutral: '·', dislike: '✕', hate: '✕✕' }[l]}</span>`;
  }

  function renderPlanner(P, h) {
    const root = $('#planner');
    const sea = Sim.season(s);
    const avail = new Set(Sim.available(s));
    const wish = s.wish;
    const mood = M.mood(s);
    const slots = P.acts.map((id, i) => {
      const A = id ? D.ACT[id] : null;
      const cost = id ? Sim.cost(s, id) : 0;
      return `<button class="slot ${P.sel === i ? 'sel' : ''} ${P.locked[i] ? 'locked' : ''}" type="button" data-slot="${i}"><small>${D.MONTHS[sea][i]}</small>${A ? `${icon(A.icon)}<b>${esc(P.locked[i] ? 'Her plans' : A.name)}</b><small>${P.locked[i] ? 'She decides' : cost > 0 ? '−' + cost : cost < 0 ? '+' + -cost : 'free'}</small>` : '<span class="empty">+ Choose</span>'}</button>`;
    }).join('');
    const tabs = [['study', 'Lessons'], ['work', 'Work'], ['leisure', 'Leisure']].map(([k, n]) => `<button class="tab" type="button" role="tab" aria-selected="${P.tab === k}" data-tab="${k}">${n}</button>`).join('');
    const acts = D.ACTS.filter((a) => a.cat === P.tab && a.id !== 'free').map((a) => {
      const ok = avail.has(a.id) && !(P.grounded && (a.id === 'play' || a.id === 'journey')) && !(s.flags['quit_' + a.id] && s.flags['quit_' + a.id] > s.turn);
      const why = !avail.has(a.id) ? G.Sim.canDo(s, a).why : P.grounded && (a.id === 'play' || a.id === 'journey') ? 'Grounded' : s.flags['quit_' + a.id] > s.turn ? 'She quit this' : '';
      const cost = Sim.cost(s, a.id);
      const gains = Object.entries(a.gain).map(([k, v]) => `<span class="g">+${D.STATS.find((x) => x.id === k).name}</span>`).join('');
      return `<button class="act" type="button" data-act="${a.id}" ${ok && P.sel >= 0 ? '' : 'disabled'} title="${esc(why || '')}">${wish && wish.id === a.id ? '<span class="wishmark">★ Her wish</span>' : ''}${affMark(a.id)}<span class="top">${icon(a.icon)}<span class="nm">${esc(a.name)}</span></span><span class="gains">${gains || '<span class="g">Rest</span>'}</span><span class="meta"><span class="cost ${cost < 0 ? 'earn' : ''}">${cost > 0 ? cost + ' coins' : cost < 0 ? 'earns ' + -cost : a.stress < 0 ? 'free' : 'free'}</span><span>${why ? esc(why) : a.stress > 0 ? 'Stress +' + a.stress : 'Stress ' + a.stress}</span></span></button>`;
    }).join('');
    const cost = Sim.planCost(s, P.acts);
    const pay = Sim.planPay(s, P.acts);
    const short = Sim.shortfall(s, P.acts);
    const income = D.PARENTS[s.parent.bg].income + (s.focus === 'work' ? 90 : s.focus === 'family' ? -40 : 0);
    const full = P.acts.every((x) => x);
    const wishText = wish ? wish.text : M.pick(s, { _: 'I\'m happy with whatever you plan, ' + M.addr(s) + '!', sassy: 'Surprise me. But not with etiquette.', soft: 'Whatever you think is best...', dreamy: 'I wonder what this season will bring.', earnest: 'I\'m ready to work hard this season.' });
    root.innerHTML = `
      <div class="plan-head"><h3>Plans for ${D.SEASON_NAME[sea]}</h3><span class="gold">${icon('coin')}${s.gold}</span></div>
      <div class="wish"><canvas id="wish-port" width="64" height="64"></canvas><p>“${esc(wishText)}”<span class="mood">${esc(s.name)} feels ${M.MOOD_WORDS[mood.label].toLowerCase()}${s.stress >= 70 ? ' and exhausted' : ''}.</span></p></div>
      <div class="slots">${slots}</div>
      <div class="tabs" role="tablist">${tabs}</div>
      <div class="acts">${acts}</div>
      <p class="sub">This season together</p>
      <div class="plan-actions">
        <button class="btn btn-ghost" type="button" data-do="talk" ${s.talksLeft > 0 ? '' : 'disabled'}>${icon('talk')}Talk (${s.talksLeft})</button>
        <button class="btn btn-ghost" type="button" data-do="outing" ${s.outingsLeft > 0 ? '' : 'disabled'}>${icon('basket')}Outing (${s.outingsLeft})</button>
        <button class="btn btn-ghost" type="button" data-do="wardrobe">${icon('robe')}Clothes</button>
      </div>
      <div class="focus" role="group" aria-label="Your own season">${[['balanced', 'Balanced'], ['work', 'Work extra (+90)'], ['family', 'Family time (−40)']].map(([k, n]) => `<button type="button" data-focus="${k}" aria-pressed="${s.focus === k}">${n}</button>`).join('')}</div>
      <div class="plan-go"><div class="sum"><span>Lessons −${cost}${pay ? ' · her work +' + pay : ''} · your income +${income} at season's end</span>${short ? `<span class="warn">${short} coins short${pay ? ': put work before lessons' : ''}</span>` : ''}</div>
      <button class="btn btn-big" type="button" data-do="begin" ${full && !short ? '' : 'disabled'}>${full ? 'Begin the season' : 'Plan all three months'}</button></div>`;
    const wc = $('#wish-port');
    wc.getContext('2d').drawImage(G.Portrait.render(UI.herPortraitOpts(s, P.face || M.restingExpr(s))), 0, 0);
    root.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => h.slot(+b.dataset.slot)));
    root.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => h.act(b.dataset.act)));
    root.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => h.tab(b.dataset.tab)));
    root.querySelectorAll('[data-focus]').forEach((b) => (b.onclick = () => h.focus(b.dataset.focus)));
    root.querySelectorAll('[data-do]').forEach((b) => (b.onclick = () => h[b.dataset.do]()));
  }

  function wardrobe(after) {
    const shop = ['everyday', 'festival', 'scholar', 'martial', 'dancer', 'plum', 'moon'];
    const html = `<div class="wardrobe">${shop.map((k) => {
      const O = D.OUTFITS[k];
      const own = s.wardrobe.includes(k);
      return `<button class="ward" type="button" data-w="${k}" aria-pressed="${s.outfit === k}" ${!own && (O.cost || 0) > s.gold ? 'disabled' : ''}><canvas width="16" height="32"></canvas><b>${esc(O.name)}</b><small>${own ? (s.outfit === k ? 'Wearing' : 'Owned') : (O.cost || 0) + ' coins'}</small></button>`;
    }).join('')}</div><p class="note">She has opinions about clothes. Dressing her in something she loves lifts her mood.</p>`;
    UI.sheet('Her wardrobe', html, (root, close) => {
      root.querySelectorAll('[data-w]').forEach((b) => {
        const k = b.dataset.w;
        const c = b.querySelector('canvas');
        const fr = G.Sprites.build({ style: s.style }).idle[0];
        G.PX.draw(c.getContext('2d'), G.Sprites.join(fr.rows), G.Sprites.palette(s.look, D.OUTFITS[k]), 0, 0);
        b.onclick = () => {
          const O = D.OUTFITS[k];
          if (!s.wardrobe.includes(k)) {
            if ((O.cost || 0) > s.gold) return;
            s.gold -= O.cost || 0;
            s.wardrobe.push(k);
            M.need(s, 'fun', 8);
          }
          s.outfit = k;
          const likes = (k === 'martial' && s.traits.bold > 20) || (k === 'dancer' && s.traits.playful > 10) || (k === 'scholar' && s.traits.diligent > 20) || ((k === 'plum' || k === 'moon') && s.traits.dreamy > 10) || k === 'festival';
          G.Audio.sfx('select');
          close();
          UI.refreshHer();
          UI.hud(s);
          if (UI.herActor) UI.bubble(UI.herActor, likes ? M.pick(s, { _: 'I love this one!', sassy: 'Okay, this one actually slaps.', soft: 'It\'s so pretty...' }) : M.pick(s, { _: 'It\'s nice, I guess.', sassy: 'Do I have to wear this?' }));
          if (likes) M.need(s, 'fun', 4);
          after && after();
        };
      });
    });
  }

  // ================================================================ courtyard life
  let lifeTimer = null, visitTimer = null, visiting = false;
  function stopCourtyard() {
    clearInterval(lifeTimer);
    clearTimeout(visitTimer);
    lifeTimer = null;
    visitTimer = null;
  }
  // now and then someone drops by while you are planning
  function scheduleVisit() {
    if (!s || s.phase !== 'plan' || s.visitTurn === s.turn) return;
    visitTimer = setTimeout(async () => {
      if (!s || s.phase !== 'plan' || App.screen !== 'game' || !UI.dlg.hidden || UI.sheetOpen || !UI.herActor || visiting) return scheduleVisit();
      s.visitTurn = s.turn;
      if (Math.random() > 0.7) return;
      const v = G.Town.pickVisitor(s);
      if (!v) return;
      visiting = true;
      try {
        await G.Town.playVisit(s, v, UI);
      } finally {
        visiting = false;
      }
    }, 3500 + Math.random() * 5000);
  }
  function courtyardLife() {
    stopCourtyard();
    const st = UI.stage;
    const her = UI.herActor;
    if (!her) return;
    if (s.flags.pet) {
      st.add({ id: 'cat', kind: 'cat', x: 90, y: 158, anim: 'idle', pal: G.Sprites.CAT_PAL, cfg: { cat: true }, clickable: true, speed: 0.35 });
    }
    scheduleVisit();
    let t = 0;
    lifeTimer = setInterval(() => {
      if (App.screen !== 'game' || !UI.dlg.hidden || UI.sheetOpen || visiting) return;
      t++;
      const a = UI.herActor;
      if (!a || a.target) return;
      if (t % 3 !== 0) return;
      const what = M.idle(s);
      if (what === 'walk') {
        const x = 70 + Math.random() * 190, y = 140 + Math.random() * 22;
        st.walkTo(a, x, y).then(() => (a.anim = 'idle'));
      } else {
        a.anim = what;
        a.t = 0;
        if (Math.random() < 0.3) {
          const line = idleLine(what);
          if (line) UI.bubble(a, line, 2400);
        }
      }
      const cat = st.get('cat');
      if (cat && !cat.target && Math.random() < 0.5) st.walkTo(cat, 60 + Math.random() * 200, 146 + Math.random() * 20);
    }, 1400);
  }
  function idleLine(what) {
    const P = M.addr(s);
    const L = {
      sword: ['Hyah! Hyah!', 'One more form...'],
      read: ['Hmm, hmm...', '"The superior person..." wait, what?'],
      guqin: ['♪ ~', '♪ ♪'],
      cook: ['Smells good!', 'Just a pinch more salt...'],
      dance: ['♪ Turn, turn, step ~', 'La la la ~'],
      stars: ['I think I see my star.'],
      pray: ['...'],
      sleep: ['Zzz...'],
      sit: [M.mood(s).label === 'low' ? '...' : 'What a nice day.'],
      cry: ['(sniff)'],
      kite: ['Higher! Higher!'],
      cheer: ['Hehe!'],
      love: ['♥'],
      idle: [],
    };
    const arr = L[what] || [];
    // what's on her mind: something that happened recently
    const recent = s.memories.filter((m) => m.turn >= s.turn - 2 && m.weight >= 5 && m.text && !/^[A-Z]/.test(m.text));
    if (recent.length && Math.random() < 0.18) {
      const m = U.pick(recent);
      return m.val < 0 ? M.pick(s, { _: '...I\'m still thinking about ' + m.text + '.', sassy: 'Not that I\'m still mad about ' + m.text + '. I\'m not. Totally not.' }) : M.pick(s, { _: 'Hehe... ' + m.text + '...', soft: '(She smiles to herself, thinking about ' + m.text + '.)', dreamy: 'I keep replaying ' + m.text + ' in my head.' });
    }
    if (s.flags.pet && Math.random() < 0.2) return s.flags.pet + ', come back here!';
    if (s.stress > 75 && Math.random() < 0.3) return 'So tired... ' + P + '...';
    return arr.length ? U.pick(arr) : null;
  }

  // click on characters in the world
  const HER_CLICK = {
    radiant: ['Hehe! What is it?', 'Did you need me, {P}?', 'Look, look! I learned something new!'],
    happy: ['Hm? Oh, hi {P}!', 'I\'m busy being amazing.', 'Want to hear a secret? ...Never mind!'],
    calm: ['Mm?', 'Hi, {P}.', 'I was just thinking.'],
    low: ['...I\'m fine.', '(She leans against you for a moment.)', 'Can you stay here a bit?'],
    upset: ['Not now.', 'Hmph.', '(She turns away.)'],
  };
  const NPC_LINES = {
    mei: ['Your daughter is the only person who laughs at all my jokes. Even the bad ones. Especially the bad ones.', 'Grandma says I talk too much. I say I talk exactly enough.', 'We\'re making the biggest lantern in town this year. Don\'t tell anyone. It\'s shaped like a rabbit. A huge rabbit.'],
    tao: ['G-good day! Would you like a bun? They\'re free. For you. For your family. For people.', 'My father says I fold dumplings like a poet. I don\'t know if that\'s a compliment.', 'Does she... does she ever mention the dumpling stall? No reason.'],
    wanyin: ['My father says second place is the first loser. I think my father is wrong. Don\'t tell him I said that.', 'Your daughter has terrible posture. ...And a wonderful laugh. Both things are true.'],
    prince: ['Riddles are the only thing in the world nobody can order me to be good at.', 'Do you know what it\'s like when everyone bows? It\'s very lonely. Your daughter never bows.'],
    gao: ['Hmph. The girl has a strong stance. For a twig.', 'Discipline is the sword. Kindness is the hand that holds it. Remember that.', 'My knee hurts. It will rain tomorrow. My knee is never wrong.'],
    wen: ['Ah! Have you read the new commentary on the Book of Songs? No? Tragic.', 'She argued with me about Mencius today. She lost. But she argued beautifully.', 'I once wrote a poem so bad the ink ran away from the page.'],
    liu: ['Music is only silence that has learned to sing.', 'Your daughter plays with her whole heart. It is noisy. It is wonderful.', 'I had a friend once who played the guqin better than me. I still hear him when the wind is right.'],
    hua: ['A lady is a swan: serene above the water, paddling furiously below.', 'Her curtsy has improved. Her giggling has not.', 'I was a lady of the court once. The palace has more stairs than you would believe.'],
    jingci: ['The temple bell rings for everyone, even those who don\'t come.', 'Your daughter feeds our carp too much. The carp have never been happier.', 'Anger is a hot coal you hold to throw at someone else.'],
    bao: ['Eat! You\'re too thin. Everyone is too thin.', 'The secret to good dumplings? Patience, and never, ever tell anyone the secret.', 'Your girl burned my best steamer. I forgave her. I forgive everyone who eats.'],
    yue: ['A dancer falls a thousand times so that she can fly once.', 'She has the feet of a goose and the heart of a crane. We will work with the heart.'],
    xing: ['The stars have been restless lately. They whisper about a little lost thread.', 'I have counted eleven thousand stars. I lost count twice.', 'Every Qixi I leave a cup of tea out for the Cowherd. He has never drunk it. I remain hopeful.'],
    lu: ['Ginger for the stomach, rest for the heart, and laughter for everything else.', 'She has good hands for medicine. Steady. Like her mother\'s. Or father\'s. You know what I mean.'],
    bai: ['...', 'The mountain does not hurry. Neither should you.'],
    kid: ['Is it true your daughter fell out of the sky? Can she do it again? I want to watch.', 'I\'m going to be a general. Or a dumpling seller. Maybe both.'],
    shop: ['Fresh lychees! Sweet as first love!', 'Silk from the south! Tea from the west! Gossip for free!'],
  };
  const WALKERS = ['kid', 'shop'];
  function ambientWalkers(scene) {
    if (!['town', 'market', 'garden', 'lake', 'temple', 'hall', 'field'].includes(scene)) return;
    const st = UI.stage;
    const n = scene === 'market' || scene === 'town' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const id = U.pick(WALKERS.concat(['mei', 'tao'].filter((x) => x !== 'tao' || scene === 'market')));
      const npc = G.NPC[id];
      if (!npc || !npc.outfit || UI.npcActors[id]) continue;
      const fromLeft = Math.random() < 0.5;
      const y = 150 + Math.random() * 20;
      const a = st.add({ id: 'walker_' + id + i, kind: 'npc', x: fromLeft ? -10 : 330, y, anim: 'idle', pal: G.Sprites.palette(npc.look, npc.outfit), cfg: { style: npc.style, male: npc.body === 'man' || npc.body === 'boy', beard: npc.beard }, clickable: true, npc: id, speed: 0.35 + Math.random() * 0.2 });
      UI.npcActors['walker' + i] = a;
      st.walkTo(a, fromLeft ? 340 : -20, y).then(() => st.remove(a.id));
    }
  }
  function clickActor(a) {
    if (!s || !UI.dlg.hidden) return;
    if (a.kind === 'her') {
      const m = M.mood(s).label;
      let line = M.fill(s, U.pick(HER_CLICK[m]));
      if (s.dream && Math.random() < 0.2) line = M.pick(s, { _: 'One day I\'ll make my dream come true. You\'ll see.' });
      if (s.fav && Math.random() < 0.12 && s.known.fav.food) line = 'Is that ' + s.fav.food + ' I smell? No? ...Pity.';
      UI.bubble(a, line, 2800);
      s.clicks = (s.clicks || 0) + 1;
      if (s.clicks === 3 && (m === 'low' || m === 'upset')) {
        M.need(s, 'love', 4);
        UI.bubble(a, M.pick(s, { _: '...Thanks for checking on me.', sassy: 'Okay, okay. I feel a little better. Happy?' }), 3000);
      }
      G.Audio.sfx('tap');
      UI.stage.emote(a, m === 'upset' ? 'anger' : m === 'low' ? 'dots' : 'heart', 1.8);
      return;
    }
    if (a.kind === 'cat') {
      UI.bubble(a, 'Mrrp.', 1600);
      UI.stage.emote(a, 'heart', 1.5);
      return;
    }
    if (a.npc && NPC_LINES[a.npc]) {
      UI.bubble(a, U.pick(NPC_LINES[a.npc]), 3600);
      G.Audio.sfx('tap');
    }
  }

  // ================================================================ the end
  async function finale() {
    stopCourtyard();
    G.Audio.setMood('night');
    s.age = 18;
    s.phase = 'finale';
    UI.hud(s);
    if (!s.finale) {
      await runEvent({ id: 'finale', run: (g) => T.finale(g) });
    }
    const star = !s.finale.stays;
    const career = star ? (s.finale.bridge ? E.STAR_BRIDGE : E.STAR) : E.career(s);
    s.endingId = career.id;
    Sim.save(s);
    let letter = null;
    if (G.LLM.ready()) {
      // she writes while the night winds down, so the wait is part of the story
      const pending = G.LLM.letter(s, career, star);
      let done = false;
      pending.then(() => (done = true));
      await runEvent({
        id: 'letter_writing',
        run: async (g) => {
          await g.nar(star ? 'Before she crossed, she left a folded sheet of red paper on the table, weighed down with her star hairpin.' : 'Later that night, you see lamplight under her door. She is writing something, very carefully, with her best brush.');
          if (!done) await g.nar(star ? 'You sit with it for a long time before you open it.' : 'You make two cups of tea and wait. She comes out at last with a letter, and puts it in your hands.');
        },
      });
      letter = await pending;
    }
    letter = letter || E.letter(s, career, star);
    record(career, letter);
    Sim.clearSave();
    await endingSheets(career, letter, star);
    App.aborted = true;
    s = null;
    UI.state = null;
    App.aborted = false;
    title();
  }

  function record(career, letter) {
    const e = profile.endings[career.id] || { count: 0, first: Date.now() };
    e.count++;
    profile.endings[career.id] = e;
    profile.register.push({ name: s.name, look: s.look, style: s.style, ending: career.id, endingName: career.name, zh: career.zh, parent: s.parent, code: s.code, date: Date.now(), letter, bond: s.bond, styleName: M.style(s).name, stats: s.stats });
    if (profile.register.length > 60) profile.register.shift();
    Sim.saveProfile(profile);
  }

  function endingSheets(career, letter, star) {
    return new Promise((resolve) => {
      const pages = [];
      const outfit = D.OUTFITS[career.outfit] || D.OUTFITS.everyday;
      const portOpts = Object.assign(UI.herPortraitOpts(s, star ? 'calm' : 'happy'), { age: 18, outfit, outfitKey: career.outfit });
      const epilogue = [career.text ? M.fill(s, career.text) : '', star ? (s.finale.bridge ? 'Every year since, on the night of Qixi, when the magpies build their bridge, a girl with starlight hair crosses it the wrong way, and comes home for one night.' : 'On clear nights you sit in the courtyard and find her star. It is always the brightest one.') : E.relationText(s), star ? '' : E.friendsText(s)].filter(Boolean);
      pages.push(`<div class="ending-title"><div class="zh">${esc(career.zh)}</div><h2>${esc(career.name)}</h2><p>${esc(s.name)}, eighteen</p></div><div class="ending-hero"><div class="scene"><canvas id="end-scene"></canvas></div><canvas id="end-port" class="port"></canvas></div>`);
      pages.push(`<div class="prose">${epilogue.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`);
      pages.push(`<div class="letter">${letter.map((l, i) => `<p class="${i === letter.length - 1 ? 'sig' : ''}">${esc(l)}</p>`).join('')}</div>`);
      const style = M.style(s);
      pages.push(`<div class="grid2"><div class="box"><h3>Who she became</h3>${D.STATS.map((st) => `<div class="stat" style="--c:${st.color}"><span class="gl">${st.glyph}</span><span>${st.name}</span><span class="bar"><i style="width:${s.stats[st.id]}%"></i></span><span class="v">${s.stats[st.id]}</span></div>`).join('')}</div><div class="box"><h3>You and her</h3><p style="margin:0">Bond ${s.bond} · Trust ${s.trust}</p><p style="margin:0">You were <b>${style.name}</b>. <span class="muted">${style.desc}</span></p><p style="margin:0">${s.memories.length} memories · ${s.album.length} photos</p><p style="margin:0">Daughter code: <b>${esc(s.code)}</b></p><p class="note">Share the code to let someone raise this same daughter.</p></div></div><p class="muted" style="text-align:center">${Object.keys(profile.endings).length} of ${E.ALL.length} endings found. ${esc(s.name)} has been written into your family register.</p>`);
      let i = 0;
      const render = () => {
        UI.sheet(i === 0 ? 'Eighteen years' : i === 1 ? 'Years later' : i === 2 ? 'A letter' : 'The register', pages[i] + `<div class="row" style="justify-content:space-between"><span class="muted">${i + 1} / ${pages.length}</span><button class="btn btn-big" type="button" data-next>${i < pages.length - 1 ? 'Continue' : 'Back to the title'}</button></div>`, (root, close) => {
          const sc = root.querySelector('#end-scene');
          if (sc) {
            UI.renderPhoto(sc, { scene: career.scene, season: 'summer', tod: star || career.scene === 'observatory' ? 'night' : 'day', anim: star ? 'stars' : 'cheer', outfit: career.outfit, npcs: career.id === 'princess' || career.id === 'empress' ? ['prince'] : s.flags.tao_love ? ['tao'] : [] }, Object.assign({}, s));
            const pc = root.querySelector('#end-port');
            UI.drawPortraitInto(pc, portOpts);
          }
          root.querySelector('[data-next]').onclick = () => {
            G.Audio.sfx('page');
            UI.onSheetClose = null;
            close();
            i++;
            if (i < pages.length) render();
            else resolve();
          };
          UI.onSheetClose = () => {
            i++;
            if (i < pages.length) setTimeout(render, 0);
            else resolve();
          };
        });
      };
      G.Audio.setMood(star ? 'sad' : 'festival');
      G.Audio.sfx('bell');
      render();
    });
  }

  // ================================================================ menus
  function gameMenu() {
    UI.sheet('Menu', `<div class="menu-list"><button class="btn" type="button" data-m="save">Save and return to the title</button><button class="btn btn-ghost" type="button" data-m="settings">Settings</button><button class="btn btn-ghost" type="button" data-m="endings">Endings found</button><button class="btn btn-ghost" type="button" data-m="help">How to play</button></div><p class="note">Your game saves automatically at the start of every season, in this browser.</p>`, (root, close) => {
      root.querySelector('[data-m="save"]').onclick = () => {
        Sim.save(s);
        close();
        App.aborted = true;
        stopCourtyard();
        location.reload();
      };
      root.querySelector('[data-m="settings"]').onclick = () => settings();
      root.querySelector('[data-m="endings"]').onclick = () => endingsGallery();
      root.querySelector('[data-m="help"]').onclick = () => help();
    });
  }
  function help() {
    UI.sheet('How to play', `<div class="prose">
      <p>Each season, plan three months for her: lessons, work or leisure. She reacts to every choice. Watch her face.</p>
      <p>She has her own temperament, tastes and dreams. You discover them by trying things, talking to her and paying attention. The "Her" page fills in as you learn.</p>
      <p>Talk with her and take her out once a season. Choose how you spend your own season: working extra earns money, but she will miss you.</p>
      <p>Push too hard and she gets exhausted or pushes back. Listen, and she trusts you more. As she grows, she will want to plan parts of her life herself.</p>
      <p>On her eighteenth Qixi, the stars will call her home. What she chooses depends on everything that came before.</p>
      <p>Click on her in the courtyard, and on people in town. They have things to say.</p></div>`);
  }
  function settings() {
    const st = profile.settings;
    UI.sheet('Settings', `<div class="menu-list">
      <label class="setting"><span>Music</span><input id="set-music" type="range" min="0" max="1" step="0.05" value="${st.music}"></label>
      <label class="setting"><span>Sound effects</span><input id="set-sfx" type="range" min="0" max="1" step="0.05" value="${st.sfx}"></label>
      <div class="setting"><span>Text speed</span><div class="focus">${[['0', 'Slow'], ['1', 'Normal'], ['2', 'Instant']].map(([v, n]) => `<button type="button" data-ts="${v}" aria-pressed="${String(st.text) === v}">${n}</button>`).join('')}</div></div>
      <div class="setting"><span>Skip seen scenes</span><div class="focus"><button type="button" data-sk="1" aria-pressed="${st.skipSeen}">Allow skipping</button><button type="button" data-sk="0" aria-pressed="${!st.skipSeen}">Never</button></div></div>
      <div class="setting"><span>Your data</span><div><button class="btn btn-ghost" type="button" id="wipe">Delete saves and register</button><p class="note" id="wipe-note"></p></div></div></div>`, (root) => {
      const save = () => {
        Sim.saveProfile(profile);
        applySettings();
      };
      root.querySelector('#set-music').oninput = (e) => {
        st.music = +e.target.value;
        save();
      };
      root.querySelector('#set-sfx').oninput = (e) => {
        st.sfx = +e.target.value;
        save();
        G.Audio.sfx('tap');
      };
      root.querySelectorAll('[data-ts]').forEach((b) => (b.onclick = () => {
        st.text = +b.dataset.ts;
        save();
        root.querySelectorAll('[data-ts]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      }));
      root.querySelectorAll('[data-sk]').forEach((b) => (b.onclick = () => {
        st.skipSeen = b.dataset.sk === '1';
        save();
        root.querySelectorAll('[data-sk]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      }));
      let armed = false;
      root.querySelector('#wipe').onclick = () => {
        if (!armed) {
          armed = true;
          root.querySelector('#wipe-note').textContent = 'Press again to permanently delete everything.';
          return;
        }
        U.store.del('save');
        U.store.del('profile');
        profile = Sim.profile();
        root.querySelector('#wipe-note').textContent = 'Deleted.';
      };
    });
  }
  function register() {
    const list = profile.register.slice().reverse();
    const html = list.length
      ? `<div class="register">${list.map((r, i) => `<div class="reg-item"><canvas data-r="${profile.register.length - 1 - i}"></canvas><div><b style="font-family:var(--font-display);color:var(--red-d)">${esc(r.name)}</b> · ${esc(r.zh || '')} ${esc(r.endingName)}<br><span class="muted">${new Date(r.date).toLocaleDateString()} · raised by ${r.parent.role === 'mom' ? 'her mother' : 'her father'} · code ${esc(r.code || '')}</span></div><button class="btn btn-ghost" type="button" data-l="${profile.register.length - 1 - i}">Letter</button></div>`).join('')}</div><p style="margin:10px 0 0"><button class="btn btn-ghost" type="button" id="reg-endings">Endings found</button></p>`
      : '<p class="muted">No daughters yet. Every daughter you raise will be remembered here, with her portrait, her life and her letter.</p><p><button class="btn btn-ghost" type="button" id="reg-endings">Endings to discover</button></p>';
    UI.sheet('Family register', html, (root) => {
      root.querySelectorAll('canvas[data-r]').forEach((c) => {
        const r = profile.register[+c.dataset.r];
        UI.drawPortraitInto(c, { hair: r.look.hair, eyes: r.look.eyes, skin: r.look.skin, style: r.style, age: 18, expr: 'happy', outfit: D.OUTFITS[(E.byId(r.ending) || {}).outfit] || D.OUTFITS.everyday, outfitKey: (E.byId(r.ending) || {}).outfit || 'everyday' });
      });
      root.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => {
        const r = profile.register[+b.dataset.l];
        UI.sheet('A letter from ' + r.name, `<div class="letter">${(r.letter || []).map((l, i, a) => `<p class="${i === a.length - 1 ? 'sig' : ''}">${esc(l)}</p>`).join('')}</div>`);
      }));
      const eb = root.querySelector('#reg-endings');
      if (eb) eb.onclick = () => endingsGallery();
    });
  }
  function endingsGallery() {
    UI.sheet('Endings', `<div class="endings-grid">${E.ALL.map((e) => {
      const got = profile.endings[e.id];
      return `<div class="end-tile ${got ? '' : 'locked'}"><b>${got ? esc(e.zh + ' ' + e.name) : '？？？'}</b>${esc(got ? 'Found ' + got.count + '×' : 'Hint: ' + e.hint)}</div>`;
    }).join('')}</div>`);
  }

  // ================================================================ start
  function boot() {
    const hot = window.claude && window.claude.hot;
    const go = (data) => App.start(data || {});
    try {
      if (hot && typeof hot.ready === 'function') hot.ready(go);
      else go(hot && hot.data ? hot.data : {});
    } catch (e) {
      go({});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
