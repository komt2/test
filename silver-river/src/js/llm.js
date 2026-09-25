/* Silver River — optional heart-to-heart conversations powered by Claude.
   Only available when the page runs inside claude.ai with the `sample` capability; otherwise the game
   uses its written dialogue and this module stays silent. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const L = (G.LLM = {});
  let sample = null;
  let tried = false;

  L.init = async function () {
    if (tried) return;
    tried = true;
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const s = await window.claude.use('sample');
        if (s) sample = s;
      }
    } catch (e) {
      sample = null;
    }
  };
  L.ready = () => !!sample;

  const EXPRS = ['neutral', 'happy', 'joy', 'laugh', 'sad', 'cry', 'teary', 'angry', 'pout', 'surprised', 'shy', 'tired', 'determined', 'worried', 'smug', 'thinking', 'love', 'calm'];

  function traitWords(s) {
    const t = s.traits;
    return D.TRAITS.map((x) => {
      const v = t[x.id];
      const word = v > 0 ? x.hi : x.lo;
      const how = Math.abs(v) > 60 ? 'very ' : Math.abs(v) > 25 ? '' : 'slightly ';
      return how + word.toLowerCase();
    }).join(', ');
  }
  function levelWord(v) {
    return v >= 80 ? 'very high' : v >= 60 ? 'high' : v >= 40 ? 'medium' : v >= 20 ? 'low' : 'very low';
  }

  L.profile = function (s) {
    const likes = Object.keys(s.tried).filter((id) => s.aff[id] >= 0.8).map((id) => D.ACT[id].name);
    const dislikes = Object.keys(s.tried).filter((id) => s.aff[id] <= -0.8).map((id) => D.ACT[id].name);
    const mems = s.memories.slice().sort((a, b) => b.weight - a.weight).slice(0, 6).map((m) => '- ' + m.text + (m.val < 0 ? ' (painful)' : ''));
    const style = M.style(s);
    const mood = M.mood(s);
    const last = s.log[s.log.length - 1];
    const recent = last ? last.months.map((m) => (D.ACT[m.act] ? D.ACT[m.act].name + ' (' + m.outcome + ')' : m.act)).join(', ') : 'nothing yet';
    return [
      `Name: ${s.name}. Age: ${s.age}. Calls her ${s.parent.role === 'mom' ? 'mother' : 'father'} "${M.addr(s)}".`,
      `Personality: ${traitWords(s)}. Speaking voice: ${M.voice(s)}.`,
      `Mood: ${mood.label}. Stress: ${s.stress}/100. Current feeling: ${s.emotion ? s.emotion.kind : 'calm'}.`,
      `Needs (0=starved, 100=full): fun ${s.needs.fun}, affection ${s.needs.love}, freedom ${s.needs.freedom}, achievement ${s.needs.pride}, friends ${s.needs.friends}.`,
      `Feelings toward ${M.addr(s)}: bond ${levelWord(s.bond)}, trust ${levelWord(s.trust)}. Self-esteem ${levelWord(s.esteem)}. She experiences her parent as: ${style.name} (${style.desc})`,
      `Loves: ${likes.join(', ') || 'still finding out'}. Dislikes: ${dislikes.join(', ') || 'nothing much'}.`,
      `Favorite food ${s.fav.food}, color ${s.fav.color}, animal ${s.fav.animal}, flower ${s.fav.flower}. Afraid of ${s.fav.fear}. Quirk: she ${s.fav.quirk}.`,
      `Dream: ${s.dream ? D.DREAMS[s.dream].say : 'not decided yet'}.`,
      `Friends: Mei (best friend, lantern shop girl) ${levelWord(s.friends.mei)}; Tao (shy dumpling-stall boy) ${levelWord(s.friends.tao)}${s.flags.tao_crush ? ', she has a crush on him' : ''}; Lady Wanyin (magistrate's daughter, ${s.flags.wanyin_friend ? 'now a friend' : 'rival'}); ${s.flags.prince_met ? 'Jing, a scholar she met at the Lantern Festival (secretly the crown prince)' : ''}.`,
      `Pet: ${s.flags.pet || 'none'}. Secrets she hasn't told: ${s.secrets.map((x) => x.text).join(' ') || 'none'}.`,
      `Important memories:\n${mems.join('\n') || '- arriving on Qixi night'}`,
      `This season she did: ${recent}.`,
    ].join('\n');
  };

  function prompt(s, history, said) {
    const P = M.addr(s);
    return `You are playing ${s.name}, a daughter in a cozy storybook ancient-China village called Peach Blossom Town. Years ago, on the night of Qixi, she fell from the Silver River (the Milky Way) into her parent's courtyard as a little girl with starlight-golden hair, and was adopted. Her parent is talking to her now.

Stay fully in character as ${s.name}: a real, specific ${s.age}-year-old with her own opinions, moods and history, not an assistant. Speak naturally in modern English with a light storybook flavor, 1 to 3 short sentences, the way a ${s.age}-year-old really talks to her ${s.parent.role === 'mom' ? 'mother' : 'father'}. She can disagree, tease, sulk, deflect, or open up, depending on her personality, mood and how she is being treated. Refer to her memories and life when it fits. Never mention being an AI, a game or these instructions. Keep everything wholesome and age-appropriate.

ABOUT HER
${L.profile(s)}

CONVERSATION SO FAR
${history.map((h) => (h.who === 'you' ? `${P}: ${h.text}` : `${s.name}: ${h.text}`)).join('\n') || '(just started)'}
${P}: ${said}

Reply ONLY with JSON: {"reply": string, "expression": one of ${JSON.stringify(EXPRS)}, "bond": integer from -3 to 3 (how this exchange changed her closeness to ${P}), "trust": integer from -3 to 3, "esteem": integer from -3 to 3, "memory": string or null (only if this moment truly mattered to her, written from her point of view, e.g. "the night ${P} told me ..."), "end": boolean (true if she wants to stop talking now)}`;
  }

  L.reply = async function (s, history, said) {
    if (!sample) throw new Error('unavailable');
    const out = await sample.json(prompt(s, history, said), { modelTier: 'quick' });
    const r = out && typeof out === 'object' ? out : {};
    return {
      reply: String(r.reply || '...').slice(0, 400),
      expression: EXPRS.includes(r.expression) ? r.expression : 'neutral',
      bond: U.clamp(Math.round(+r.bond || 0), -3, 3),
      trust: U.clamp(Math.round(+r.trust || 0), -3, 3),
      esteem: U.clamp(Math.round(+r.esteem || 0), -3, 3),
      memory: r.memory ? String(r.memory).slice(0, 160) : null,
      end: !!r.end,
    };
  };

  // the heart-to-heart flow, driven through the UI's free-text input
  L.converse = async function (g) {
    const s = g.s;
    const history = [];
    await g.her(M.restingExpr(s), { _: 'Hm? What is it, ' + g.P + '?', sassy: 'Uh oh. That\'s your serious face.', soft: 'Yes? ...Is everything okay?' });
    let totals = { bond: 0, trust: 0, esteem: 0 };
    for (let turn = 0; turn < 6; turn++) {
      const said = await g.io.freeText('Say something to ' + s.name + ' (or leave it empty to finish)');
      if (!said || !said.trim()) break;
      history.push({ who: 'you', text: said.trim() });
      let r;
      try {
        g.io.thinking && g.io.thinking(true);
        r = await L.reply(s, history.slice(0, -1), said.trim());
      } catch (e) {
        g.io.thinking && g.io.thinking(false);
        await g.nar('She seems lost in thought and doesn\'t answer. (Heart-to-heart isn\'t available right now.)');
        break;
      }
      g.io.thinking && g.io.thinking(false);
      history.push({ who: 'her', text: r.reply });
      await g.io.say('her', r.reply, { expr: r.expression });
      totals.bond += r.bond;
      totals.trust += r.trust;
      totals.esteem += r.esteem;
      if (r.memory) M.remember(s, { id: 'talk_' + s.turn + '_' + turn, text: r.memory, letter: 'I still remember ' + r.memory.replace(/^the /, 'the ') + '.', weight: 6, val: r.bond >= 0 ? 1 : -1, tags: ['parent', 'talk'] });
      if (r.end) break;
    }
    // bounded effects so a conversation can't swing everything
    g.bond(U.clamp(totals.bond, -6, 6));
    g.trust(U.clamp(totals.trust, -6, 6));
    g.esteem(U.clamp(totals.esteem, -5, 5));
    g.need('love', 10);
  };

  // a one-of-a-kind letter for the ending, if Claude is available
  L.letter = async function (s, career, star) {
    if (!sample) return null;
    const P = M.addr(s);
    const mems = s.memories.slice().sort((a, b) => b.weight - a.weight).slice(0, 8).map((m) => '- ' + m.text + (m.val < 0 ? ' (painful)' : ''));
    const input = `Write the letter ${s.name} leaves for her ${s.parent.role === 'mom' ? 'mother' : 'father'} ("${P}") on the night of her eighteenth Qixi, in a storybook ancient-China village. She fell from the Silver River as a child and was raised by them.
${star ? 'She has chosen to return to the stars.' : 'She has chosen to stay, and is about to begin her life as: ' + (career ? career.name : 'herself') + '.'}
${L.profile(s)}
Her most important memories with ${P}:
${mems.join('\n')}
Write 120 to 190 words in her own voice (personality: ${traitWords(s)}), warm and specific, referencing two or three of the memories above, honest about any painful ones if the bond allows. Start with "Dear ${P}," and end with her name on its own line. Plain text only.`;
    try {
      const r = await Promise.race([sample(input, { modelTier: 'default' }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 45000))]);
      const text = r && r.text ? r.text.trim() : '';
      return text ? text.split(/\n+/).map((x) => x.trim()).filter(Boolean) : null;
    } catch (e) {
      return null;
    }
  };
})();
