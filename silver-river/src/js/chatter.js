/* Silver River — her everyday voice: what she says when you tap her, while she potters about,
   and in the planner. Lines depend on her mood, speaking voice, age, the season, her favourite
   things, friends, pet, dream and what has been happening. Mentioning a favourite teaches it to you. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const D = G.D;
  const M = G.Mind;
  const C = (G.Chatter = {});

  const pickArr = (a) => a[Math.floor(Math.random() * a.length)];
  const season = (s) => D.SEASONS[s.turn % 4];

  const DREAM_SHORT = {
    general: 'lead an army with my own banner', swordswoman: 'wander the rivers and lakes, righting wrongs', scholar: 'come first in the imperial exam',
    astronomer: 'find out where the stars come from', immortal: 'ride a cloud like the immortals', physician: 'heal people who have no one else',
    musician: 'play guqin for a thousand people', dancer: 'dance in the Pear Garden', poet: 'write a poem people still read in a hundred years',
    princess: 'wear a crown. A small one is fine', priestess: 'keep the lamps lit at the Cloud Temple', teacher: 'teach little kids to read',
    chef: 'open a restaurant people travel for days to reach', merchant: 'run a trading house with ships and everything', teahouse: 'have my own teahouse full of travelers',
    farmer: 'grow tea on a whole mountain', weaver: 'weave silk so fine it looks like water',
  };
  const FLOWER_SEASON = { 'peach blossoms': 'spring', orchids: 'spring', peonies: 'spring', lotus: 'summer', chrysanthemums: 'autumn', 'plum blossoms': 'winter' };
  const QUIRK_LINES = {
    'hums when she concentrates': '♪ Hm hm hmm... Oh! Were you listening? How long were you listening?',
    'names every stray cat in town': 'I met a new cat today. I named him General Whiskers the Third.',
    'collects smooth river stones': 'Look! This one is perfectly round. It\'s going in the collection.',
    'talks to the moon before bed': 'I told the moon about my day last night. She agreed with me.',
    'draws tiny stars on everything': 'I drew a tiny star on your teacup. You\'re welcome.',
    'sneaks extra sugar into her tea': 'I did NOT put four sugars in my tea. It was three. Ish.',
    'reads by candlelight long after bedtime': 'I only read ONE more chapter last night. And then one more. And then...',
  };

  // --------------------------------------------------------------- when you tap her
  const MOOD = {
    radiant: {
      sunny: ['Hi hi hi! What are we doing? Can I help?', 'Guess what! No, guess! ...Okay, I forgot what.', 'I\'m in SUCH a good mood today.', 'Race you to the gate! Go!'],
      soft: ['(She smiles and hides it behind her sleeve.)', 'I like days like this. Quiet and warm.', 'I made you a paper crane. It\'s a bit lopsided.'],
      sassy: ['Yes? I\'m very busy being delightful.', 'I\'m in a good mood. Enjoy it while it lasts.', 'You can admire me from over there.'],
      dreamy: ['Do you think clouds get tired of floating?', 'I was talking to the sparrows. They had opinions.', 'If I squint, the roof looks like a sleeping dragon.'],
      earnest: ['I finished all my reading already! Should I do more?', 'I\'ve been practicing. Want to see?', 'I made a plan for the week. It has columns.'],
    },
    happy: {
      _: ['Hm? Oh, hi {P}!', 'Want to hear a secret? ...Never mind!', 'Did you need me, {P}?'],
      sunny: ['{P}! Hi! Hello! Hi!', 'Is it snack time? It feels like snack time.'],
      soft: ['Oh! Hello, {P}.', 'Did you want something? I can help.'],
      sassy: ['If this is about the missing buns, I have an alibi.', 'You again? Fine. I\'m glad. Don\'t tell anyone.'],
      dreamy: ['Sometimes I hear the river singing. Is that strange?', 'I was imagining a city made of lanterns.'],
      earnest: ['Is there anything I can help with, {P}?', 'I tidied the brushes by size. And then by color.'],
    },
    calm: {
      _: ['Mm?', 'Hi, {P}.', 'Just thinking.', 'Hm? Oh, it\'s you.'],
      sassy: ['Can I help you?', 'I\'m thinking. It\'s a whole process.'],
      dreamy: ['Shh. I\'m listening to the wind.', 'I was somewhere far away just now.'],
    },
    low: {
      _: ['...I\'m okay.', '(She leans against you for a moment.)', 'Can you stay here a bit?', 'It\'s nothing. Really.'],
      sassy: ['I\'m fine. Totally fine. Extremely fine.', 'Don\'t look at me like that.'],
      soft: ['(She doesn\'t look up, but she doesn\'t move away either.)'],
      dreamy: ['Everything feels gray today.'],
    },
    upset: {
      _: ['Not now.', 'Hmph.', '(She turns away.)', 'I don\'t want to talk.'],
      sassy: ['Oh, NOW you want to talk.', 'Go away. ...Not that far.'],
      soft: ['(Her eyes are red. She pretends they aren\'t.)'],
    },
  };
  const BAND = {
    kid: ['{P}! {P}! Look, a beetle!', 'Can I have a snack? A small one? A medium one?', 'Carry me? Just to the door?', 'I can almost reach the top shelf now. Almost.'],
    teen: ['Can I go to Mei\'s later?', 'I\'m not a little kid anymore, you know.', 'Please don\'t hover.', 'You wouldn\'t understand. ...Okay, maybe you would.'],
    young: ['Sit with me a minute?', 'You look tired. Let me make the tea tonight.', 'Do you ever miss when I was small? Be honest.'],
  };
  const SEASON_LINES = {
    spring: ['The swallows are back! They\'re building a nest over the gate!', 'Spring smells like wet earth and peach blossoms.', 'Can we fly a kite this spring? A dragon one?'],
    summer: ['It\'s too hot to exist. Can we have cold mung bean soup?', 'The cicadas are so loud I can\'t hear myself think.', 'I\'m going to lie on the cool stones until autumn.'],
    autumn: ['The osmanthus smells like honey. I want to bottle it.', 'Mooncakes soon. Just saying. Loudly.', 'The persimmons are almost ripe. I\'m keeping an eye on them.'],
    winter: ['My hands are frozen. Feel. FEEL.', 'Can we roast chestnuts tonight? Please please please?', 'I made a snow rabbit. It\'s melting. It\'s tragic.'],
  };

  // candidates: [weight, text, learn?]
  function tapCandidates(s) {
    const out = [];
    const m = M.mood(s).label;
    const add = (w, text, learn) => text && out.push([w, text, learn]);
    add(5, M.pick(s, MOOD[m] || MOOD.calm));
    if (m === 'upset' || (m === 'low' && Math.random() < 0.6)) return out;
    add(1.4, pickArr(BAND[M.band(s)]));
    add(1.2, pickArr(SEASON_LINES[season(s)]));
    if (s.stress >= 65) add(3, pickArr(['So... tired...', '(She yawns so hard her little ahoge wobbles.)', 'Can I just sleep until next year?']));
    const f = s.fav;
    if (f) {
      add(0.9, 'Can we have ' + f.food + ' tonight? Pretty please?', { key: 'food', text: 'Favorite food: ' + f.food });
      if (FLOWER_SEASON[f.flower] === season(s)) add(1.6, 'The ' + f.flower + ' are out! Those are my favorite, you know.', { key: 'flower', text: 'Favorite flower: ' + f.flower });
      add(0.5, 'If I could be any animal, I\'d be one of the ' + f.animal + '. Obviously.', { key: 'animal', text: 'Favorite animal: ' + f.animal });
      add(0.4, 'When I\'m grown up, everything I own will be ' + f.color + '.', { key: 'color', text: 'Favorite color: ' + f.color });
      if (QUIRK_LINES[f.quirk]) add(0.8, QUIRK_LINES[f.quirk], { key: 'quirk', text: 'She ' + f.quirk + '.' });
    }
    if (s.flags.pet) add(1.2, pickArr([s.flags.pet + ' stole my hair ribbon again. I\'m filing a complaint.', s.flags.pet + ' likes you best. Don\'t tell me. I know.', 'Have you seen ' + s.flags.pet + '? On the roof one minute, gone the next.']));
    if (s.friends.mei >= 40) add(0.9, pickArr(['Mei says hi! Well, she said "tell your ' + M.addr(s) + ' hi." Same thing.', 'Mei and I are making a secret language. You can\'t learn it. Sorry.']));
    if ((s.flags.tao_crush || s.flags.tao_love) && s.age >= 13) add(0.9, pickArr(['Tao? Who\'s Tao? Never heard of him. Why are you smiling?', 'Tao gave me an extra bun today. It doesn\'t MEAN anything.']));
    if (s.flags.wanyin_friend) add(0.5, 'Wanyin and I are going to the lake later. Don\'t tell her father. Or do. She\'d like that, actually.');
    if (s.dream && DREAM_SHORT[s.dream]) add(1, M.pick(s, { _: 'One day I\'m going to ' + DREAM_SHORT[s.dream] + '. You\'ll see.', soft: 'Do you really think I could ' + DREAM_SHORT[s.dream] + ' someday?', sassy: 'Future me is going to ' + DREAM_SHORT[s.dream] + '. Future me is very impressive.' }));
    if (s.star >= 5) add(0.8, pickArr(['Sometimes at night the stars feel... closer. Is that weird?', 'I dreamt about the river again. It was calling my name.']));
    if (s.flags.fight && !s.flags.fight_resolved) add(3, '(She pretends she doesn\'t see you.)');
    return out;
  }
  let lastTap = '';
  C.tap = function (s) {
    let cands = tapCandidates(s).filter((c) => c[1] !== lastTap);
    if (!cands.length) cands = tapCandidates(s);
    const tot = cands.reduce((a, c) => a + c[0], 0);
    let r = Math.random() * tot, pick = cands[0];
    for (const c of cands) if ((r -= c[0]) <= 0) { pick = c; break; }
    lastTap = pick[1];
    return { text: M.fill(s, pick[1]), learn: pick[2] || null };
  };

  // --------------------------------------------------------------- while she potters about
  const IDLE = {
    sword: { _: ['Hyah! Hyah!', 'One more form...', 'Left foot... right foot... spin!'], sassy: ['Master Gao would say my elbow is lazy. My elbow is FINE.'], earnest: ['Again. Slower this time. Again.'] },
    read: { _: ['Hmm, hmm...', '"The superior person..." wait, what?'], dreamy: ['This poem is about the moon. They\'re all about the moon.'], earnest: ['I\'m going to memorize this whole page. Watch.'] },
    guqin: { _: ['♪ ~', '♪ ♪'], soft: ['(A soft, careful melody drifts across the yard.)'] },
    cook: { _: ['Smells good!', 'Just a pinch more salt...'], sassy: ['If it burns, it\'s called "smoky." That\'s a flavor.'] },
    dance: { _: ['♪ Turn, turn, step ~', 'La la la ~'], dreamy: ['(She dances with her shadow.)'] },
    stars: { _: ['I think I see my star.'], dreamy: ['Hello up there. It\'s me. Still down here.'] },
    pray: { _: ['...'] },
    sleep: { _: ['Zzz...', 'Zzz... five more minutes... zzz...'] },
    sit: { _: ['What a nice day.', 'Mm. Warm stones.'] },
    cry: { _: ['(sniff)'] },
    kite: { _: ['Higher! Higher!', 'Don\'t you dare get stuck in the tree again!'] },
    cheer: { _: ['Hehe!', 'Yes!'] },
    love: { _: ['♥'] },
  };
  C.idle = function (s, what) {
    const P = M.addr(s);
    // what's on her mind: something that happened recently
    const recent = s.memories.filter((m) => m.turn >= s.turn - 2 && m.weight >= 5 && m.text && !/^[A-Z]/.test(m.text));
    if (recent.length && Math.random() < 0.18) {
      const m = pickArr(recent);
      return m.val < 0 ? M.pick(s, { _: '...I\'m still thinking about ' + m.text + '.', sassy: 'Not that I\'m still mad about ' + m.text + '. I\'m not. Totally not.' }) : M.pick(s, { _: 'Hehe... ' + m.text + '...', soft: '(She smiles to herself, thinking about ' + m.text + '.)', dreamy: 'I keep replaying ' + m.text + ' in my head.' });
    }
    if (s.flags.pet && Math.random() < 0.15) return s.flags.pet + ', come back here!';
    if (s.stress > 75 && Math.random() < 0.3) return 'So tired... ' + P + '...';
    if (what === 'sit' && M.mood(s).label === 'low') return '...';
    const bank = IDLE[what];
    return bank ? M.pick(s, bank) : null;
  };

  // --------------------------------------------------------------- the planner, when she has no wish
  // chosen once per season so it doesn't change every time the planner redraws
  C.planner = function (s) {
    if (s.chatter && s.chatter.turn === s.turn) return s.chatter.text;
    const sea = season(s);
    const opts = [
      [3, M.pick(s, { _: ['I\'m happy with whatever you plan, {P}!'], sunny: ['I\'m happy with whatever you plan, {P}!', 'Ooh, what are we doing? Something fun? Say something fun.'], sassy: ['Surprise me. But not with etiquette.', 'Plan whatever you like. If it\'s etiquette again, I\'m moving to the temple.'], soft: ['Whatever you think is best...', 'I\'ll do my best, whatever it is.'], dreamy: ['I wonder what this season will bring.', 'I dreamt about a white crane last night. That\'s a good sign, right?'], earnest: ['I\'m ready to work hard this season.', 'I wrote down three things I want to get better at. It\'s a long list of three things.'] })],
      [1.5, { spring: 'It\'s spring! Everything\'s starting over. Let\'s start something new too.', summer: 'Whatever we do this summer, can there please be shade?', autumn: 'Scholar Wen says autumn is for studying. I say autumn is for persimmons.', winter: 'Can we do something warm this season? My toes are icicles.' }[sea]],
    ];
    if (M.band(s) === 'young') opts.push([1.5, s.turns - s.turn <= 4 ? 'Only a few seasons until Qixi. Let\'s make them count, okay?' : 'I can plan my own months now, you know. But I like it when we plan together.']);
    if (M.band(s) === 'teen') opts.push([1, 'Can I have a little say this time? Just a little.']);
    if (s.dream && DREAM_SHORT[s.dream]) opts.push([1, 'Anything that helps me ' + DREAM_SHORT[s.dream].split('.')[0] + ' someday. Please?']);
    if (s.bond >= 75) opts.push([1, 'As long as we have dinner together, I don\'t mind what we do.']);
    if (s.bond < 30) opts.push([2, 'Do what you want. You always do.']);
    const tot = opts.reduce((a, c) => a + c[0], 0);
    let r = Math.random() * tot, text = opts[0][1];
    for (const [w, t] of opts) if ((r -= w) <= 0) { text = t; break; }
    text = M.fill(s, text);
    s.chatter = { turn: s.turn, text };
    return text;
  };
})();
