/* Silver River — presentation: stage, dialogue box, planner, overlays, toasts. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const UI = (G.UI = {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = U.esc;
  const icon = (n) => G.icon(n);

  UI.settings = { text: 1, skipSeen: true };
  UI.state = null;

  // ================================================================ setup
  UI.init = function () {
    UI.stageCanvas = $('#stage');
    UI.stage = new G.World.Stage(UI.stageCanvas);
    UI.stage.start();
    UI.stage.onClickActor = (a) => UI.onActorClick && UI.onActorClick(a);
    UI.dlg = $('#dialogue');
    UI.dlgCanvas = $('#dlg-canvas');
    UI.dlgCanvas.width = 64;
    UI.dlgCanvas.height = 64;
    UI.dlgCtx = UI.dlgCanvas.getContext('2d');
    UI.dlgCtx.imageSmoothingEnabled = false;
    // advance dialogue by click / key
    UI.dlg.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      advance();
    });
    document.addEventListener('keydown', (e) => {
      if (UI.dlg.hidden) return;
      if (e.target.closest && e.target.closest('input')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    });
    $('#dlg-skip').addEventListener('click', () => {
      UI.skipping = true;
      advance();
    });
    setInterval(portraitTick, 90);
  };

  // ================================================================ her portrait in the dialogue box
  let pState = null; // { o, talking, blinkUntil }
  function herPortraitOpts(s, expr) {
    return { hair: s.look.hair, eyes: s.look.eyes, skin: s.look.skin, style: s.style, age: s.age, expr: expr || 'neutral', outfit: D.OUTFITS[s.outfit] || D.OUTFITS.everyday, outfitKey: s.outfit };
  }
  UI.herPortraitOpts = herPortraitOpts;
  function npcPortraitOpts(id, expr) {
    const n = G.NPC[id];
    if (!n || !n.look) return null;
    return { hair: n.look.hair, eyes: n.look.eyes, skin: n.look.skin, style: n.style || 'straight', age: n.age || 16, expr: expr || 'neutral', outfit: n.outfit, outfitKey: 'npc_' + id, male: n.body === 'man' || n.body === 'boy', beard: n.beard, ahoge: false, noPins: true };
  }
  let blinkT = 0;
  function portraitTick() {
    if (!pState || UI.dlg.hidden) return;
    blinkT++;
    const blink = blinkT % 38 === 0 || blinkT % 38 === 1;
    const talk = pState.talking && Math.floor(blinkT / 2) % 2 === 0;
    const c = G.Portrait.render(Object.assign({}, pState.o, { blink, talk }));
    UI.dlgCtx.clearRect(0, 0, 64, 64);
    UI.dlgCtx.drawImage(c, 0, 0);
  }

  // ================================================================ dialogue
  let waiter = null; // resolve fn for "next"
  let typer = null; // { full, i, el, done }
  function advance() {
    if (typer && !typer.done) {
      typer.finish();
      return;
    }
    if (waiter) {
      const w = waiter;
      waiter = null;
      G.Audio.sfx('tap');
      w();
    }
  }
  function showDialogue(on) {
    UI.dlg.hidden = !on;
    $('#game').classList.toggle('talking', on);
    $('#planner').classList.toggle('busy', on);
    if (!on) {
      UI.hideBubble();
      pState = null;
    }
  }
  UI.showDialogue = showDialogue;

  function typeText(el, text) {
    return new Promise((res) => {
      const speed = UI.settings.text === 2 ? 0 : UI.settings.text === 0 ? 22 : 45; // chars per second, 0 = instant
      el.textContent = '';
      let i = 0;
      let iv = null;
      const full = text;
      typer = {
        done: false,
        finish() {
          el.textContent = full;
          this.done = true;
          if (pState) pState.talking = false;
          if (iv) clearInterval(iv);
          res();
        },
      };
      if (!speed || UI.skipping) {
        typer.finish();
        return;
      }
      const step = Math.max(1, Math.round(speed / 30));
      iv = setInterval(() => {
        i += step;
        el.textContent = full.slice(0, i);
        if (i % 6 === 0) G.Audio.sfx && Math.random() < 0.3 && G.Audio.blip && G.Audio.blip();
        if (i >= full.length) typer.finish();
      }, 1000 / 30);
    });
  }

  UI.say = async function (who, text, opts = {}) {
    const s = UI.state;
    showDialogue(true);
    $('.dlg-choices', UI.dlg).innerHTML = '';
    $('.dlg-input', UI.dlg).hidden = true;
    const nameEl = $('.dlg-name', UI.dlg);
    const textEl = $('.dlg-text', UI.dlg);
    const seal = $('.dlg-seal', UI.dlg);
    textEl.classList.toggle('narr', !who);
    if (who === 'her') {
      nameEl.textContent = s.name;
      seal.hidden = true;
      UI.dlgCanvas.hidden = false;
      pState = { o: herPortraitOpts(s, opts.expr), talking: true };
      UI.herExpr(opts.expr);
    } else if (who) {
      const n = G.NPC[who] || { name: who, zh: '?', color: '#8a6a4a' };
      nameEl.textContent = n.name;
      const po = npcPortraitOpts(who, opts.expr);
      if (po && G.Portrait.canMale !== false) {
        seal.hidden = true;
        UI.dlgCanvas.hidden = false;
        pState = { o: po, talking: true };
      } else {
        UI.dlgCanvas.hidden = true;
        seal.hidden = false;
        seal.textContent = n.zh;
        seal.style.setProperty('--seal', n.color);
        pState = null;
      }
    } else {
      nameEl.textContent = '';
      UI.dlgCanvas.hidden = true;
      seal.hidden = false;
      seal.textContent = '✦';
      seal.style.setProperty('--seal', '#2a3170');
      pState = null;
    }
    portraitTick();
    $('.dlg-next', UI.dlg).hidden = true;
    await typeText(textEl, text);
    if (pState) pState.talking = false;
    if (UI.skipping) return;
    $('.dlg-next', UI.dlg).hidden = false;
    await new Promise((r) => (waiter = r));
    $('.dlg-next', UI.dlg).hidden = true;
  };

  UI.choose = function (options) {
    UI.skipping = false;
    showDialogue(true);
    const box = $('.dlg-choices', UI.dlg);
    $('.dlg-next', UI.dlg).hidden = true;
    return new Promise((res) => {
      box.innerHTML = options.map((o, i) => `<button class="btn btn-ghost" type="button" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${esc(o.text)}</button>`).join('');
      box.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
          G.Audio.sfx('select');
          box.innerHTML = '';
          res(+b.dataset.i);
        })
      );
      const first = box.querySelector('button:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    });
  };

  function textPrompt(label, def, allowEmpty) {
    UI.skipping = false;
    showDialogue(true);
    const wrap = $('.dlg-input', UI.dlg);
    const inp = $('#dlg-in');
    const btn = $('#dlg-send');
    $('.dlg-next', UI.dlg).hidden = true;
    $('.dlg-choices', UI.dlg).innerHTML = '';
    if (label) {
      $('.dlg-name', UI.dlg).textContent = '';
      $('.dlg-text', UI.dlg).textContent = label;
      UI.dlgCanvas.hidden = true;
      const seal = $('.dlg-seal', UI.dlg);
      seal.hidden = false;
      seal.textContent = '✎';
      seal.style.setProperty('--seal', '#2a3170');
      pState = null;
    }
    wrap.hidden = false;
    inp.value = def || '';
    inp.focus();
    return new Promise((res) => {
      const done = () => {
        const v = inp.value.trim();
        if (!v && !allowEmpty) return;
        wrap.hidden = true;
        btn.onclick = null;
        inp.onkeydown = null;
        res(v);
      };
      btn.onclick = done;
      inp.onkeydown = (e) => {
        if (e.key === 'Enter') done();
      };
    });
  }
  UI.input = (label, def) => textPrompt(label, def, false);
  UI.freeText = (label) => textPrompt(label, '', true);
  UI.thinking = function (on) {
    const t = $('.dlg-text', UI.dlg);
    if (on) {
      $('.dlg-name', UI.dlg).textContent = UI.state.name;
      t.innerHTML = '<span class="thinking">' + esc(UI.state.name) + ' is thinking</span>';
    }
  };

  // ================================================================ stage
  UI.herActor = null;
  UI.herPal = function (s, outfitKey) {
    return G.Sprites.palette(s.look, D.OUTFITS[outfitKey || s.outfit] || D.OUTFITS.everyday);
  };
  UI.scene = async function (name, opts = {}) {
    const s = UI.state;
    const st = UI.stage;
    UI.hideBubble();
    const items = s ? { books: Math.floor(s.stats.wit / 18), sword: (s.counts.martial || 0) >= 3, guqin: (s.counts.guqin || 0) >= 2, heights: (s.heights || []).length } : {};
    st.set(name, Object.assign({ season: s ? D.SEASONS[s.turn % 4] : 'summer', tod: 'day', items }, opts));
    st.clear();
    UI.herActor = null;
    UI.npcActors = {};
    if (s && !opts.noHer) UI.placeHer(opts.anim || 'idle');
    return true;
  };
  UI.placeHer = function (anim = 'idle', spot = 'her') {
    const s = UI.state;
    const [x, y] = UI.stage.spot(spot);
    UI.herActor = UI.stage.add({ id: 'her', kind: 'her', x, y, anim, pal: UI.herPal(s, UI.outfitOverride), cfg: { style: s.style }, clickable: true });
    return UI.herActor;
  };
  UI.refreshHer = function () {
    if (!UI.herActor || !UI.state) return;
    UI.herActor.pal = UI.herPal(UI.state, UI.outfitOverride);
    UI.herActor.cfg = { style: UI.state.style };
  };
  UI.herAnim = function (anim) {
    if (UI.herActor) {
      UI.herActor.anim = anim;
      UI.herActor.t = 0;
    }
  };
  const EXPR_ANIM = { joy: 'cheer', laugh: 'cheer', love: 'love', cry: 'cry', sleep: 'sleep' };
  const EXPR_EMOTE = { angry: 'anger', pout: 'anger', surprised: 'bang', worried: 'drop', sad: 'drop', thinking: 'dots', shy: 'heart', teary: 'drop' };
  UI.herExpr = function (expr) {
    const a = UI.herActor;
    if (!a) return;
    if (EXPR_ANIM[expr]) a.anim = EXPR_ANIM[expr];
    else if (['cheer', 'love', 'cry', 'sleep'].includes(a.anim)) a.anim = 'idle';
    if (EXPR_EMOTE[expr]) UI.stage.emote(a, EXPR_EMOTE[expr], 2.2);
  };
  UI.npcActors = {};
  UI.npc = function (id, where = 'mentor') {
    const n = G.NPC[id];
    if (!n || !n.outfit) return null;
    const [x, y] = UI.stage.spot(where);
    const a = UI.stage.add({ id: 'npc_' + id, kind: 'npc', x, y, anim: 'idle', pal: G.Sprites.palette(n.look, n.outfit), cfg: { style: n.style, male: n.body === 'man' || n.body === 'boy', beard: n.beard }, clickable: true, npc: id });
    UI.npcActors[id] = a;
    return a;
  };
  UI.clearNpcs = function () {
    Object.values(UI.npcActors).forEach((a) => UI.stage.remove(a.id));
    UI.npcActors = {};
  };

  // bubble over an actor
  UI.bubble = function (actor, text, ms = 2600) {
    const b = $('#bubble');
    const wrap = $('.stage-wrap');
    const r = wrap.getBoundingClientRect();
    const cr = UI.stageCanvas.getBoundingClientRect();
    // account for object-fit: cover on phones
    const scale = Math.max(cr.width / G.World.W, cr.height / G.World.H);
    const offX = (cr.width - G.World.W * scale) / 2, offY = (cr.height - G.World.H * scale) / 2;
    b.style.left = offX + actor.x * scale + 'px';
    b.style.top = offY + (actor.y - 36) * scale + 'px';
    b.textContent = text;
    b.hidden = false;
    clearTimeout(UI._bt);
    UI._bt = setTimeout(() => (b.hidden = true), ms);
    void r;
  };
  UI.hideBubble = () => ($('#bubble').hidden = true);

  // ================================================================ toasts
  UI.toast = function (t) {
    const box = $('#toasts');
    if (!box) return;
    let text = '', cls = '';
    if (typeof t === 'string') text = t;
    else if (t.kind === 'stat') {
      const st = D.STATS.find((x) => x.id === t.stat);
      text = (t.d > 0 ? '+' : '') + t.d + ' ' + st.name;
    } else if (t.kind === 'bond') text = (t.d > 0 ? '♥ +' : '♥ ') + t.d + ' Bond';
    else if (t.kind === 'stress') text = (t.d > 0 ? '+' : '') + t.d + ' Stress';
    else if (t.kind === 'gold') text = (t.d > 0 ? '+' : '') + t.d + ' coins';
    else if (t.kind === 'learn') {
      text = '✦ You learned: ' + t.text;
      cls = 'learn';
    } else if (t.kind === 'photo') {
      text = '▣ Added to the album: ' + t.text;
      cls = 'learn';
    } else if (t.kind === 'town') {
      text = '☖ Around town: ' + t.text;
      cls = 'town';
    }
    if (!text) return;
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), cls === 'town' ? 8100 : 2900);
    while (box.children.length > 5) box.firstChild.remove();
  };
  UI.photo = function (p) {
    const f = document.createElement('div');
    f.className = 'flash';
    $('.stage-wrap').appendChild(f);
    setTimeout(() => f.remove(), 600);
    G.Audio.sfx('bell');
    UI.toast({ kind: 'photo', text: p.title || p.caption });
  };

  // ================================================================ season card & montage caption
  UI.seasonCard = function (s) {
    const sea = D.SEASONS[s.turn % 4];
    const el = document.createElement('div');
    el.className = 'season-card';
    el.innerHTML = `<div><div class="zh">${D.SEASON_ZH[sea]}</div><h2>${D.SEASON_NAME[sea]} · Year ${Math.floor(s.turn / 4) + 1}</h2><p>${esc(s.name)} is ${s.age}</p></div>`;
    $('.stage-wrap').appendChild(el);
    return new Promise((r) => setTimeout(() => {
      el.remove();
      r();
    }, 2100));
  };

  UI.caption = function (res, when, fast) {
    const box = $('#caption');
    const A = D.ACT[res.act] || { name: 'Rest', icon: 'moon' };
    const title = res.hobby ? 'Her own time' : A.name;
    const gains = Object.entries(res.gains || {}).filter(([, v]) => v).map(([k, v]) => `<span class="gain ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${D.STATS.find((x) => x.id === k).name}</span>`);
    if (res.stress) gains.push(`<span class="gain ${res.stress < 0 ? 'up' : 'down'}">${res.stress > 0 ? '+' : ''}${res.stress} Stress</span>`);
    if (res.gold) gains.push(`<span class="gain ${res.gold > 0 ? 'up' : 'down'}">${res.gold > 0 ? '+' : ''}${res.gold} coins</span>`);
    const outcome = res.outcome && !res.hobby && A.cat !== 'leisure' ? `<span class="outcome ${res.outcome}">${res.outcome === 'great' ? 'Great!' : res.outcome === 'poor' ? 'Rough' : 'Good'}</span>` : '';
    box.className = 'caption frame';
    box.innerHTML = `<div class="cap-ico">${icon(res.hobby ? 'sparkle' : A.icon)}</div><div><div class="cap-when">${esc(when)}${res.chosen ? ' · her choice' : ''}${res.forced ? ' · she didn\'t want to' : ''}</div><div class="cap-title">${esc(title)}${outcome}</div><p class="cap-text">${esc(res.text || '')}</p><div class="cap-gains">${gains.join('')}</div></div>`;
    box.hidden = false;
    return new Promise((r) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        box.hidden = true;
        box.onclick = null;
        r();
      };
      box.onclick = fin;
      setTimeout(fin, fast ? 1200 : 3000 + (res.text || '').length * 18);
    });
  };

  // ================================================================ status strip: her whole childhood at a glance
  UI.status = function (s) {
    const el = $('#status');
    if (!el) return;
    const pips = [];
    for (let t = 0; t < s.turns; t++) {
      const cls = t < s.turn ? 'done' : t === s.turn ? 'now' : '';
      pips.push(`<span class="pip ${cls} ${t % 4 === 3 ? 'qixi' : ''}" title="${D.SEASON_NAME[D.SEASONS[t % 4]]}, year ${Math.floor(t / 4) + 1}"></span>`);
    }
    const left = s.turns - s.turn;
    const news = G.Town ? G.Town.news(s) : '';
    el.innerHTML = `<div class="timeline-label">${s.phase === 'finale' ? 'Tonight is her eighteenth Qixi' : left <= 1 ? 'Her eighteenth Qixi is coming' : left + ' seasons until her eighteenth Qixi'}</div><div class="timeline">${pips.join('')}<span class="end">18</span></div><div class="minis">${D.STATS.map((st) => `<span class="mini" style="--c:${st.color}" title="${st.name}: ${s.stats[st.id]}"><span class="gl">${st.glyph}</span><span class="v">${s.stats[st.id]}</span></span>`).join('')}</div>${news ? `<div class="town"><span class="tag">Around town</span>${esc(news)}</div>` : ''}`;
  };

  // ================================================================ HUD
  UI.hud = function (s) {
    UI.status(s);
    const sea = D.SEASONS[s.turn % 4];
    const mood = M.mood(s);
    const intro = s.phase === 'intro' || s.phase === 'finale';
    $('#hud').innerHTML = `
      <div class="when"><span class="zh">${intro ? '夕' : D.SEASON_ZH[sea]}</span>${s.phase === 'finale' ? 'Her eighteenth Qixi' : intro ? 'Qixi night' : D.SEASON_NAME[sea] + ' · Year ' + (Math.floor(s.turn / 4) + 1)}</div>
      <div class="who">${esc(s.name)}, ${s.age} · ${M.MOOD_WORDS[mood.label]}</div>
      <div class="spacer"></div>
      <div class="meter" title="Bond">${icon('heart')}<span class="bar"><i style="width:${s.bond}%;--c:#e46a78"></i></span></div>
      <div class="meter" title="Stress">${icon('cloud')}<span class="bar"><i style="width:${s.stress}%;--c:${s.stress > 70 ? '#e0485e' : '#8f9ad8'}"></i></span></div>
      <div class="meter" title="Coins">${icon('coin')}<span>${s.gold}</span></div>
      <button class="hud-btn" type="button" data-hud="her" aria-label="Her" title="Her">${icon('person')}Her</button>
      <button class="hud-btn" type="button" data-hud="diary" aria-label="Diary" title="Diary">${icon('book')}Diary</button>
      <button class="hud-btn" type="button" data-hud="album" aria-label="Album" title="Album">${icon('album')}Album</button>
      <button class="hud-btn" type="button" data-hud="menu" aria-label="Menu" title="Menu">${icon('gear')}Menu</button>`;
  };

  // ================================================================ overlay sheets
  UI.sheet = function (title, html, onMount) {
    const ov = $('#overlay');
    ov.innerHTML = `<div class="sheet frame" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head"><h2>${esc(title)}</h2><button class="btn btn-ghost close" type="button" data-close>Close</button></div>${html}</div>`;
    ov.hidden = false;
    const close = () => {
      ov.hidden = true;
      ov.innerHTML = '';
      UI.sheetOpen = false;
      if (UI.onSheetClose) {
        const f = UI.onSheetClose;
        UI.onSheetClose = null;
        f();
      }
    };
    ov.querySelector('[data-close]').onclick = close;
    ov.onclick = (e) => {
      if (e.target === ov) close();
    };
    UI.sheetOpen = true;
    if (onMount) onMount(ov.querySelector('.sheet'), close);
    return close;
  };
  UI.closeSheet = () => {
    const b = document.querySelector('#overlay [data-close]');
    if (b) b.click();
  };
  UI.drawPortraitInto = function (canvas, opts) {
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(G.Portrait.render(opts), 0, 0);
  };

  // ---------------------------------------------------------------- profile
  UI.profile = function (s) {
    const mood = M.mood(s);
    const style = M.style(s);
    const stats = D.STATS.map((st) => `<div class="stat" style="--c:${st.color}"><span class="gl">${st.glyph}</span><span>${st.name}</span><span class="bar"><i style="width:${s.stats[st.id]}%"></i></span><span class="v">${s.stats[st.id]}</span><span class="rk">${D.rank(s.stats[st.id])} · ${esc(st.desc)}</span></div>`).join('');
    const traits = D.TRAITS.map((t) => {
      const known = s.known.traits[t.id];
      const pos = ((s.traits[t.id] + 100) / 200) * 100;
      return `<div class="slider ${known ? '' : 'unknown'}"><span>${t.lo}</span><span class="track"><span class="dot" style="left:${pos}%"></span></span><span class="r">${t.hi}</span></div>`;
    }).join('');
    const likes = Object.keys(s.known.likes).filter((id) => D.ACT[id]).sort((a, b) => s.aff[b] - s.aff[a]).map((id) => `<li>${esc(D.ACT[id].name)}: <span class="muted">${M.AFF_WORDS[M.affLevel(s.aff[id])]}</span></li>`).join('') || '<li class="muted">Try activities to find out.</li>';
    const favs = Object.keys(s.known.fav).map((k) => `<li>${esc({ food: 'Food', color: 'Color', animal: 'Animal', flower: 'Flower', fear: 'Afraid of', quirk: 'She' }[k])}: ${esc(s.fav[k])}</li>`).join('') || '<li class="muted">Talk with her to learn more.</li>';
    const facts = s.known.facts.map((f) => `<li>${esc(f)}</li>`).join('') || '<li class="muted">Nothing yet.</li>';
    const needs = D.NEEDS.filter((n) => n.id !== 'rest').map((n) => `<div class="need"><span>${n.name}</span><span class="bar"><i style="width:${s.needs[n.id]}%;--c:${s.needs[n.id] < 30 ? '#e0485e' : '#4f9a6a'}"></i></span></div>`).join('');
    const friend = (id, label) => `<div class="need"><span>${label}</span><span class="bar"><i style="width:${s.friends[id]}%;--c:#e6b64d"></i></span></div>`;
    const html = `
      <div class="grid2">
        <div class="box" style="align-items:center;text-align:center"><canvas class="px" id="prof-port" style="width:192px;height:192px;border:3px solid var(--ink);background:#e8d9b0"></canvas>
          <h3>${esc(s.name)}, ${s.age}</h3><p class="muted" style="margin:0">${M.MOOD_WORDS[mood.label]}${s.dream ? ' · dreams of being ' + esc(({ general: 'a general', swordswoman: 'a wandering hero', scholar: 'a scholar', astronomer: 'an astronomer', immortal: 'an immortal', physician: 'a physician', musician: 'a musician', dancer: 'a dancer', poet: 'a poet', princess: 'a princess', priestess: 'an abbess', teacher: 'a teacher', chef: 'a chef', merchant: 'a merchant', teahouse: 'a teahouse owner', farmer: 'a tea master', weaver: 'a weaver' })[s.dream] || s.dream) : ''}</p></div>
        <div class="box"><h3>Growth</h3>${stats}</div>
        <div class="box"><h3>Her heart</h3>
          <div class="need"><span>Bond</span><span class="bar"><i style="width:${s.bond}%;--c:#e46a78"></i></span></div>
          <div class="need"><span>Stress</span><span class="bar"><i style="width:${s.stress}%;--c:#8f9ad8"></i></span></div>
          <div class="need"><span>Confidence</span><span class="bar"><i style="width:${s.esteem}%;--c:#e6b64d"></i></span></div>
          ${needs}
          <p style="margin:4px 0 0">She trusts you <b>${M.trustWord(s)}</b>.</p>
          <p style="margin:0">How she sees you: <b>${style.name}</b><br><span class="muted">${style.desc}</span></p>
        </div>
        <div class="box"><h3>Who she is</h3>${traits}<p class="note">Traits reveal themselves as you get to know her.</p></div>
        <div class="box"><h3>What she likes</h3><ul class="list">${likes}</ul></div>
        <div class="box"><h3>Her favorite things</h3><ul class="list">${favs}</ul></div>
        <div class="box"><h3>Things you've learned</h3><ul class="list">${facts}</ul></div>
        <div class="box"><h3>Friends</h3>${friend('mei', 'Mei')}${friend('tao', 'Tao')}${s.flags.prince_met ? friend('prince', 'Jing') : ''}${s.friends.wanyin ? friend('wanyin', 'Wanyin') : ''}${s.flags.pet ? `<p style="margin:4px 0 0">Pet cat: <b>${esc(s.flags.pet)}</b></p>` : ''}</div>
      </div>`;
    UI.sheet('Her', html, (root) => UI.drawPortraitInto(root.querySelector('#prof-port'), herPortraitOpts(s, M.restingExpr(s))));
  };

  // ---------------------------------------------------------------- album
  UI.renderPhoto = function (canvas, p, s) {
    canvas.width = G.World.W;
    canvas.height = G.World.H;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    const bg = G.World.paintScene(p.scene, { season: p.season || 'spring', tod: p.tod || 'day', items: {}, magpies: false });
    g.drawImage(bg.canvas, 0, 0);
    const spot = (bg.info.spots && bg.info.spots.her) || [160, 150];
    const anims = G.Sprites.build({ style: s.style });
    const fr = (anims[p.anim] || anims.idle)[0];
    const pal = G.Sprites.palette(s.look, D.OUTFITS[p.outfit] || D.OUTFITS.everyday);
    G.PX.draw(g, G.Sprites.join(fr.rows), pal, spot[0] - 8, spot[1] - 32);
    (fr.props || []).forEach((pr) => {
      const ps = G.Sprites.PROPS[pr.name];
      if (ps) G.PX.draw(g, ps.join('\n'), G.Sprites.PROP_PAL, spot[0] - 8 + pr.x, spot[1] - 32 + pr.y);
    });
    (p.npcs || []).forEach((id, i) => {
      const n = G.NPC[id];
      if (!n || !n.outfit) return;
      const a = G.Sprites.build({ style: n.style, male: n.body === 'man' || n.body === 'boy', beard: n.beard }).idle[0];
      G.PX.draw(g, G.Sprites.join(a.rows), G.Sprites.palette(n.look, n.outfit), spot[0] + 20 + i * 18, spot[1] - 32, true);
    });
    if (p.tod === 'night') {
      g.fillStyle = 'rgba(18,22,62,0.35)';
      g.fillRect(0, 0, G.World.W, G.World.H);
    }
  };
  UI.album = function (s) {
    const list = s.album.slice().reverse();
    const html = list.length
      ? `<div class="album">${list.map((p, i) => `<figure class="photo" style="--r:${(i % 3) - 1}deg;margin:0"><canvas class="px" data-i="${s.album.length - 1 - i}"></canvas><b>${esc(p.title || '')}</b><small>Age ${p.age} · ${esc(p.caption || '')}</small></figure>`).join('')}</div>`
      : '<p class="muted">No photos yet. Special moments will be kept here.</p>';
    UI.sheet('Album', html, (root) => root.querySelectorAll('canvas[data-i]').forEach((c) => UI.renderPhoto(c, s.album[+c.dataset.i], s)));
  };

  // ---------------------------------------------------------------- diary
  UI.diaryPage = function (s, entry) {
    const open = entry.open;
    if (!open) return `<div class="locked-diary">${icon('lock')}<p>Her diary is locked now. She wears the key around her neck.</p><p class="note">When she trusts you enough, she may choose to share it.</p></div>`;
    const young = entry.age <= 14;
    return `<div class="diary ${young ? 'young' : 'old'}"><div class="d-date">${esc(entry.label)}</div>${entry.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
  };
  UI.diaryBook = function (s) {
    const book = (s.diaryBook || []).slice().reverse();
    const html = book.length ? book.map((e) => UI.diaryPage(s, e)).join('') : '<p class="muted">She hasn\'t written anything yet.</p>';
    UI.sheet(s.name + '\'s diary', `<div style="display:grid;gap:12px">${html}</div>`);
  };
})();
