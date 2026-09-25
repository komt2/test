/* Silver River — her mind. Temperament, needs, moods, memories, trust, self-esteem, tastes and voice.
   Everything she says or decides flows through here so she stays one consistent person. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = (G.Mind = {});

  // ---------------------------------------------------------------- creation
  M.create = function (startAge, parentBg) {
    const traits = {};
    D.TRAITS.forEach((t) => (traits[t.id] = Math.round(U.randf(-38, 38))));
    // two defining traits make each daughter distinct
    U.shuffle(D.TRAITS.map((t) => t.id)).slice(0, 2).forEach((id) => {
      traits[id] = (U.chance(0.5) ? 1 : -1) * U.randInt(55, 82);
    });
    const aff = {};
    D.ACTS.forEach((a) => {
      let v = 0;
      Object.entries(a.aff || {}).forEach(([k, w]) => (v += (traits[k] / 100) * w * 2.4));
      v += U.randf(-0.55, 0.55);
      aff[a.id] = U.clamp(v, -2, 2);
    });
    // a hidden passion and a hidden aversion, to be discovered
    const pool = D.ACTS.filter((a) => !['rest', 'free', 'play', 'journey'].includes(a.id)).map((a) => a.id);
    const passion = U.pick(pool);
    let aversion = U.pick(pool);
    if (aversion === passion) aversion = pool[(pool.indexOf(passion) + 3) % pool.length];
    aff[passion] = U.clamp(aff[passion] + 1.3, -2, 2);
    aff[aversion] = U.clamp(aff[aversion] - 1.2, -2, 2);
    aff.rest = 0.6;
    aff.play = U.clamp(0.5 + traits.playful / 150, -1, 2);
    aff.free = 1.2;
    const fav = {};
    Object.keys(D.FAV).forEach((k) => (fav[k] = U.pick(D.FAV[k])));
    return {
      traits,
      aff,
      passion,
      aversion,
      fav,
      needs: { fun: 70, love: 60, freedom: 70, pride: 50, friends: 50 },
      bond: startAge <= 11 ? 42 : startAge <= 13 ? 38 : 34,
      trust: 50,
      esteem: 50 + Math.round(traits.bold / 5),
      emotion: { kind: 'curious', amt: 40 },
      known: { traits: {}, likes: {}, fav: {}, facts: [] },
      memories: [],
      secrets: [],
      promises: [],
      dream: null,
      dreamHist: [],
      tried: {},
      forced: {},
    };
  };

  // ---------------------------------------------------------------- personality helpers
  M.band = (s) => (s.age <= 12 ? 'kid' : s.age <= 15 ? 'teen' : 'young');
  M.voice = function (s) {
    const t = s.traits;
    const sc = {
      sunny: t.bold * 0.6 + t.playful * 0.8 - t.fiery * 0.15,
      soft: -t.bold * 0.8 - t.fiery * 0.5 + 10,
      sassy: t.fiery * 0.9 + t.bold * 0.3 - t.diligent * 0.2,
      dreamy: t.dreamy * 1.0 - t.diligent * 0.1,
      earnest: t.diligent * 0.8 - t.playful * 0.5,
    };
    return Object.keys(sc).sort((a, b) => sc[b] - sc[a])[0];
  };
  M.addr = (s, cold) => (cold ? (s.parent.role === 'mom' ? 'Mother' : 'Father') : s.parent.address);
  M.affLevel = (v) => (v >= 1.2 ? 'love' : v >= 0.45 ? 'like' : v > -0.45 ? 'neutral' : v > -1.2 ? 'dislike' : 'hate');
  M.AFF_WORDS = { love: 'Loves it', like: 'Likes it', neutral: 'Doesn\'t mind it', dislike: 'Dislikes it', hate: 'Hates it' };

  // fill {P} {name} {act} {food} ... placeholders
  M.fill = function (s, text, vars = {}) {
    return String(text).replace(/\{(\w+)\}/g, (m, k) => {
      if (k in vars) return vars[k];
      if (k === 'P') return M.addr(s);
      if (k === 'Pc') return M.addr(s, true);
      if (k === 'name') return s.name;
      if (s.fav && k in s.fav) return s.fav[k];
      return m;
    });
  };
  // pick a line from a bank keyed by voice (and optionally age band)
  M.pick = function (s, bank, vars) {
    if (!bank) return '';
    if (typeof bank === 'string') return M.fill(s, bank, vars);
    if (Array.isArray(bank)) return M.fill(s, U.pick(bank), vars);
    const band = M.band(s);
    const v = M.voice(s);
    const opts = bank[v + '_' + band] || bank[v] || bank[band] || bank._;
    return M.pick(s, opts, vars);
  };

  // ---------------------------------------------------------------- needs & mood
  M.clampNeeds = (s) => Object.keys(s.needs).forEach((k) => (s.needs[k] = U.clamp(Math.round(s.needs[k]), 0, 100)));
  M.need = function (s, k, d) {
    s.needs[k] = U.clamp((s.needs[k] || 0) + d, 0, 100);
  };
  // seasonal drift: needs slowly empty and teenagers need more freedom
  M.seasonDecay = function (s) {
    const t = s.traits;
    M.need(s, 'fun', -10 - Math.max(0, t.playful) / 20);
    M.need(s, 'love', -7);
    M.need(s, 'freedom', -(3 + Math.max(0, s.age - 12) * 2 + Math.max(0, t.fiery) / 25));
    M.need(s, 'pride', -5);
    M.need(s, 'friends', -7 - Math.max(0, t.bold) / 25);
  };
  M.mood = function (s) {
    const n = s.needs;
    let score = (n.fun - 50) * 0.35 + (n.love - 50) * 0.45 + (n.freedom - 50) * 0.25 + (n.pride - 50) * 0.25 + (n.friends - 50) * 0.25 - Math.max(0, s.stress - 45) * 0.9 + (s.esteem - 50) * 0.2;
    if (s.emotion) {
      const e = s.emotion;
      const sign = { joy: 1, proud: 1, loved: 1, curious: 0.3, sad: -1, angry: -1, hurt: -1, scared: -0.8, lonely: -0.9, guilty: -0.6 }[e.kind] || 0;
      score += sign * e.amt * 0.4;
    }
    score = U.clamp(Math.round(score), -100, 100);
    const label = score > 45 ? 'radiant' : score > 15 ? 'happy' : score > -12 ? 'calm' : score > -38 ? 'low' : 'upset';
    return { score, label };
  };
  M.MOOD_WORDS = { radiant: 'Radiant', happy: 'Happy', calm: 'Calm', low: 'Low', upset: 'Upset' };
  M.restingExpr = function (s) {
    const m = M.mood(s);
    if (s.stress >= 75) return 'tired';
    if (s.emotion && s.emotion.amt > 40) {
      const map = { joy: 'happy', proud: 'determined', loved: 'love', sad: 'sad', angry: 'pout', hurt: 'sad', scared: 'worried', lonely: 'sad', guilty: 'worried', curious: 'thinking' };
      if (map[s.emotion.kind]) return map[s.emotion.kind];
    }
    return { radiant: 'happy', happy: 'happy', calm: 'neutral', low: 'sad', upset: 'pout' }[m.label];
  };
  M.feel = function (s, kind, amt) {
    if (!s.emotion || amt >= s.emotion.amt * 0.7) s.emotion = { kind, amt: U.clamp(amt, 0, 100) };
  };
  M.coolDown = function (s) {
    if (s.emotion) s.emotion.amt = Math.round(s.emotion.amt * 0.45);
  };

  // relationship
  // closeness is easy to lose and slow to earn once it is already high
  M.bond = function (s, d) {
    if (d > 0) d = Math.max(1, Math.round(d * (1 - s.bond / 135)));
    s.bond = U.clamp(s.bond + d, 0, 100);
    return d;
  };
  M.trust = (s, d) => (s.trust = U.clamp(s.trust + d, 0, 100));
  M.esteem = (s, d) => (s.esteem = U.clamp(s.esteem + d, 0, 100));
  M.parent = function (s, warmth, control) {
    s.parenting.warmth = U.clamp(s.parenting.warmth + warmth, -100, 100);
    s.parenting.control = U.clamp(s.parenting.control + control, -100, 100);
  };
  M.style = function (s) {
    const W = s.parenting.warmth, C = s.parenting.control;
    if (W >= 15 && C >= 15) return { id: 'lantern', name: 'The Steady Lantern', desc: 'Warm and firm. She always knows where she stands with you.' };
    if (W >= 15 && C <= -5) return { id: 'sky', name: 'The Open Sky', desc: 'Warm and free. You let her find her own way.' };
    if (W >= 15) return { id: 'willow', name: 'The Willow', desc: 'Warm and patient. You bend, but you don\'t break.' };
    if (W <= -5 && C >= 15) return { id: 'gate', name: 'The Iron Gate', desc: 'Strict and distant. She obeys, but she doesn\'t confide.' };
    if (W <= -5) return { id: 'mountain', name: 'The Far Mountain', desc: 'Present but distant. She is learning to rely on herself.' };
    return { id: 'river', name: 'The Quiet River', desc: 'Calm and steady. Still finding your rhythm together.' };
  };
  M.trustWord = (s) => (s.trust >= 80 ? 'with her whole heart' : s.trust >= 60 ? 'deeply' : s.trust >= 40 ? 'mostly' : s.trust >= 20 ? 'a little' : 'barely');

  // ---------------------------------------------------------------- memory & knowledge
  M.remember = function (s, m) {
    if (m.id && s.memories.some((x) => x.id === m.id)) return;
    s.memories.push(Object.assign({ turn: s.turn, age: s.age, weight: 5, val: 1, tags: [] }, m));
  };
  M.recall = function (s, filter) {
    const list = s.memories.filter((m) => !filter || (typeof filter === 'function' ? filter(m) : m.tags.includes(filter)));
    if (!list.length) return null;
    return list.map((m) => ({ m, sc: m.weight * (0.6 + 0.4 / (1 + (s.turn - m.turn) / 6)) })).sort((a, b) => b.sc - a.sc)[0].m;
  };
  M.learn = function (s, kind, key, text) {
    const k = s.known;
    if (kind === 'trait') {
      if (k.traits[key]) return false;
      k.traits[key] = true;
      return true;
    }
    if (kind === 'like') {
      if (k.likes[key]) return false;
      k.likes[key] = true;
      return true;
    }
    if (kind === 'fav') {
      if (k.fav[key]) return false;
      k.fav[key] = true;
      return true;
    }
    if (kind === 'fact') {
      if (k.facts.includes(text)) return false;
      k.facts.push(text);
      return true;
    }
    return false;
  };
  M.knows = (s, kind, key) => !!(s.known[kind === 'fav' ? 'fav' : kind === 'like' ? 'likes' : 'traits'] || {})[key];

  // ---------------------------------------------------------------- reactions to a planned activity
  const REACT = {
    love: {
      sunny: ['Yes! {act}! Best season ever!', 'Really? {act}? I could hug you!'],
      soft: ['Oh... {act}? Thank you. I really hoped for that.', 'Mm! I\'ll do my very best at {act}.'],
      sassy: ['Finally, something good.', '{act}? Okay, you\'re forgiven for everything.'],
      dreamy: ['{act}... I dreamed about it last night. It\'s a sign.', 'It\'s like you read my mind.'],
      earnest: ['Thank you. I\'ve been practicing for this.', 'I won\'t waste a single day of it.'],
    },
    like: {
      sunny: ['Ooh, fun!', 'Okay, okay, I like this one.'],
      soft: ['That sounds nice.', 'Okay. I like that one.'],
      sassy: ['Acceptable.', 'Fine. That one\'s actually good.'],
      dreamy: ['Mm, that could be lovely.', 'I wonder what I\'ll learn.'],
      earnest: ['Good. I can do this.', 'I\'ll work hard.'],
    },
    neutral: {
      sunny: ['Sure, why not!', 'Okay!'],
      soft: ['Okay.', 'Alright.'],
      sassy: ['Whatever you say.', 'Fine.', 'If I must.'],
      dreamy: ['Hmm? Oh. Okay.', 'If you think so.'],
      earnest: ['Understood.', 'I\'ll do it properly.'],
    },
    dislike: {
      sunny: ['Awww, do I have to?', 'Hmm... can we swap it for something fun?'],
      soft: ['...Okay. If you think it\'s good for me.', 'I\'ll try. I\'m not very good at it.'],
      sassy: ['Ugh. Seriously?', 'You know I don\'t like that, right?'],
      dreamy: ['That one makes my head feel gray.', '...Can I bring a book?'],
      earnest: ['I don\'t enjoy it. But I\'ll go.', 'If it\'s important, I\'ll do it.'],
    },
    hate: {
      sunny: ['Nooo! Not that one! Anything but that!', 'Please, please, please no.'],
      soft: ['...Do I have to? Really?', '(She looks at her shoes and says nothing.)'],
      sassy: ['Absolutely not. ...Fine. But I\'m sulking the whole time.', 'I\'d rather eat my own shoe.'],
      dreamy: ['I think that place is slowly eating my soul.', 'Every time I go there, a little flower inside me wilts.'],
      earnest: ['I\'ll go. But I want you to know I really, truly hate it.', 'I\'ll do it. Please don\'t ask me to smile.'],
    },
  };
  const NEW_BOLD = ['Something new? Let\'s go!', 'I\'ve never tried {act}! I bet I\'m amazing at it.'];
  const NEW_SHY = ['I\'ve never done that before... what if I\'m bad at it?', 'Um. Will there be a lot of people?'];
  const NEW_MID = ['I\'ve never tried {act}. Okay!', 'Something new, huh.'];
  const TIRED = ['I\'m so tired, {P}...', 'Can I please just sleep for a whole month first?', 'My eyes keep closing by themselves.'];
  const REST_YES = ['A whole month of rest? You\'re the best, {P}.', 'Sleep! Glorious sleep!', 'Thank you. I really needed that.'];
  const WORK = {
    sunny: ['Money! I\'ll buy something nice.', 'I\'ll earn my keep!'],
    soft: ['I\'ll work hard so we don\'t have to worry.', 'Okay. I\'ll be careful.'],
    sassy: ['Fine, but I keep the tips.', 'Child labor. Noted.'],
    dreamy: ['Maybe I\'ll meet someone interesting there.', 'Everyone who walks in has a story.'],
    earnest: ['I\'ll do an honest day\'s work.', 'I\'ll make you proud.'],
  };

  M.react = function (s, actId) {
    const A = D.ACT[actId];
    const vars = { act: A.name };
    if (actId === 'rest') return { expr: s.stress > 50 ? 'calm' : 'happy', emote: 'heart', text: M.pick(s, REST_YES) };
    if (actId === 'free') return { expr: 'joy', emote: 'sparkle', text: M.pick(s, { _: ['I get to choose? Really?', 'My own month! I already know what I\'ll do.'], sassy: ['Freedom! Finally.'], soft: ['Can I really? Thank you...'] }) };
    if (s.stress >= 72 && A.stress > 4 && U.chance(0.6)) return { expr: 'tired', emote: 'drop', text: M.pick(s, TIRED) };
    const tried = s.tried[actId];
    if (!tried) {
      const t = s.traits.bold;
      return { expr: t > 25 ? 'joy' : t < -25 ? 'worried' : 'thinking', emote: t < -25 ? 'drop' : 'sparkle', text: M.pick(s, t > 25 ? NEW_BOLD : t < -25 ? NEW_SHY : NEW_MID, vars) };
    }
    const lvl = M.affLevel(s.aff[actId]);
    if (A.cat === 'work' && (lvl === 'neutral' || lvl === 'like')) return { expr: 'determined', emote: null, text: M.pick(s, WORK) };
    const expr = { love: 'joy', like: 'happy', neutral: 'neutral', dislike: 'pout', hate: s.traits.fiery > 20 ? 'angry' : 'sad' }[lvl];
    const emote = { love: 'heart', like: 'note', neutral: null, dislike: 'drop', hate: 'drop' }[lvl];
    return { expr, emote, text: M.pick(s, REACT[lvl], vars), lvl };
  };

  // ---------------------------------------------------------------- what she wants
  M.wish = function (s, avail) {
    const n = s.needs;
    if (s.stress >= 70) return { id: 'rest', text: M.pick(s, { _: ['I\'m so worn out. Could I have a month to rest?'], sassy: ['I need a break before I snap. Just saying.'], soft: ['I\'m really tired lately... could I rest a little?'] }) };
    if (n.friends < 30 && avail.includes('play')) return { id: 'play', text: M.pick(s, { _: ['I haven\'t seen Mei in forever. Can we play this season?'], sassy: ['I have friends, you know. I\'d like to see them sometime.'], dreamy: ['I miss running around with Mei until the sun goes down.'] }) };
    if (n.freedom < 28 && avail.includes('free') && s.age >= 12) return { id: 'free', text: M.pick(s, { _: ['Could one month be mine? Just one?'], sassy: ['Could I maybe decide ONE thing myself this season?'], earnest: ['I\'d like to plan one month on my own. I\'ll use it well.'] }) };
    // otherwise the thing she loves most that she can do
    const opts = avail.filter((id) => !['rest', 'free', 'play'].includes(id) && s.tried[id] && s.aff[id] >= 0.8);
    if (!opts.length) {
      const curious = avail.filter((id) => !s.tried[id] && !['rest', 'free', 'play', 'journey'].includes(id));
      if (curious.length && s.traits.bold + s.traits.dreamy > 0 && U.chance(0.5)) {
        const id = U.pick(curious);
        return { id, text: M.pick(s, { _: ['What\'s {act} like? Could I try it?', 'Everyone at the market talks about {act}. Can I try?'] }, { act: D.ACT[id].name }) };
      }
      return null;
    }
    const id = opts.sort((a, b) => s.aff[b] - s.aff[a])[0];
    return { id, text: M.pick(s, { _: ['Can I do {act} this season? Please?', 'I really, really want to do {act} again!'], soft: ['If it\'s alright... could I do {act} again?'], sassy: ['{act}. This season. I\'m not asking. (Okay, I\'m asking.)'], dreamy: ['I keep thinking about {act}. Can I go back?'], earnest: ['I want to get better at {act}. May I continue?'] }, { act: D.ACT[id].name }) };
  };

  // ---------------------------------------------------------------- will she push back?
  M.protest = function (s, plan) {
    let worst = null;
    plan.forEach((id, i) => {
      if (!id || id === 'rest' || id === 'free') return;
      const a = s.aff[id];
      if (!s.tried[id] || a > -0.55) return;
      const forcedBefore = s.forced[id] || 0;
      let p = 0.12 + -a * 0.2 + (s.stress - 40) / 160 + Math.max(0, s.age - 11) * 0.035 + s.traits.fiery / 320 + (50 - s.needs.freedom) / 250 - s.bond / 300 + forcedBefore * 0.08 - (s.esteem < 30 ? 0.08 : 0);
      if (s.age <= 11) p *= 0.6;
      p = U.clamp(p, 0, 0.92);
      if (!worst || p > worst.p) worst = { slot: i, id, p };
    });
    if (!worst || !U.chance(worst.p)) return null;
    const id = worst.id;
    const reasons = [];
    if (s.stress >= 65) reasons.push('tired');
    if ((s.forced[id] || 0) >= 2) reasons.push('again');
    if (s.needs.freedom < 30) reasons.push('freedom');
    reasons.push('hate');
    return { slot: worst.slot, id, reason: reasons[0] };
  };
  M.protestLine = function (s, pr) {
    const act = D.ACT[pr.id].name;
    const R = {
      tired: { _: ['{P}, I can\'t do {act} this season. I\'m too tired. Please.'], sassy: ['I\'m exhausted and you want {act}? No. Just no.'] },
      again: { _: ['{act} again? I\'ve told you I hate it. You never listen.'], soft: ['I... I keep going to {act} and I keep hating it. Please don\'t make me again.'], sassy: ['{act}. AGAIN. Do you even hear me when I talk?'] },
      freedom: { _: ['You always decide everything. Can\'t I say no to {act} just once?'], sassy: ['Is there anything I\'m allowed to choose? Because it\'s not going to be {act}.'] },
      hate: { _: ['Please not {act}. I really, really hate it.'], soft: ['Um... could I not do {act}? It makes me feel awful.'], sassy: ['I am not doing {act}. I\'ll run away. I\'ll join a traveling opera troupe.'], dreamy: ['{act} makes the whole world go gray. Please pick something else.'], earnest: ['I\'ve tried {act}. I really have. It isn\'t for me.'] },
    };
    return M.pick(s, R[pr.reason], { act });
  };

  // ---------------------------------------------------------------- what she does with her own month
  M.chooseFree = function (s, avail) {
    const n = s.needs;
    if (s.stress > 60) return { kind: 'act', id: 'rest' };
    if (n.friends < 35) return { kind: 'act', id: 'play' };
    const loved = avail.filter((id) => D.ACT[id].cat === 'study' && s.tried[id] && s.aff[id] >= 0.8 && (D.ACT[id].cost || 0) <= s.gold);
    if (loved.length && U.chance(0.65)) return { kind: 'act', id: U.pick(loved) };
    const best = Object.keys(s.traits).sort((a, b) => s.traits[b] - s.traits[a])[0];
    const hob = D.HOBBIES.filter((h) => h.trait === best);
    return { kind: 'hobby', hobby: U.pick(hob.length ? hob : D.HOBBIES) };
  };

  // ---------------------------------------------------------------- living in the courtyard
  M.idle = function (s) {
    const m = M.mood(s);
    const list = [];
    if (s.stress >= 70) list.push(['sleep', 3], ['sit', 2]);
    if (m.label === 'upset' || m.label === 'low') list.push(['sit', 3], ['cry', m.label === 'upset' ? 1 : 0]);
    if (m.label === 'radiant' || m.label === 'happy') list.push(['dance', s.aff.dance > 0 ? 2 : 1], ['cheer', 1], ['love', 1]);
    if (s.needs.fun < 35) list.push(['kite', 1]);
    const top = Object.keys(s.aff).filter((id) => s.tried[id] && s.aff[id] > 0.8);
    const animOf = { martial: 'sword', academy: 'read', guqin: 'guqin', kitchen: 'cook', dance: 'dance', observatory: 'stars', temple: 'pray', silk: 'weave', tea: 'pick', medicine: 'pick' };
    top.forEach((id) => animOf[id] && list.push([animOf[id], 2]));
    list.push(['idle', 3], ['walk', 3]);
    const pick = U.weighted(list, (x) => x[1]);
    return pick ? pick[0] : 'idle';
  };

  // ---------------------------------------------------------------- her diary for the season
  M.diary = function (s, log) {
    const lines = [];
    const v = M.voice(s);
    const P = M.addr(s);
    const byOutcome = log.months.filter((x) => x.act);
    const best = byOutcome.slice().sort((a, b) => (s.aff[b.act] || 0) + (b.outcome === 'great' ? 1 : 0) - ((s.aff[a.act] || 0) + (a.outcome === 'great' ? 1 : 0)))[0];
    const worst = byOutcome.slice().sort((a, b) => (s.aff[a.act] || 0) - (s.aff[b.act] || 0))[0];
    const open = { sunny: 'Dear diary!!', soft: 'Dear diary,', sassy: 'Diary. Listen.', dreamy: 'Dear moon (and diary),', earnest: 'Diary entry.' }[v];
    lines.push(open);
    if (best && s.aff[best.act] > 0.4) {
      const act = D.ACT[best.act].name;
      lines.push(M.pick(s, { _: ['{act} was the best part. ' + (best.outcome === 'great' ? 'I was actually good today!' : 'I want to go back.')], sassy: ['{act} was fine. More than fine. Don\'t tell anyone.'], dreamy: ['At {act} I felt like the world opened a little window just for me.'], earnest: ['{act} went well. I am improving.'] }, { act }));
    }
    if (worst && s.aff[worst.act] < -0.5 && worst !== best) {
      const act = D.ACT[worst.act].name;
      lines.push(M.pick(s, { _: ['And {act}... ugh. I don\'t want to talk about it.'], soft: ['{act} was hard again. I tried not to cry.'], sassy: ['{act} is a crime against me personally.'], dreamy: ['{act} felt like walking through gray fog.'] }, { act }));
    }
    (log.diary || []).forEach((d) => lines.push(M.fill(s, d)));
    if (log.forced) lines.push(M.pick(s, { _: [P + ' made me go even though I said no. I\'m still upset.'], soft: ['I told ' + P + ' I didn\'t want to go. ' + P + ' made me anyway. Maybe ' + P + ' knows best. Maybe not.'], sassy: [P + ' overruled me. AGAIN. Noted. Remembered. Forever.'] }));
    if (log.listened) lines.push(M.pick(s, { _: [P + ' actually listened to me. That felt really nice.'], sassy: [P + ' listened to me for once. Weird. Good weird.'] }));
    if (log.outing) lines.push(M.fill(s, log.outing));
    if (log.wishMet) lines.push(M.pick(s, { _: ['And I got to do what I wished for!'], soft: [P + ' remembered what I wanted. I don\'t know why that made me so happy.'] }));
    const m = M.mood(s);
    const close = {
      radiant: { _: ['Today was a good day. All of them were.'], sassy: ['Life is suspiciously good right now.'] },
      happy: { _: ['I\'m happy. I think.'], dreamy: ['The stars look friendly tonight.'] },
      calm: { _: ['Nothing else to report.'], dreamy: ['The moon is half full. Me too.'] },
      low: { _: ['I feel a bit heavy lately.'], soft: ['I wish I could say what\'s wrong. I don\'t really know.'] },
      upset: { _: ['Everything is bad and nobody understands.'], sassy: ['Everything is terrible. Goodnight.'] },
    }[m.label];
    lines.push(M.pick(s, close));
    const sign = { sunny: '— ' + s.name + ' ☆', soft: '— ' + s.name, sassy: '— ' + s.name + ' (do NOT read this)', dreamy: '— ' + s.name + ', under the Silver River', earnest: '— ' + s.name }[v];
    lines.push(sign);
    return lines;
  };
})();
