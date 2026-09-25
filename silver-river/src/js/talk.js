/* Silver River — conversations, outings, festivals, birthdays, journeys, protests and the finale. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const T = (G.Talk = {});
  const season = (s) => D.SEASONS[s.turn % 4];

  // ---------------------------------------------------------------- talk topics
  T.topics = function (s) {
    const list = [
      { id: 'how', label: 'How are you feeling?' },
      { id: 'lessons', label: 'How are your lessons going?' },
      { id: 'dream', label: 'What do you dream of becoming?' },
      { id: 'praise', label: 'Tell her you\'re proud of her' },
      { id: 'favorite', label: 'Ask about her favorite things' },
      { id: 'friends', label: 'Ask about her friends' },
      { id: 'past', label: 'Tell her about your past' },
      { id: 'sit', label: 'Just sit together quietly' },
    ];
    if (G.LLM && G.LLM.ready()) list.unshift({ id: 'heart', label: 'Heart-to-heart (say anything)', special: true });
    return list;
  };

  T.run = async function (id, g) {
    const s = g.s;
    s.talkCount = (s.talkCount || 0) + 1;
    await g.scene('home', { tod: 'dusk' });
    if (id === 'heart') return G.LLM.converse(g);
    if (id === 'how') return how(g);
    if (id === 'lessons') return lessons(g);
    if (id === 'dream') return dream(g);
    if (id === 'praise') return praise(g);
    if (id === 'favorite') return favorite(g);
    if (id === 'friends') return friends(g);
    if (id === 'past') return past(g);
    if (id === 'sit') return sit(g);
  };

  async function how(g) {
    const s = g.s;
    const m = M.mood(s);
    const worst = Object.keys(s.needs).sort((a, b) => s.needs[a] - s.needs[b])[0];
    const low = s.needs[worst] < 35;
    if (s.stress >= 70) {
      await g.her('tired', { _: 'Honestly? I\'m exhausted. My head feels full of sand.', sassy: 'I\'m a husk. A very tired husk.', soft: 'I\'m okay... just really, really tired.' });
    } else if (m.label === 'radiant' || m.label === 'happy') {
      await g.her('happy', { _: 'I\'m good! Really good, actually.', sunny: 'Great! Amazing! Ask me again tomorrow, I\'ll probably still be great!', sassy: 'Suspiciously good. Don\'t jinx it.', dreamy: 'Like a lantern floating on the river.' });
    } else if (low) {
      const lines = {
        fun: { _: 'I\'m bored. Everything is lessons. I can\'t remember the last time I just played.' },
        love: { _: 'I don\'t know... I kind of miss you. Even though you\'re right here. Is that weird?', sassy: 'I don\'t know. We never just talk anymore.' },
        freedom: { _: 'I feel like everyone decides everything for me. Like I\'m a kite and someone else holds the string.' },
        pride: { _: 'I\'m not good at anything. Everyone else is better than me at everything.' },
        friends: { _: 'I\'m lonely, I guess. I haven\'t seen Mei in ages.' },
      };
      await g.her(worst === 'pride' || worst === 'love' ? 'sad' : 'pout', lines[worst]);
      const c = await g.choose(['Hug her.', 'Promise to change something.', 'Make a joke to cheer her up.']);
      if (c === 0) { g.need('love', 18); g.bond(4); g.parent(4, 0); await g.her('teary', '...Thanks, ' + g.P + '.'); }
      if (c === 1) {
        const fix = { fun: 'more free time', love: 'more time together', freedom: 'more say in her plans', pride: 'to notice what she does well', friends: 'more time with Mei' }[worst];
        g.promise({ id: 'fix_' + worst + '_' + s.turn, text: fix, due: s.turn + 2, need: worst, level: s.needs[worst] + 20 });
        g.trust(3);
        await g.her('thinking', 'You promise? ...Okay. I\'ll hold you to it.');
      }
      if (c === 2) { if (s.traits.playful > -10) { g.need('fun', 10); g.bond(2); await g.her('laugh', 'That was so bad. ...Tell it again.'); } else { await g.her('neutral', '...Ha. Ha.'); } }
    } else {
      await g.her('neutral', { _: 'I\'m okay. Just normal okay.', dreamy: 'Like a cloud. Not happy, not sad. Just floating.' });
    }
    g.need('love', 5);
    if (!s.known.traits.fiery && s.talkCount >= 2) g.learn('trait', 'fiery', s.traits.fiery > 0 ? 'She has a fiery temper, and a quick one.' : 'She is gentle, even when she\'s upset.');
  }

  async function lessons(g) {
    const s = g.s;
    const tried = Object.keys(s.tried).filter((id) => !['rest', 'free'].includes(id));
    if (!tried.length) return g.her('thinking', 'I haven\'t really started anything yet!');
    const best = tried.sort((a, b) => s.aff[b] - s.aff[a])[0];
    const worst = tried[tried.length - 1];
    await g.her('happy', { _: 'My favorite is ' + D.ACT[best].name + '. I could do it every day.', sassy: D.ACT[best].name + ' is the only one worth anything.', earnest: 'I enjoy ' + D.ACT[best].name + ' the most. I feel like I\'m growing.' });
    g.learn('like', best);
    if (worst !== best && s.aff[worst] < -0.4) {
      await g.her('pout', { _: 'And ' + D.ACT[worst].name + '... I really don\'t like it.', sassy: D.ACT[worst].name + ' should be illegal.' });
      g.learn('like', worst);
    }
    if (!s.known.traits.diligent) g.learn('trait', 'diligent', s.traits.diligent > 0 ? 'She works hard even when nobody is watching.' : 'She\'s a free spirit. Routines make her restless.');
  }

  async function dream(g) {
    const s = g.s;
    if (!s.dream) {
      await g.her('thinking', { _: 'I don\'t know yet. Is that bad?', dreamy: 'I dream about a lot of things. Mostly flying.', sassy: 'Ask me when I\'m older.' });
      const c = await g.choose(['"Not at all. Take your time."', '"You should start thinking about it."']);
      if (c === 0) { g.trust(2); g.esteem(1); }
      else g.parent(0, 2);
      return;
    }
    await g.her('determined', D.DREAMS[s.dream].say);
    const c = await g.choose(['"You\'ll get there. I know it."', '"Tell me what you need to get there."']);
    if (c === 0) { g.esteem(3); g.bond(1); }
    else { g.trust(3); const act = Object.keys(D.ACT_DREAM).find((k) => D.ACT_DREAM[k] === s.dream && G.Sim.canDo(s, D.ACT[k]).ok); if (act) await g.her('happy', 'More ' + D.ACT[act].name + '. Lots more!'); }
    g.learn('fact', 'dream', 'Her dream: ' + D.DREAMS[s.dream].say);
  }

  async function praise(g) {
    const s = g.s;
    const recent = (s.log[s.log.length - 1] || { months: [] }).months;
    const great = recent.some((m) => m.outcome === 'great');
    const n = (s.praised || 0);
    s.praised = n + 1;
    if (s.lastPraise === s.turn - 1 && !great) {
      await g.her('thinking', { _: 'You said that last time too. Did something happen?', sassy: 'Okay, who replaced my parent?' });
      g.need('love', 3);
    } else if (s.esteem < 35) {
      await g.her('teary', { _: 'Really? Even though I\'m not good at anything?', sassy: '...You don\'t have to say that. (Her voice cracks.)' });
      const c = await g.choose(['"Especially then."', '"You\'re better than you think."']);
      g.esteem(c === 0 ? 8 : 6); g.bond(4); g.need('love', 12);
      if (c === 0) g.remember({ id: 'praise_low', text: 'when you said you were proud of me especially then', letter: 'When I felt useless, you told me you were proud of me "especially then". I didn\'t understand it at the time. I say it to my own students now.', weight: 7, val: 1, tags: ['parent', 'esteem'] });
    } else {
      await g.her(great ? 'joy' : 'shy', { _: great ? 'Hehe. I was pretty great, wasn\'t I?' : 'Oh! Um. Thank you...', sassy: 'I know. But thank you for noticing.' });
      g.esteem(great ? 4 : 2); g.bond(2); g.need('love', 8); g.need('pride', 6);
    }
    s.lastPraise = s.turn;
    g.parent(3, 0);
  }

  async function favorite(g) {
    const s = g.s;
    const unknown = ['food', 'color', 'animal', 'flower', 'quirk'].filter((k) => !s.known.fav[k]);
    if (!unknown.length) return g.her('laugh', { _: 'You already know everything about me! You\'re like a spy.', sassy: 'Are you making a file on me? Because it sounds like you have one.' });
    const k = unknown[0];
    const lines = {
      food: 'My favorite food? ' + U.cap(s.fav.food) + '. Obviously. Is there anything better in the whole world?',
      color: 'Hmm... ' + s.fav.color + '. It makes me feel calm.',
      animal: U.cap(s.fav.animal) + '! If I could have one I would name it after you.',
      flower: s.fav.flower === 'peach blossoms' ? 'Peach blossoms. Like our tree. Like the night I came.' : U.cap(s.fav.flower) + '. They smell like summer mornings.',
      quirk: 'Favorite thing? Hmm. I don\'t know. (You\'ve noticed, though: she ' + s.fav.quirk + '.)',
    };
    await g.her(k === 'quirk' ? 'thinking' : 'happy', lines[k]);
    g.learn('fav', k, { food: 'Favorite food: ' + s.fav.food, color: 'Favorite color: ' + s.fav.color, animal: 'Favorite animal: ' + s.fav.animal, flower: 'Favorite flower: ' + s.fav.flower, quirk: 'She ' + s.fav.quirk + '.' }[k]);
    g.bond(1);
    if (!s.known.traits.dreamy) g.learn('trait', 'dreamy', s.traits.dreamy > 0 ? 'She lives half in daydreams.' : 'She\'s practical to the bone.');
  }

  async function friends(g) {
    const s = g.s;
    const f = s.friends;
    if (f.mei >= 30) await g.her('happy', 'Mei is teaching me to make paper lanterns. Mine look like potatoes. Hers look like actual lanterns.');
    else await g.her('neutral', 'Mei\'s nice. I don\'t see her much.');
    if (f.tao >= 30 && s.age >= 13) await g.her('shy', 'Tao... is fine. Why are you asking about Tao? I didn\'t say anything about Tao.');
    if (s.flags.wanyin_friend) await g.her('smug', 'Wanyin and I are having a competition to see who can be nicer. I\'m winning.');
    else if (f.wanyin > 0) await g.her('pout', 'Lady Wanyin looked at my shoes today. Like THAT.');
    if (s.flags.prince_met && !s.flags.banquet) await g.her('shy', 'And there\'s a scholar I met at the Lantern Festival. Jing. He\'s terrible at riddles.');
    g.need('friends', 5);
    if (!s.known.traits.bold) g.learn('trait', 'bold', s.traits.bold > 0 ? 'She makes friends everywhere she goes.' : 'She\'s shy with new people and takes time to open up.');
  }

  const PAST = {
    general: ['the winter the northern pass froze solid and your soldiers shared one fire', 'the general who taught you that a sword is for protecting, never for proving', 'the night you let a starving enemy scout go free', 'why you really left the army', 'the medal you keep in a box and never wear'],
    scholar: ['the first time you failed the imperial exam', 'the poem you wrote that made the examiner laugh out loud', 'your teacher, who could recite a thousand poems and couldn\'t boil water', 'why you chose teaching children over a post in the capital', 'the letter you never sent to the Emperor'],
    merchant: ['your first caravan, and the camel that bit you', 'the desert storm that almost buried you', 'the western princess who paid you in songs instead of silver', 'the deal you walked away from because it was dishonest', 'why you stopped traveling'],
    physician: ['the first patient you couldn\'t save', 'the mountain herb that only blooms in the snow', 'the plague winter, and the forty nights without sleep', 'your master, who treated beggars before lords', 'why you never charge children'],
    musician: ['the night you played for the Empress', 'the guqin string that snapped during your first performance', 'the friend who wrote songs with you and then vanished', 'why you left the palace', 'the melody you\'ve never finished'],
    tea: ['the spring the frost killed your whole first harvest', 'your grandmother\'s tea bowl and the rule that comes with it', 'the tea master who called your leaves "ordinary" and how you proved him wrong', 'the year the river flooded the terraces', 'why you always save the first cup for the mountain'],
  };
  async function past(g) {
    const s = g.s;
    const n = (s.pastTold || 0);
    const stories = PAST[s.parent.bg];
    if (n >= stories.length) return g.her('happy', 'You\'ve told me all your stories. Tell me the first one again?');
    s.pastTold = n + 1;
    await g.nar('You tell her about ' + stories[n] + '.');
    const bg = s.parent.bg;
    const act = { general: 'martial', scholar: 'academy', merchant: 'teahouse', physician: 'medicine', musician: 'guqin', tea: 'tea' }[bg];
    if (s.traits.dreamy > 0 || s.bond > 55) {
      await g.her('love', { _: 'I can\'t believe you did that. Tell me more. Everything.', sassy: 'Okay, that\'s actually really cool. Don\'t let it go to your head.' });
      s.aff[act] = U.clamp((s.aff[act] || 0) + 0.25, -2, 2);
      g.bond(3); g.trust(3);
    } else {
      await g.her('neutral', 'Huh. That\'s... interesting.');
      g.bond(1);
    }
    if (n === 4) g.remember({ id: 'past_all', text: 'all your stories', letter: 'I remember every story you told me about your life before me, especially the last one, the one you said you\'d never told anyone.', weight: 7, val: 1, tags: ['parent'] });
  }

  async function sit(g) {
    const s = g.s;
    await g.nar('You sit together on the courtyard step and watch the light change. Neither of you says much.');
    const m = M.mood(s);
    if (m.label === 'low' || m.label === 'upset') {
      await g.nar('After a while, she leans against your shoulder.');
      const sec = s.secrets.find((x) => !s.known.facts.includes(x.text));
      if (sec && s.trust >= 40) {
        await g.her('sad', 'Can I tell you something? You can\'t be angry.');
        await g.nar(sec.text);
        g.learn('fact', sec.id, sec.text);
        const c = await g.choose(['"Thank you for telling me."', '"Why didn\'t you tell me sooner?"']);
        if (c === 0) { g.trust(8); g.bond(4); } else { g.trust(-2); g.parent(0, 3); }
      }
      g.need('love', 15);
      g.bond(3);
    } else {
      g.need('love', 8);
      g.bond(2);
      await g.her('calm', { _: 'This is nice.', sassy: 'Don\'t tell anyone I like this.', dreamy: 'The sky is doing the pink thing again.' });
    }
  }

  // ---------------------------------------------------------------- protests
  T.protest = async function (g, pr) {
    const s = g.s;
    await g.scene('home');
    await g.her(s.traits.fiery > 20 ? 'angry' : 'sad', M.protestLine(s, pr));
    const opts = ['"You\'re going. That\'s final."', '"Tell me what\'s wrong."', '"Alright. Do something you\'d like instead."'];
    const c = await g.choose(opts);
    if (c === 0) {
      g.parent(-3, 7); g.bond(-3); g.need('freedom', -10); g.trust(-2);
      s.forced[pr.id] = (s.forced[pr.id] || 0) + 1;
      await g.her(s.traits.fiery > 20 ? 'pout' : 'sad', { _: '...Fine.', sassy: 'Fine. FINE.', soft: '(She nods, not looking at you.)' });
      return 'forced';
    }
    if (c === 1) {
      g.parent(4, 0); g.trust(4);
      const why = {
        hate: { _: 'I\'m just bad at it, and everyone watches me be bad at it.', sassy: 'The teacher hates me and I hate the teacher. It\'s a whole thing.' },
        tired: { _: 'I haven\'t slept properly in weeks. I just need a break.' },
        again: { _: 'I feel like I\'m not allowed to have an opinion. About anything.' },
        freedom: { _: 'I just want to choose something. Anything.' },
      }[pr.reason];
      await g.her('sad', why);
      const d = await g.choose(['"Try once more, for me. I\'ll be proud either way."', '"Then let\'s swap it for something you\'d enjoy."']);
      if (d === 0) { g.bond(1); await g.her('neutral', '...Okay. For you.'); return 'persuaded'; }
      g.bond(3); g.need('freedom', 8);
      return 'swap';
    }
    g.parent(3, -6); g.bond(2); g.need('freedom', 12);
    await g.her('surprised', 'Really? ...Thank you!');
    return 'swap';
  };

  // ---------------------------------------------------------------- outings
  T.outings = function (s) {
    const sea = season(s);
    const list = [
      { id: 'picnic', name: 'Picnic under the peach trees', cost: 10, seasons: ['spring', 'summer', 'autumn'] },
      { id: 'market', name: 'Market day', cost: 25 },
      { id: 'boat', name: 'Boat on the lotus lake', cost: 20, seasons: ['spring', 'summer', 'autumn'] },
      { id: 'roof', name: 'Stargazing on the roof', cost: 0 },
      { id: 'opera', name: 'An evening at the opera', cost: 40 },
      { id: 'hotpot', name: 'Snow and hotpot', cost: 15, seasons: ['winter'] },
    ].filter((o) => !o.seasons || o.seasons.includes(sea));
    const fest = { autumn: { id: 'midautumn', name: 'Mid-Autumn Moon Festival', cost: 10 }, winter: { id: 'lanterns', name: 'Lantern Festival', cost: 10 }, spring: { id: 'qingming', name: 'Kite Day at Qingming', cost: 5 }, summer: { id: 'dragonboat', name: 'Dragon Boat Races', cost: 10 } }[sea];
    fest.festival = true;
    return [fest].concat(list);
  };

  T.outing = async function (id, g) {
    const s = g.s;
    const o = T.outings(s).find((x) => x.id === id);
    if (o) g.gold(-o.cost);
    g.need('love', 10);
    g.bond(2);
    g.need('fun', 12);
    g.stress(-5);
    const once = (key) => (s.flags['o_' + key] ? false : (s.flags['o_' + key] = true));
    switch (id) {
      case 'picnic': {
        await g.scene('garden');
        await g.nar('You spread a blanket under the blossoming trees and unpack rice balls, pickles and a flask of tea.');
        await g.her('happy', { _: 'Everything tastes better outside.', dreamy: 'Look, that cloud is a dragon. And that one is a dumpling. And that one is you.' });
        if (!s.known.fav.food) { await g.her('joy', 'You know what would make this perfect? ' + U.cap(s.fav.food) + '.'); g.learn('fav', 'food', 'Favorite food: ' + s.fav.food); }
        if (once('picnic')) g.remember({ id: 'picnic', title: 'Picnic', caption: 'Rice balls under the blossoms.', text: 'our picnic under the peach trees', weight: 4, val: 1, tags: ['parent'], photo: { scene: 'garden', anim: 'sit', expr: 'happy' } });
        return 'A picnic with ' + g.P + '. The rice balls were squished and perfect.';
      }
      case 'market': {
        await g.scene('market');
        await g.nar('The market is loud and bright: sugar painters, noodle pullers, a man selling crickets in tiny cages.');
        const things = { rabbits: 'a clay rabbit whistle', cranes: 'a paper crane mobile', 'red pandas': 'a little embroidered red panda', koi: 'a painted koi kite', foxes: 'a fox mask', cats: 'a cat-shaped hairpin', magpies: 'a carved magpie' };
        const t = things[s.fav.animal] || 'a sugar figure';
        await g.her('joy', 'Oh! ' + U.cap(t) + '! Can I? Can I please?');
        g.learn('fav', 'animal', 'Favorite animal: ' + s.fav.animal);
        const c = await g.choose(['Buy it. (10 coins)', '"Maybe next time."']);
        if (c === 0) { g.gold(-10); g.bond(3); g.need('fun', 8); }
        return 'Market day with ' + g.P + '.';
      }
      case 'boat': {
        await g.scene('lake');
        await g.nar('You rent a little boat and drift among the lotus leaves. She trails her hand in the water.');
        const deep = s.fav.fear === 'deep water';
        if (deep) { await g.her('worried', 'Is it... very deep here?'); g.learn('fav', 'fear', 'She is afraid of deep water.'); await g.nar('You row back toward the shallows, and she relaxes.'); }
        else await g.her('calm', 'I could stay out here forever.');
        if (once('boat')) g.remember({ id: 'boat', title: 'Lotus lake', caption: 'Drifting among the lotus leaves.', text: 'the boat on the lotus lake', weight: 4, val: 1, tags: ['parent'], photo: { scene: 'lake', anim: 'sit', expr: 'calm' } });
        return 'We took a boat onto the lotus lake.';
      }
      case 'roof': {
        await g.scene('night');
        await g.nar('You climb onto the roof with a blanket and a pot of tea. The Silver River pours across the sky.');
        await g.her('thinking', { _: 'Which one do you think I came from?', dreamy: 'Sometimes I think I can hear them. The stars. Humming.' });
        s.star += 1;
        const c = await g.choose(['"That one. The brightest."', '"It doesn\'t matter. You\'re here now."', 'Point out the Weaver Girl and tell her the legend.']);
        if (c === 0) g.bond(2);
        if (c === 1) { g.bond(3); g.need('love', 5); }
        if (c === 2) { g.stat('wit', 1); g.stat('art', 1); s.star += 1; }
        if (once('roof')) g.remember({ id: 'roof', title: 'On the roof', caption: 'Counting the stars.', text: 'the night we counted stars on the roof', letter: 'I still climb onto a roof sometimes, just to look at the Silver River the way we used to.', weight: 5, val: 1, tags: ['parent', 'star'], photo: { scene: 'night', anim: 'sit', expr: 'calm' } });
        return 'We counted stars on the roof. I lost count at four hundred.';
      }
      case 'opera': {
        await g.scene('town', { tod: 'night' });
        await g.nar('The opera troupe performs "The Butterfly Lovers". She doesn\'t blink for the whole second act.');
        await g.her(s.traits.dreamy > 0 ? 'teary' : 'happy', { _: 'That was the most beautiful thing I have ever seen.', sassy: 'I\'m not crying. The makeup was just very... emotional.' });
        g.stat('art', 2); g.stat('grace', 1);
        return 'We saw The Butterfly Lovers. I cried. A little.';
      }
      case 'hotpot': {
        await g.scene('home', { tod: 'night' });
        await g.nar('Snow falls on the courtyard. You set a bubbling hotpot on the table and cook everything, slowly, together.');
        await g.her('joy', { _: 'This is the best part of winter.', sassy: 'I\'m claiming all the fish balls. That\'s the law.' });
        g.stress(-6);
        if (once('hotpot')) g.remember({ id: 'hotpot', title: 'Hotpot', caption: 'Snow outside, steam inside.', text: 'hotpot on a snowy night', letter: 'Every time it snows I want hotpot, and every time I eat hotpot I want to be home with you.', weight: 5, val: 1, tags: ['parent', 'food'], photo: { scene: 'home', tod: 'night', anim: 'cook', expr: 'joy' } });
        return 'Hotpot while the snow fell. I ate eleven fish balls.';
      }
      case 'midautumn': return T.midautumn(g);
      case 'lanterns': return T.lanterns(g);
      case 'qingming': return T.qingming(g);
      case 'dragonboat': return T.dragonboat(g);
    }
    return '';
  };

  T.midautumn = async function (g) {
    const s = g.s;
    await g.scene('home', { tod: 'night' });
    await g.nar('The Mid-Autumn moon rises round and gold. You set out mooncakes, pomelo and tea in the courtyard.');
    await g.her('thinking', 'Tell me the story of Chang\'e again? The lady who lives on the moon?');
    const c = await g.choose(['Tell the story, with all the voices.', 'Let her tell it to you instead.']);
    if (c === 0) { g.stat('art', 1); g.bond(3); }
    else { g.stat('art', 2); g.esteem(2); await g.her('smug', 'And then the rabbit said, "I\'m not doing ANY more pounding", and quit. That\'s how I remember it.'); }
    if (s.fav.food.includes('mooncake')) { await g.her('joy', 'Lotus-paste mooncakes! My favorite!'); g.learn('fav', 'food', 'Favorite food: ' + s.fav.food); g.bond(2); }
    if (!s.flags.o_midautumn) g.remember({ id: 'midautumn', title: 'Mid-Autumn', caption: 'Mooncakes under the full moon.', text: 'the Mid-Autumn moon', weight: 4, val: 1, tags: ['parent', 'festival'], photo: { scene: 'home', tod: 'night', anim: 'sit', expr: 'happy' } });
    s.flags.o_midautumn = true;
    return 'Mid-Autumn. The moon was enormous.';
  };

  T.lanterns = async function (g) {
    const s = g.s;
    await g.scene('town', { tod: 'night', weather: 'lanterns' });
    await g.nar('The Lantern Festival turns the whole town into a river of light. Every lantern has a riddle hanging from it.');
    const r = await g.minigame('riddles', { n: 3 });
    const wins = r.skipped ? (g.check('wit', 40) ? 2 : 1) : r.score;
    if (wins >= 2) { g.stat('wit', 2); await g.her('joy', 'We solved ' + wins + '! We won a rabbit lantern!'); }
    else await g.her('laugh', 'We\'re terrible at this. I love it.');
    if (!s.flags.prince_met && s.age >= 14 && (s.stats.wit >= 38 || s.stats.grace >= 40)) {
      s.flags.prince_met = true;
      g.npc('prince', 'right');
      await g.nar('A young scholar in a plain blue robe is staring at the last riddle in despair. She leans over his shoulder and solves it at once.');
      await g.say('prince', 'How did you... Please, you must teach me. I\'m Jing. I\'m a... student. Of things.');
      await g.her('smug', 'You\'re very bad at riddles, Jing-the-student.');
      g.friend('prince', 15);
      g.remember({ id: 'lanterns_jing', title: 'The Lantern Festival', caption: 'A scholar who was bad at riddles.', text: 'the night I met Jing at the Lantern Festival', weight: 6, val: 1, tags: ['love', 'prince'], photo: { scene: 'town', tod: 'night', anim: 'love', expr: 'smug', npcs: ['prince'] } });
      g.clearNpcs();
    } else if (!s.flags.o_lanterns) g.remember({ id: 'lanterns', title: 'Lanterns', caption: 'A river of light.', text: 'the Lantern Festival', weight: 4, val: 1, tags: ['festival'], photo: { scene: 'town', tod: 'night', anim: 'cheer', expr: 'joy' } });
    s.flags.o_lanterns = true;
    return 'The Lantern Festival! We solved riddles.';
  };

  T.qingming = async function (g) {
    const s = g.s;
    await g.scene('garden');
    await g.nar('Qingming: sweeping the ancestors\' graves in the morning, flying kites in the afternoon. The hill is full of paper dragons and swallows.');
    g.io.herAnim && g.io.herAnim('kite');
    const c = await g.choose(['Let her fly the kite all by herself.', 'Fly it together.']);
    if (c === 0) { g.need('freedom', 8); g.esteem(3); await g.her('joy', 'Look how high it is! Higher than everyone\'s!'); }
    else { g.bond(3); await g.her('laugh', 'You\'re tangling it! Give it here!'); }
    if (!s.flags.o_qingming) g.remember({ id: 'kites', title: 'Kite day', caption: 'Higher than everyone\'s.', text: 'flying kites at Qingming', weight: 4, val: 1, tags: ['festival'], photo: { scene: 'garden', anim: 'kite', expr: 'joy' } });
    s.flags.o_qingming = true;
    return 'We flew kites on the hill.';
  };

  T.dragonboat = async function (g) {
    const s = g.s;
    await g.scene('lake');
    await g.nar('Drums echo across the lake. The dragon boats line up, and the town cheers from the shore with sticky rice zongzi in hand.');
    if (s.age >= 13 && s.stats.vigor >= 25) {
      await g.her('determined', 'The youth boat needs one more rower. Can I? Please?');
      const r = await g.minigame('boat', { vigor: s.stats.vigor });
      const win = r.skipped ? g.check('vigor', 40) : r.win;
      if (win) { g.stat('vigor', 2); g.esteem(5); await g.her('joy', 'WE WON! Did you see? Our boat WON!'); }
      else { g.stat('vigor', 1); await g.her('laugh', 'We came fourth! Out of five! We were magnificent!'); }
    } else {
      await g.her('joy', 'Go, go, go! The red one! Go red!');
    }
    if (!s.flags.o_dragonboat) g.remember({ id: 'dragonboat', title: 'Dragon boats', caption: 'Drums across the water.', text: 'the Dragon Boat races', weight: 4, val: 1, tags: ['festival'], photo: { scene: 'lake', anim: 'cheer', expr: 'joy' } });
    s.flags.o_dragonboat = true;
    return 'The Dragon Boat Festival!';
  };

  // ---------------------------------------------------------------- journeys (the "Journey" activity)
  T.journey = async function (g) {
    const s = g.s;
    const opts = ['fox', 'shrine', 'boatman', 'pass'];
    if (!s.flags.immortal_met && s.age >= 13) opts.push('waterfall');
    const done = s.flags.journeysDone || [];
    const pool = opts.filter((x) => !done.includes(x));
    const pick = pool.length ? U.pick(pool) : U.pick(opts);
    s.flags.journeysDone = done.concat([pick]);
    await g.scene('mountain');
    if (pick === 'fox') {
      await g.nar('Deep in the bamboo forest, she hears whimpering: a fox kit with its paw caught in a hunter\'s snare.');
      const c = await g.choose(['She frees it carefully.', 'She carries it to Physician Lu.']);
      g.stat('heart', 3);
      if (c === 1) { g.stat('wit', 1); s.counts.medicine = (s.counts.medicine || 0); }
      await g.nar('For the rest of the journey, a small red shadow follows her at a polite distance.');
      return 'I rescued a fox! It followed me all the way to the river.';
    }
    if (pick === 'shrine') {
      await g.nar('She finds a ruined shrine on a ridge. On its wall, a faded mural: a girl with starlight hair falling from a loom of stars.');
      if (g.check('wit', 40)) { s.star += 2; g.stat('wit', 2); await g.her('surprised', 'That\'s... me? It says "the thread returns on the eighteenth crossing". What does that mean?'); g.learn('fact', 'mural', 'A mural in a mountain shrine shows a girl falling from a loom of stars.'); }
      else { s.star += 1; await g.her('thinking', 'The writing is too old. But the girl in the painting has my hair.'); }
      return 'I found a shrine with a painting of a girl who looks like me.';
    }
    if (pick === 'boatman') {
      await g.nar('A storm sweeps over the river. An old boatman\'s skiff is drifting toward the rapids.');
      if (g.check('vigor', 38)) { g.stat('vigor', 2); g.esteem(5); await g.nar('She wades in to her waist, grabs the rope and hauls the skiff to shore. The boatman gives her a carved river stone for luck.'); return 'I saved a boatman in the storm!'; }
      await g.nar('She runs for help instead, and the villagers pull the boat in together. The boatman thanks her anyway.');
      g.stat('heart', 2);
      return 'There was a storm on the river. Everyone was safe in the end.';
    }
    if (pick === 'pass') {
      await g.nar('On the mountain pass, two rough men block the path and demand a "toll".');
      const c = await g.choose(['She talks her way past.', 'She stands her ground.', 'She runs.']);
      if (c === 0 && g.check('grace', 35)) { g.stat('grace', 2); await g.nar('By the end of the conversation they are apologizing and giving HER directions.'); return 'I talked my way past two bandits!'; }
      if (c === 1 && g.check('vigor', 40)) { g.stat('vigor', 3); g.esteem(4); await g.nar('She takes a stance Master Gao taught her. The men look at each other and find somewhere else to be.'); return 'Bandits! I scared them off!'; }
      await g.nar('She runs all the way back to town, lighter by a few coins but otherwise unharmed.');
      g.gold(-10);
      s.stress += 6;
      return 'Bandits took my coins. I\'m fine. Mostly embarrassed.';
    }
    if (pick === 'waterfall') {
      s.flags.immortal_met = true;
      await g.nar('Behind a waterfall she finds a cave, and in it a white-haired man meditating on a rock. He opens one eye.');
      await g.say('bai', 'The little thread from the river. Come back when the moon is full, and I will teach you to listen to the mountain.');
      g.learn('fact', 'immortal', 'A white-haired immortal on the mountain has offered to teach her. (Mountain Cultivation unlocked.)');
      return 'I met a strange old man behind a waterfall. He knew who I was.';
    }
    return '';
  };

  // ---------------------------------------------------------------- birthdays at Qixi
  T.GIFTS = [
    { id: 'sword', name: 'A wooden practice sword', cost: 30, act: 'martial', stat: 'vigor' },
    { id: 'book', name: 'A book of legends', cost: 25, act: 'academy', stat: 'wit' },
    { id: 'flute', name: 'A bamboo flute', cost: 25, act: 'guqin', stat: 'art' },
    { id: 'hairpin', name: 'A jade hairpin', cost: 60, act: 'etiquette', stat: 'grace' },
    { id: 'glass', name: 'A brass star-glass', cost: 70, act: 'observatory', stat: 'wit', star: 1 },
    { id: 'knives', name: 'A cook\'s knife set', cost: 40, act: 'kitchen', stat: 'craft' },
    { id: 'favfood', name: 'A basket of {food}', cost: 15, needFav: 'food' },
    { id: 'plush', name: 'An embroidered {animal}', cost: 20, needFav: 'animal' },
  ];
  // ---------------------------------------------------------------- the hairpin ceremony (及笄) at fifteen
  T.COURTESY = [
    { zi: 'Yunzhi', zh: '雲織', means: 'cloud weaver, after the Weaver Girl' },
    { zi: 'Xinghe', zh: '星河', means: 'star river, for where she came from' },
    { zi: 'Wanqing', zh: '晚晴', means: 'a clear evening sky' },
    { zi: 'Zhiwei', zh: '知微', means: 'she who notices small things' },
    { zi: 'Mingyue', zh: '明月', means: 'bright moon' },
    { zi: 'Ruoxi', zh: '若曦', means: 'like the first light of morning' },
  ];
  T.ceremonyDue = (s, newAge) => !s.flags.jiji && (newAge === 15 || (s.startAge >= 15 && newAge === 16));
  T.hairpin = async function (g, newAge) {
    const s = g.s;
    g.flag('jiji', true);
    // a respected woman of the town combs her hair
    const guest = (s.counts.etiquette || 0) >= 2 || s.seen.hua_softens ? 'hua' : (s.counts.temple || 0) >= 2 ? 'jingci' : 'bao';
    const G_ = G.NPC[guest].name;
    const mei = s.friends.mei >= 30;
    await g.scene('home', { tod: 'day', season: 'summer' });
    g.npc(guest, 'mentor');
    if (mei) g.npc('mei', 'left');
    await g.nar(newAge > 15 ? 'She came to you already fifteen, so there was never a hairpin ceremony for her. This year ' + G_ + ' will not hear another word about it.' : 'The morning of her fifteenth Qixi. In Peach Blossom Town, a girl of fifteen has her hair pinned up for the first time: the jiji, the hairpin ceremony. After today, the whole town will call her a young woman.');
    await g.say(guest, { hua: 'Sit straight. Chin up. A lady is made in the small moments.', jingci: 'Sit, child. Breathe. It is only hair. It is also everything.', bao: 'Sit! Sit. I did my own daughter\'s hair, and my sister\'s, and half the lane\'s. You\'re in good hands.' }[guest]);
    await g.nar(G_ + ' combs out her hair, a hundred slow strokes, while the courtyard fills with neighbors pretending they just happened to be passing by.');
    await g.nar('By custom the pin is a plain one of polished wood. ' + G_ + ' holds out a hand for it.');
    await g.her('shy', { _: 'Wait. Can we use this one?', sassy: 'Hold on. Not that one. This one.', soft: 'Um... if it\'s allowed... could we use this one instead?' });
    await g.nar('She opens her hand. It is the golden star hairpin she was holding the night she fell into your peach tree.');
    await g.her('teary', { _: 'And I want you to do it, ' + g.P + '. Not anyone else.', sassy: 'And you do it. You. Nobody else touches my hair today.' });
    const c = await g.choose(['Pin it up yourself, very carefully.', '"You were holding this the night you fell. You wouldn\'t let go of it for three days."', '"Hold still, or I\'ll pin it to your ear."']);
    if (c === 0) {
      g.parent(4, 0);
      await g.nar('Your hands are not quite steady. It takes three tries. Nobody says a word, and nobody minds.');
    } else if (c === 1) {
      g.parent(4, 0);
      g.trust(3);
      await g.her('teary', { _: 'I remember. I thought if I let go, I\'d forget where I came from.', dreamy: 'I thought it was the last little piece of the sky I had left.' });
      await g.her('love', 'I don\'t need to hold it so tight anymore.');
    } else {
      g.parent(3, -1);
      await g.her('laugh', { _: 'Don\'t you dare!', sassy: 'You wouldn\'t. ...You would. Okay, I\'m bracing myself.' });
    }
    await g.nar('The star catches the morning light, and for a moment it seems to glow on its own.');
    await g.her('surprised', {
      sunny: 'Whoa. Is that me? I look like someone who knows things!',
      soft: '(She touches the pin, very gently.) It feels like the stars are holding my hair up.',
      sassy: 'Okay. I look... older. Don\'t cry. You\'re crying. I\'m not crying. This is sweat.',
      dreamy: 'The girl in the mirror looks like she\'s about to go somewhere far away.',
      earnest: 'I\'ll try to deserve it. Being grown up, I mean.',
    });
    // the courtesy name, the name the world will call her by
    await g.say(guest, { hua: 'Now her courtesy name. A young woman needs a name for the world, not only for her family. It is the parent\'s to give.', jingci: 'And now a courtesy name. The world will call her by it. Choose with your heart.', bao: 'Now the courtesy name! This is the part where everyone cries. Go on, go on.' }[guest]);
    const pool = U.shuffle(T.COURTESY.slice()).slice(0, 3);
    const c2 = await g.choose(pool.map((n) => n.zi + ' ' + n.zh + ': ' + n.means).concat(['Write one yourself']));
    let zi = pool[0].zi, zh = pool[0].zh;
    if (c2 < 3) {
      zi = pool[c2].zi;
      zh = pool[c2].zh;
    } else {
      const typed = String((await g.input('Her courtesy name', pool[0].zi)) || '').trim().slice(0, 20);
      if (typed) {
        zi = typed;
        zh = '';
      }
    }
    s.zi = zi;
    s.ziZh = zh;
    await g.her('love', { _: zi + '. ' + zi + '... I like it. It sounds like someone I want to be.', sassy: zi + '. Hm. Acceptable. No. I love it. Don\'t make it weird.', soft: '(She says it under her breath, twice, as if trying it on.) ' + zi + '.' });
    if (mei) await g.say('mei', 'Lady ' + zi + '! I\'m calling you that at the market. Loudly. Every single time.');
    // she decides how she'll wear it from now on
    const up = s.traits.diligent + (s.stats.grace - 30) - s.traits.playful - s.traits.fiery / 2 > 0 && s.style !== 'updo';
    if (up) {
      s.style = 'updo';
      g.io.refreshHer && g.io.refreshHer();
      await g.her('happy', 'I think I\'ll wear it up from now on. It feels right.');
    } else {
      await g.her('smug', { _: 'I\'ll wear it up for festivals. The rest of the time my hair does what it wants. Like me.', soft: 'Can I still wear it down sometimes? I like it both ways.' });
    }
    g.bond(6);
    g.esteem(6);
    g.trust(3);
    g.stat('grace', 2);
    g.remember({ id: 'jiji', title: 'The hairpin ceremony', caption: 'The star hairpin, pinned up at last.', text: 'the morning you pinned up my hair with the star hairpin', letter: 'I still remember the morning you pinned my hair up with the star hairpin and named me ' + zi + '. Your hands were shaking. So were mine.', weight: 9, val: 1, tags: ['parent', 'star'], photo: { scene: 'home', tod: 'day', anim: 'idle', expr: 'shy', age: newAge, npcs: mei ? ['mei'] : [] } });
    g.clearNpcs();
  };

  T.birthday = async function (g) {
    const s = g.s;
    const newAge = s.age + 1;
    if (T.ceremonyDue(s, newAge)) await T.hairpin(g, newAge);
    await g.scene('home', { tod: 'night', season: 'summer' });
    await g.nar('Qixi again. A year ago tonight' + (s.turn < 4 ? ' she fell from the sky' : ', and every year before') + '. The magpies are gathering, and she turns ' + newAge + '.');
    // height mark on the pillar
    s.heights.push(newAge);
    await g.nar('As always, you stand her against the pillar and mark her height with a knife. The new line is ' + (newAge <= 14 ? 'a whole hand' : 'a finger') + ' above the last.');
    const list = T.GIFTS.filter((x) => !x.needFav || s.known.fav[x.needFav]).map((x) => ({ x, text: M.fill(s, x.name) + ' (' + x.cost + ')', disabled: s.gold < x.cost }));
    list.push({ x: null, text: 'A hand-written poem (free)' });
    const c = await g.choose(list.map((l) => ({ text: l.text, disabled: l.disabled })));
    const pick = list[c].x;
    if (!pick) {
      const v = s.traits.dreamy > 0 || s.bond > 60;
      await g.her(v ? 'teary' : 'happy', v ? 'You wrote this? For me? ...I\'m keeping this forever.' : 'Aww. Thank you, ' + g.P + '.');
      g.bond(v ? 6 : 3);
      if (v) g.remember({ id: 'poem_' + newAge, text: 'the poem you wrote for my ' + newAge + 'th birthday', letter: 'I still have the poem you wrote me for my ' + newAge + 'th birthday. The rhymes are terrible. It\'s my favorite thing I own.', weight: 7, val: 1, tags: ['parent', 'gift'] });
    } else {
      g.gold(-pick.cost);
      let like = pick.act ? s.aff[pick.act] || 0 : 1.6;
      if (pick.needFav) like = 1.8;
      if (like >= 1) { await g.her('love', { _: 'How did you know?! It\'s perfect!', sassy: 'Okay. You win. Best gift ever.' }); g.bond(6); }
      else if (like >= 0) { await g.her('happy', 'Thank you! I love it.'); g.bond(3); }
      else { await g.her('neutral', { _: 'Oh. Um. Thank you!', sassy: 'A... ' + M.fill(s, pick.name).toLowerCase() + '. Wow. Thanks.' }); g.bond(1); }
      if (pick.stat) g.stat(pick.stat, 2);
      if (pick.star) s.star += pick.star;
      if (pick.act) s.aff[pick.act] = U.clamp((s.aff[pick.act] || 0) + 0.15, -2, 2);
    }
    g.remember({ id: 'bday_' + newAge, title: 'Qixi, age ' + newAge, caption: 'Her ' + newAge + 'th Qixi.', text: 'my ' + newAge + 'th birthday', weight: 2, val: 1, tags: ['birthday'], photo: { scene: 'home', tod: 'night', anim: 'cheer', expr: 'joy', age: newAge } });
  };

  // ---------------------------------------------------------------- the finale on her eighteenth Qixi
  T.finale = async function (g) {
    const s = g.s;
    await g.scene('night', {});
    await g.nar('Her eighteenth Qixi. The whole town is out on the rooftops tonight, and the sky is so full of stars it almost hums.');
    // the friends she made come to see her
    const came = [];
    if (s.friends.mei >= 35) came.push('mei');
    if (s.flags.tao_love || s.flags.tao_crush || s.friends.tao >= 40) came.push('tao');
    if ((s.flags.wanyin_friend || s.friends.wanyin >= 40) && came.length < 2) came.push('wanyin');
    const SPOT = ['left', 'far'];
    came.forEach((id, i) => g.npc(id, SPOT[i]));
    const HELLO = {
      mei: 'We came to watch the magpies. And you. Mostly you. Okay, only you.',
      tao: 'I-I brought mooncakes. Is that... is that right, for a night like this? I didn\'t know what you bring.',
      wanyin: 'I am only here because your courtyard has the best view. Obviously.',
    };
    if (came.length) {
      await g.nar(came.length === 1 ? `${G.NPC[came[0]].name} is there, of course.` : `${G.NPC[came[0]].name} is there, of course, and ${G.NPC[came[1]].name}, pretending to just be passing by.`);
      await g.say(came[0], HELLO[came[0]]);
    }
    // she remembers
    const good = s.memories.filter((m) => m.val > 0 && m.text && m.id !== 'arrival').sort((a, b) => b.weight - a.weight || b.turn - a.turn);
    const hurt = s.memories.filter((m) => m.val < 0 && m.weight >= 6 && m.text).sort((a, b) => b.weight - a.weight)[0];
    const phrase = (m) => m.text.replace(/\.$/, '');
    g.anim('sit');
    await g.her('calm', { _: 'I keep thinking about everything today.', sassy: 'Okay. I\'m going to be sentimental for exactly one minute. Don\'t make it weird.', dreamy: 'Everything today felt like it was happening twice. Once now, and once in memory.' });
    if (good[0]) await g.her('happy', /^[A-Z]/.test(good[0].text) ? phrase(good[0]) + '.' : 'Do you remember ' + phrase(good[0]) + '?');
    if (good[1]) await g.her('joy', /^[A-Z]/.test(good[1].text) ? phrase(good[1]) + '.' : 'And ' + phrase(good[1]) + '.');
    if (good[2]) await g.her('teary', /^[A-Z]/.test(good[2].text) ? phrase(good[2]) + '. I remember all of it.' : 'And ' + phrase(good[2]) + '. I remember all of it.');
    if (hurt && s.bond < 55) await g.her('sad', 'I remember ' + phrase(hurt) + ', too.');
    g.anim('idle');
    // the magpies come
    g.fx('bridge', 'build');
    await g.nar('And then the magpies come: thousands of them, wing to wing, building a bridge across the Silver River.');
    await g.nar('A second bridge follows, curving down, down, until it touches the stones of your courtyard.');
    await g.say('voice', 'Little thread. It is time. The river remembers you. Will you come home?');
    if (came.includes('mei')) {
      g.npcEmote('mei', 'bang');
      await g.say('mei', s.name + '... you\'re not going to go. Are you?');
    }
    await g.her('worried', g.P + '...');
    const bondWord = s.bond >= 70 ? 'love' : s.bond >= 40 ? 'teary' : 'sad';
    await g.her(bondWord, {
      _: s.bond >= 70 ? 'I don\'t know what to do. Part of me is up there. But all of me is here.' : 'I always wondered what I\'d feel when this happened.',
      sassy: s.bond >= 70 ? 'Great timing, stars. Really great. I finally have my life figured out.' : 'So this is it. The big cosmic question.',
    });
    const c = await g.choose(['"Stay with me."', '"It\'s your choice. Whatever you choose, I love you."', '"Go. Be happy, wherever that is."']);
    const choice = ['stay', 'free', 'go'][c];
    if (s.flags.star_answer && s.flags.star_answer !== choice) {
      await g.her('thinking', s.flags.star_answer === 'free' ? 'You once told me it would be my choice.' : 'That\'s not what you said before.');
    }
    const res = G.Endings.decide(s, choice);
    s.finale = { choice, stays: res.stays, bridge: res.bridge };
    if (res.stays) {
      await g.nar('She looks up at the bridge for a long moment. Then she takes your hand.');
      await g.her('teary', {
        _: 'Tell the river thank you. But I already have a home.',
        sassy: 'Thanks, but no thanks. I have a whole life down here. And a parent who can\'t cook without me.',
        dreamy: 'The river will still be there. It\'s just the sky. I can visit it every night.',
      });
      g.fx('bridge', 'dissolve');
      await g.nar('The magpie bridge shimmers, and slowly, gently, comes apart into falling stars.');
      if (came.length) {
        g.anim('cheer');
        came.forEach((id) => g.npcEmote(id, 'heart'));
        await g.say(came[0], { mei: 'She\'s staying! She\'s STAYING! Everybody, she\'s staying!', tao: 'You\'re staying! I mean. Good. That\'s good. I have to go tell my father. And everyone.', wanyin: 'Well. Obviously. Where else would you find a rival worth having?' }[came[0]]);
      }
      await g.her('joy', { _: 'Come on, ' + g.P + '. Let\'s go home.', sassy: 'Right. Now can we please eat? Cosmic decisions make me starving.' });
    } else {
      await g.nar('She holds you for a long time.');
      const BYE = {
        mei: 'Write to me. I don\'t care how. Tie letters to the magpies. Promise!',
        tao: 'I\'ll... I\'ll save you the first batch. Every year. Just in case.',
        wanyin: 'Don\'t you dare become the brightest star up there without me watching.',
      };
      for (const id of came) {
        g.npcEmote(id, 'drop');
        await g.say(id, BYE[id]);
      }
      await g.her('cry', res.bridge ? 'I\'ll come back, ' + g.P + '. Every Qixi. Like the Weaver Girl. Wait for me.' : 'Thank you for everything. Look up sometimes.');
      await g.fx('ascend');
      g.fx('newStar', [160, 18]);
      await g.wait(900);
      await g.nar('The bridge carries her up into the Silver River, and one new star begins to shine.');
      g.fx('bridge', 'dissolve');
      await g.nar(res.bridge ? 'The magpies scatter into the night, calling to each other. They will be back next year. So will she.' : 'The magpies scatter into the night. The courtyard is very quiet.');
    }
  };
})();
