/* Silver River — the town keeps living while you plan: friends drop by the courtyard, and word gets around. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const D = G.D;
  const M = G.Mind;
  const Town = (G.Town = {});

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // stable per-season choice so the news doesn't flicker every time the HUD redraws
  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = Math.imul(n, 9);
    n ^= n >>> 4;
    n = Math.imul(n, 0x27d4eb2d);
    return (n ^ (n >>> 15)) >>> 0;
  }
  const seen = (s, id) => !!(s.seen && s.seen[id]);
  const count = (s, id) => (s.counts && s.counts[id]) || 0;

  // ================================================================ word around town
  // [when(s), text | text(s), weight]. Specific story news outweighs the everyday chatter.
  const NEWS = [
    // her own reputation
    [(s) => s.stats.vigor >= 45, (s) => `The children in the lane play "Sword Saint" now. Everybody wants to be ${s.name}.`, 3],
    [(s) => s.stats.wit >= 45, () => 'Scholar Wen has been bragging about his best student to anyone who holds still long enough.', 3],
    [(s) => s.stats.art >= 45, (s) => `Someone was humming ${s.name}'s tune at the well this morning. They didn't know where they'd heard it.`, 3],
    [(s) => s.stats.grace >= 45, () => 'Madam Hua used your daughter as the example in class. The other girls were not pleased.', 3],
    [(s) => s.stats.heart >= 45, (s) => `Auntie Bao says ${s.name} is the only child in town who says thank you twice.`, 3],
    [(s) => s.stats.craft >= 45, (s) => `Three shops on Willow Street have ${s.name}'s knotwork charms hanging in the window.`, 3],
    [(s) => s.star >= 6, () => 'People say the stars have been brighter over your roof lately. The neighbors have started leaving out tea.', 3],
    [(s) => s.stress >= 70, (s) => `Auntie Bao stopped you in the street to ask if ${s.name} is eating properly. She looked worried.`, 4],
    [(s) => s.bond >= 80, (s) => `The neighbors say they can hear you and ${s.name} laughing from across the lane. They say it like a compliment.`, 2],
    [(s) => (s.earned || 0) >= 600, (s) => `Word is that ${s.name} is the hardest worker in Peach Blossom Town. Shopkeepers ask after her by name.`, 2],
    // the story so far
    [(s) => seen(s, 'contest_win') || seen(s, 'contest_proud'), (s) => `The poetry contest scroll with ${s.name}'s name on it still hangs in the academy hall. Wanyin walks past it very quickly.`, 5],
    [(s) => seen(s, 'kitten') && !s.flags.pet, () => 'A skinny calico has been seen sleeping on your wall. She looks like she is waiting for something.', 3],
    [(s) => s.flags.pet, (s) => `${s.flags.pet} was spotted stealing a fish from the market. The fishmonger has sworn revenge.`, 3],
    [(s) => seen(s, 'kittens'), () => 'The kittens from the woodshed have all found homes. One lives at the teahouse now and bites the customers.', 4],
    [(s) => seen(s, 'defends_kid'), () => 'The lane boys have stopped calling names. Mostly. The little one follows your daughter around now.', 4],
    [(s) => seen(s, 'tao_father') || seen(s, 'tao_stall'), () => 'Tao runs the dumpling stall by himself on market days now. His folds have gotten very neat.', 4],
    [(s) => s.flags.tao_crush || s.flags.tao_love, (s) => `Tao burned a whole tray of buns yesterday. Someone said "${s.name}" in the street and he forgot they were in the steamer.`, 4],
    [(s) => seen(s, 'mei_wedding'), () => 'Mei\'s new family sent red eggs to every house on the lane. Yours had an extra one.', 5],
    [(s) => seen(s, 'mei_trouble') || seen(s, 'mei_medicine'), () => 'Mei\'s grandmother is walking to market by herself again. She credits "that star girl\'s medicine".', 4],
    [(s) => seen(s, 'mei_lantern') || seen(s, 'rabbit_lantern'), () => 'The giant rabbit lantern is hanging in Mei\'s window all year now. Her grandmother has given up.', 3],
    [(s) => seen(s, 'gao_past'), () => 'Master Gao was seen laying incense at the old soldiers\' shrine. He told the watchman he was "checking the roof".', 4],
    [(s) => seen(s, 'gao_sword'), () => 'Master Gao\'s old sword is off the wall. He says it is for cleaning. He has been cleaning it for weeks.', 3],
    [(s) => seen(s, 'wen_poem'), () => 'Scholar Wen\'s new poem is being copied all over town. He pretends to hate the attention.', 4],
    [(s) => seen(s, 'liu_friend') || seen(s, 'duet'), () => 'Maestro Liu plays duets at dusk again. People have started sitting on the wall outside to listen.', 4],
    [(s) => seen(s, 'hua_softens'), () => 'Madam Hua laughed out loud at the teahouse. People are still talking about it. Some say it was a sneeze.', 4],
    [(s) => seen(s, 'jingci_past'), () => 'Abbess Jingci has started a free school at the temple for the ferry children.', 4],
    [(s) => seen(s, 'bao_secret'), () => 'Auntie Bao\'s dumpling line is longer than ever. She still won\'t tell anyone the secret. Except, apparently, your daughter.', 4],
    [(s) => seen(s, 'xing_comet'), () => 'Old Xing insists the comet will come back. Nobody believes him, except the one person who matters to him.', 4],
    [(s) => seen(s, 'yue_last'), () => 'Dancer Yue\'s farewell performance is all anyone talks about. Two girls fainted. One on purpose.', 4],
    [(s) => seen(s, 'wanyin_music') || s.flags.wanyin_friend, () => 'Lady Wanyin was seen laughing in the market. Her maid looked shocked. Wanyin looked a little shocked herself.', 4],
    [(s) => s.flags.prince_met && !s.flags.prince_escape, () => 'A fine carriage with the imperial crest passed through town. Everyone pretended not to stare. Everyone stared.', 3],
    [(s) => seen(s, 'prince_escape'), () => 'There are rumors that a young lord was seen at the night market in a borrowed hat, eating skewers like a peasant.', 5],
    [(s) => seen(s, 'runaway_found'), () => 'The night watchman gives you a knowing nod these days. You nod back. Neither of you says anything.', 3],
    [(s) => seen(s, 'capital'), (s) => `${s.name} keeps saying "in the capital, they..." at dinner. It has been three weeks.`, 3],
    [(s) => seen(s, 'old_friend'), () => 'Your old friend wrote again. The letter smells of pine smoke and has a pressed flower in it.', 3],
    [(s) => s.flags.caught_lying, () => 'The neighbor\'s son told his mother "I\'m at the library" today. You recognize the technique.', 2],
    [(s) => s.dream === 'general' || s.dream === 'swordswoman', (s) => `The blacksmith asked if ${s.name} might want a practice blade "for later." He winked. You did not wink back.`, 2],
    [(s) => s.dream === 'chef' || s.dream === 'teahouse', (s) => `The teahouse owner says that if ${s.name} ever opens her own place, he's retiring out of fear.`, 2],
    [(s) => s.dream === 'astronomer', () => 'Old Xing has started calling your daughter "colleague." He means it completely.', 2],
    // the everyday
    [() => true, () => 'A traveling puppet troupe set up by the stone bridge. Their dragon has lost an eye, which somehow makes it scarier.', 1],
    [() => true, () => 'The magistrate\'s goose escaped again. It is currently winning.', 1],
    [() => true, () => 'Physician Lu is looking for help sorting herbs. He says the pay is "character."', 1],
    [() => true, () => 'A peddler is selling "genuine immortal peaches." They are ordinary peaches. They are very good peaches.', 1],
    [() => true, () => 'The tea caravan came in from the west. The whole market smells faintly of pu\'er.', 1],
    [() => true, () => 'Old Xing claims he saw a new star last night. He claims this every week.', 1],
    [() => true, () => 'The ferryman has a new hat. He is very proud of the new hat. Please compliment the hat.', 1],
    [() => true, () => 'Someone left a basket of eggs on your step with no note. Probably Auntie Bao. It is always Auntie Bao.', 1],
    [() => true, () => 'Two scholars fought a duel over a comma at the teahouse. The comma won.', 1],
  ];
  const SEASON_NEWS = {
    spring: ['Swallows are nesting under the teahouse eaves again.', 'Peach blossoms line the canal. Couples keep "accidentally" meeting there.', 'The river is high with snowmelt, and the ferryman is grumpy about it.', 'Kites everywhere. One is stuck in the temple pine. It has been there since the last emperor.'],
    summer: ['Dragon boat crews practice at dawn. The drums wake the whole town.', 'Lychee season. The market smells like sugar.', 'The frogs in the lotus pond have formed a choir. Nobody asked for it.', 'It is so hot the stray dogs have moved into the temple for the shade. Abbess Jingci allows it.'],
    autumn: ['Mooncake molds are out at Auntie Bao\'s. The queue starts at dawn.', 'The osmanthus is blooming. The whole town smells golden.', 'The rice harvest is in. Even the farmers are smiling.', 'The persimmons on the temple tree are orange as lanterns. The crows got there first.'],
    winter: ['The edges of the lake froze overnight. Children are daring each other.', 'Someone built a snow lion by the temple gate. It looks exactly like Master Gao.', 'Plum blossoms in the snow at the temple. Abbess Jingci says it is a good omen.', 'Chestnut sellers on every corner. Your sleeves smell of roasted chestnuts for a week.'],
  };
  Town.news = function (s) {
    if (!s || s.phase === 'intro') return '';
    if (s.phase === 'finale') return 'Everyone in Peach Blossom Town is up on their rooftops tonight. Nobody says why. Everybody knows.';
    const sea = D.SEASONS[s.turn % 4];
    const h = hash((s.seed || 1) + s.turn * 7919);
    const pool = [];
    NEWS.forEach(([when, text, w]) => {
      try {
        if (when(s)) pool.push([text, w]);
      } catch (e) { /* a condition on a field this save doesn't have */ }
    });
    (SEASON_NEWS[sea] || []).forEach((t) => pool.push([() => t, 1.5]));
    const total = pool.reduce((a, b) => a + b[1], 0);
    let r = (h % 10000) / 10000 * total;
    for (const [text, w] of pool) {
      if ((r -= w) <= 0) return typeof text === 'function' ? text(s) : text;
    }
    return '';
  };

  // ================================================================ courtyard visitors
  // lines: [who, text] with who = 'npc' | 'her'. Her lines may be voice banks, which M.pick resolves.
  const VISITS = {
    mei: [
      { band: 'kid', lines: [['npc', '{name}! {name}! I found a frog with a crooked leg. I named him General.'], ['her', { sunny: 'General Frog! Can he come to dinner?', soft: 'Is he okay? Does his leg hurt?', sassy: 'General of what? The puddle?', dreamy: 'Maybe he\'s a prince under a curse!', earnest: 'He needs clean water. We should build him a pond.' }], ['npc', 'He is in my sleeve. Do you want to hold him?']] },
      { band: 'kid', lines: [['npc', 'Grandma made sesame balls. I only ate four on the way here.'], ['her', { _: 'Only four? Mei, there are two left.', sunny: 'Two for me! Wait. Where are the other ones? Mei!' }], ['npc', 'They were very small sesame balls.']] },
      { band: 'kid', lines: [['npc', 'Want to play kingdoms? You can be the empress this time.'], ['her', { _: 'Then you\'re the dragon!', soft: 'Can we both be empresses?', sassy: 'I\'m ALWAYS the empress. That\'s just correct.' }], ['npc', 'RAAAWR! The dragon demands tribute! Tribute is snacks!']] },
      { band: 'teen', lines: [['npc', 'Did you hear? Wanyin\'s family hired a THIRD tutor.'], ['her', { _: 'A third? What do they even teach her?', sassy: 'Maybe the third one teaches her how to smile.', soft: 'Poor Wanyin. That sounds lonely.' }], ['npc', 'Fan etiquette. Advanced fan etiquette. I\'m not joking.']] },
      { band: 'teen', lines: [['npc', 'Promise we\'ll still be friends when we\'re old and wrinkly.'], ['her', { _: 'Only if you promise to still be this loud.', soft: 'I promise. Pinky promise.', dreamy: 'We\'ll sit on a porch and throw seeds at pigeons. Forever.' }], ['npc', 'I will be SO loud. I\'ll be the loudest grandma in the province.']] },
      { band: 'teen', lines: [['npc', 'The lantern-maker\'s son looked at me today. Or at the wall behind me. It\'s hard to tell.'], ['her', { _: 'Was the wall pretty?', sunny: 'Mei! Tell me everything!', earnest: 'We should find out. Scientifically.' }], ['npc', 'It was a very average wall. So. It was me. Probably.']] },
      { band: 'young', lines: [['npc', 'Grandma invited the matchmaker again. I "accidentally" went to buy vinegar for three hours.'], ['her', { _: 'How long can one person buy vinegar?', sassy: 'Legendary. You\'re my hero.', soft: 'You don\'t want to get married yet?' }], ['npc', 'I want to choose, that\'s all. Is that so much to ask?']] },
      { band: 'young', lines: [['npc', 'Do you ever think about what we\'ll be doing in ten years?'], ['her', (s) => (s.dream ? { _: 'Every day. I know exactly what I want.', dreamy: 'Sometimes. Mostly I think about the stars.' } : { _: 'Honestly? I have no idea.', sassy: 'Something amazing. Details to follow.' })], ['npc', 'Whatever it is, I get to visit. That\'s the rule.']] },
      { when: (s) => seen(s, 'mei_wedding'), lines: [['npc', 'Married life is mostly arguing about where the teapot goes.'], ['her', { _: 'And?', sunny: 'Do you win?' }], ['npc', 'And I love it. Don\'t tell him I said that.']] },
      { when: (s) => s.stress >= 65, lines: [['npc', '{name}, you look like a wrung-out dishcloth.'], ['her', { _: '...Thanks, Mei.', sassy: 'Wow. Thank you. Very kind.' }], ['npc', 'Come play tomorrow. Doctor Mei says so. Doctor Mei is very strict.']] },
    ],
    tao: [
      { band: 'kid', lines: [['npc', 'I-I brought buns. My father said to. I mean, I wanted to. Both.'], ['her', { _: 'Thank you, Tao!', sassy: 'Are they pork? They\'d better be pork.', soft: 'You brought these for me?' }], ['npc', 'They\'re pork. I-I checked. Twice.']] },
      { band: 'kid', lines: [['npc', 'Can you really talk to the stars?'], ['her', { _: 'Only on clear nights.', sassy: 'Only on Tuesdays.', dreamy: 'They mostly talk to me. They\'re very chatty.' }], ['npc', 'W-whoa. Can you ask them if I\'ll be tall?']] },
      { band: 'teen', lines: [['npc', 'Your hair looks... um. Shiny. Today. Like normal. Normal shiny.'], ['her', { _: '...Thank you?', sassy: 'Are you okay, Tao? You\'re very red.', soft: '(She tucks a strand behind her ear.) Oh. Um. Thanks.' }], ['npc', 'I have to go. There\'s a... bun. Emergency. Goodbye!']] },
      { band: 'teen', lines: [['npc', 'I invented a new dumpling. It has a whole shrimp inside. I named it after... no one. It doesn\'t have a name.'], ['her', { _: 'What would you have named it?', sassy: 'You named it after me, didn\'t you.' }], ['npc', 'N-no! ...Maybe. It\'s a very good dumpling.']] },
      { band: 'young', when: (s) => s.flags.tao_love || s.friends.tao >= 50, lines: [['npc', 'I saved you the first batch. I always save you the first batch.'], ['her', { _: 'I know. I always know.', soft: '(She smiles into her sleeve.) I know.' }], ['npc', 'Good. That\'s... good. I\'ll bring more tomorrow.']] },
      { band: 'young', lines: [['npc', 'My father says I can take over the stall next year. My own stall.'], ['her', { _: 'Tao! That\'s wonderful!', sassy: 'Finally. The world is ready for the shrimp dumpling.' }], ['npc', 'You\'ll come eat there? Sometimes? Every day?']] },
    ],
    wanyin: [
      { lines: [['npc', 'I was passing by. Obviously not to see you.'], ['her', { _: 'Obviously.', sunny: 'Wanyin! Come in, come in!' }], ['npc', 'I brought pear candy. Also obviously not for you.']] },
      { band: 'teen', lines: [['npc', 'My father wants me to learn the pipa. I want to learn swordsmanship.'], ['her', { _: 'You\'d be scary with a sword.', sassy: 'You\'d be terrifying. Do it.' }], ['npc', 'Thank you. That is the nicest thing anyone has ever said to me.']] },
      { band: 'young', lines: [['npc', 'My father wants me to marry a magistrate\'s son. I want to sit the exam in the capital.'], ['her', { _: 'Which one wins?', earnest: 'You should sit the exam. You\'d come first.' }], ['npc', 'Me. Obviously. I always win. ...Except against you.']] },
    ],
    prince: [
      { lines: [['npc', 'Don\'t bow. Please. I came over the wall. Nobody knows I\'m here.'], ['her', { _: 'You came over OUR wall?', sassy: 'You know we have a door, right?', soft: 'Are you in trouble?' }], ['npc', 'Doors have guards. Walls have adventure. ...And moss. So much moss.']] },
      { lines: [['npc', 'I brought you a riddle from the palace. The court scholars couldn\'t solve it.'], ['her', { _: 'Give it here.', sassy: 'The court scholars can\'t solve anything.' }], ['npc', 'That is exactly what I told them. They did not laugh.']] },
    ],
    gao: [
      { lines: [['npc', 'Your stance, girl. Show me.'], ['her', { _: '(She drops into a horse stance.) Like this?', sassy: '(Horse stance, with a smirk.) Like this, Master?' }], ['npc', 'Hmph. Adequate. ...Good, even.'], ['her', { _: 'Did you just say good?!' }], ['npc', 'I said adequate.']] },
      { lines: [['npc', 'My knee says it will rain. Keep her training indoors tomorrow.'], ['her', { _: 'Your knee is never wrong, Master?', sassy: 'Does your knee also do weather for weddings?' }], ['npc', 'Never. It was wrong once, in the war. We don\'t talk about that.']] },
    ],
    wen: [
      { lines: [['npc', 'I happened to be in the neighborhood, and happened to have a riddle on me.'], ['her', { _: 'Go on!', sassy: 'You never just "happen" to have a riddle.' }], ['npc', 'What has roots nobody sees, is taller than trees, and yet never grows?'], ['her', { _: 'A mountain!', earnest: 'A mountain. The roots are the bedrock.' }], ['npc', '...Who told you?']] },
      { lines: [['npc', 'She quoted Mencius at me yesterday. Against me. Correctly.'], ['her', { _: 'You said to think for myself!', sassy: 'You walked right into it, Teacher.' }], ['npc', 'I did say that. I regret nothing. Mostly.']] },
    ],
    liu: [
      { lines: [['npc', 'I heard a wrong note from the street and thought: ah, that must be my student.'], ['her', { _: 'It was a creative note!', soft: 'I\'m sorry, Maestro...' }], ['npc', 'A wrong note played with courage is half of music. The other half is practice.']] },
    ],
    hua: [
      { lines: [['npc', 'I was passing. Stand up straight.'], ['her', { _: '(She straightens like a bamboo shoot.)', sassy: '(She straightens. Very, very slowly.)' }], ['npc', 'Better. ...Your {Pc} must be proud.']] },
    ],
    bao: [
      { lines: [['npc', 'I made too many dumplings. I always make too many dumplings. Take these.'], ['her', { _: 'Auntie Bao, you\'re the best!', sassy: 'You made too many on purpose. I know your tricks.' }], ['npc', 'Eat! Eat! Everyone is too thin!']] },
      { lines: [['npc', 'Your girl burned my steamer again. I forgive her. I forgive everyone who eats.'], ['her', { _: 'It was only a little bit on fire!' }], ['npc', 'A little bit on fire is still on fire, child.']] },
    ],
    xing: [
      { lines: [['npc', 'Tonight, look east after the second watch. Something is coming.'], ['her', { _: 'A comet?', dreamy: 'Is it someone from home?' }], ['npc', 'A comet. Or my eyes are going. Either way, look.']] },
      { when: (s) => s.star >= 4, lines: [['npc', 'The Weaver Star flickered when you laughed just now. Did you know that?'], ['her', { _: 'Don\'t tease me, Old Xing.', dreamy: '...I felt it. Like someone waving.' }], ['npc', 'I never tease about stars. Only about my cooking.']] },
    ],
    lu: [
      { lines: [['npc', 'Just checking on my favorite patient. Stick out your tongue.'], ['her', { _: 'Blehhh.', soft: '(She sticks out the very tip of her tongue.)' }], ['npc', 'Healthy. Also rude. Excellent.']] },
    ],
    jingci: [
      { lines: [['npc', 'The carp missed you this week.'], ['her', { _: 'Did they say so?', sassy: 'The carp only miss my rice balls.' }], ['npc', 'In their way. Fish are very honest about rice balls.']] },
    ],
    yue: [
      { lines: [['npc', 'Walk across the yard for me. No, no, like the ground is a drum and you are the rhythm.'], ['her', { _: '(She crosses the yard in three light steps.) Like that?' }], ['npc', 'Like that. See? You were born to it.']] },
    ],
    kid: [
      { band: 'kid', lines: [['npc', 'Is it true you fell out of the sky? Can you do it again? I want to watch.'], ['her', { _: 'It doesn\'t work like that!', sassy: 'Only for paying customers.', dreamy: 'Maybe someday. If I find the ladder.' }], ['npc', 'Aww. Can you at least float a little?']] },
      { lines: [['npc', 'I\'m going to be a general when I grow up. Or a dumpling seller. Maybe both.'], ['her', { _: 'You can be both!', sassy: 'General Dumpling. Has a ring to it.' }], ['npc', 'GENERAL DUMPLING. I\'m telling everyone.']] },
    ],
  };

  // townsfolk who drop by to tell you something about her. {aunt} is how a child of the town addresses you.
  const ABOUT_HER = {
    mei: [
      { when: (s) => s.flags.fight && !s.flags.fight_resolved, lines: [['npc', '{aunt}... she told me about the fight.'], ['her', { _: 'Mei!', sassy: 'MEI. Traitor.' }], ['npc', 'What? It\'s true. She cried at my house for an hour. She misses you. She\'s just too stubborn to say it.']] },
      { when: (s) => s.needs && s.needs.friends < 30, lines: [['npc', '{aunt}, can {name} come out tomorrow? We haven\'t played in forever.'], ['her', { _: 'Can I? Please?', sassy: 'I\'m going. I mean. May I go?' }], ['npc', 'I\'ll bring her back in one piece. Probably two pieces. Joking!']] },
    ],
    tao: [
      { when: (s) => s.flags.tao_love || (s.flags.tao_crush && s.age >= 16), lines: [['npc', '{aunt}. I-I wanted to ask properly. May I walk {name} to the lantern festival?'], ['her', { _: 'Tao!!', soft: '(She hides her whole face behind her sleeves.)' }], ['npc', 'I\'ll have her home before the second watch! I promise! I have a very accurate candle!']] },
    ],
    gao: [
      { when: (s) => s.stats.vigor >= 55, lines: [['npc', 'Your daughter trained until her hands bled. I sent her home. She came back the next morning and did it again.'], ['her', { _: 'You said never give up!', sassy: 'You literally said "never give up," Master.' }], ['npc', 'I said that to the other students. It was not meant for you. ...It was meant for you.']] },
    ],
    wen: [
      { when: (s) => s.stats.wit >= 55, lines: [['npc', 'In thirty years of teaching, three students have made me close my book and think. She is the third.'], ['her', { _: 'Who were the other two?' }], ['npc', 'One is a minister now. The other was me, thirty years ago.']] },
    ],
    bao: [
      { when: (s) => s.stress >= 60, lines: [['npc', 'Auntie Bao\'s orders: this girl eats two bowls tonight. Two! I\'ll know if she doesn\'t.'], ['her', { _: 'Auntie Bao, I\'m fine...', sassy: 'How would you even know?' }], ['npc', 'I always know. Ask anyone. Eat!']] },
    ],
    lu: [
      { when: (s) => s.flags.fever, lines: [['npc', 'Just checking on my favorite patient. No fever? Good.'], ['her', { _: 'I\'m completely better!' }], ['npc', 'Good. And nobody tell her how worried I was that week.']] },
    ],
    xing: [
      { when: (s) => s.star >= 7 && s.turn >= s.turns - 6, lines: [['npc', 'The Weaver Star has been flickering all week. Keep her close.'], ['her', { _: 'Old Xing, you\'re being spooky again.', dreamy: '...I\'ve been dreaming about the river.' }], ['npc', 'The river is getting restless, that is all. Rivers do. Keep her close.']] },
    ],
    jingci: [
      { when: (s) => s.flags.runaway || (s.seen && s.seen.runaway), lines: [['npc', 'The night she ran, she came to the temple. She sat by the carp pond until dawn.'], ['her', { _: 'Abbess!', soft: '(She stares very hard at her shoes.)' }], ['npc', 'I only thought you should know where she goes when her heart is loud.']] },
    ],
  };
  Object.entries(ABOUT_HER).forEach(([id, list]) => (VISITS[id] = (VISITS[id] || []).concat(list.map((v) => Object.assign({ about: true }, v)))));

  function candidates(s) {
    const c = [];
    const add = (id, w) => w > 0 && c.push([id, w]);
    add('mei', s.friends.mei >= 20 ? 1.4 + s.friends.mei / 45 : 0);
    add('tao', s.friends.tao >= 20 || s.flags.tao_crush || s.flags.tao_love ? 1.4 + s.friends.tao / 40 : 0);
    add('wanyin', s.flags.wanyin_friend || s.friends.wanyin >= 30 ? 1.2 : 0);
    add('prince', s.flags.prince_met && s.age >= 14 && s.friends.prince >= 30 ? 0.6 : 0);
    add('gao', count(s, 'martial') >= 3 ? 0.9 : 0);
    add('wen', count(s, 'academy') >= 3 ? 0.9 : 0);
    add('liu', count(s, 'guqin') >= 3 ? 0.8 : 0);
    add('hua', count(s, 'etiquette') >= 3 ? 0.7 : 0);
    add('bao', count(s, 'kitchen') + count(s, 'stall') >= 2 ? 0.9 : 0);
    add('xing', count(s, 'observatory') >= 2 || s.star >= 4 ? 0.8 : 0);
    add('lu', count(s, 'medicine') >= 2 || s.flags.fever ? 0.6 : 0);
    add('jingci', count(s, 'temple') >= 3 || s.flags.runaway || (s.seen && s.seen.runaway) ? 0.6 : 0);
    add('yue', count(s, 'dance') >= 3 && !seen(s, 'yue_last') ? 0.7 : 0);
    add('kid', s.age <= 14 ? 0.5 : 0);
    return c;
  }
  const safe = (f) => {
    try {
      return !!f();
    } catch (e) {
      return false;
    }
  };
  Town.pickVisitor = function (s) {
    const band = M.band(s);
    const c = candidates(s).filter(([id]) => (VISITS[id] || []).some((v) => (!v.band || v.band === band) && (!v.when || safe(() => v.when(s)))));
    if (!c.length) return null;
    const total = c.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * total, id = c[0][0];
    for (const [k, w] of c) if ((r -= w) <= 0) { id = k; break; }
    s.visited = s.visited || {};
    // prefer the conversation she has had least often with this person
    const ok = (v) => (!v.band || v.band === band) && (!v.when || safe(() => v.when(s)));
    const opts = VISITS[id].map((v, i) => [v, i]).filter(([v]) => ok(v));
    // something to tell you about her comes first, once; otherwise the least-heard conversation
    opts.sort((a, b) => (s.visited[id + a[1]] || 0) - (s.visited[id + b[1]] || 0) || (b[0].about ? 1 : 0) - (a[0].about ? 1 : 0) || Math.random() - 0.5);
    const [v, i] = opts[0];
    s.visited[id + i] = (s.visited[id + i] || 0) + 1;
    const vars = { aunt: s.parent.role === 'mom' ? 'Auntie' : 'Uncle' };
    const lines = v.lines.map(([who, text]) => [who, M.pick(s, typeof text === 'function' ? text(s) : text, vars)]);
    return { id, lines };
  };

  // Plays a visit on the courtyard stage. Resolves when the visitor has left (or the scene changed under them).
  Town.playVisit = async function (s, visit, ui) {
    const st = ui.stage;
    const npc = G.NPC[visit.id];
    const her = ui.herActor;
    if (!npc || !npc.outfit || !her) return;
    const alive = () => ui.herActor === her && st.get('visitor');
    const fromLeft = her.x > 150;
    const y = Math.max(140, Math.min(164, her.y + 2));
    const a = st.add({ id: 'visitor', kind: 'npc', x: fromLeft ? -12 : 332, y, anim: 'idle', pal: G.Sprites.palette(npc.look, npc.outfit), cfg: { style: npc.style, male: npc.body === 'man' || npc.body === 'boy', beard: npc.beard }, clickable: true, npc: visit.id, speed: 0.55 });
    st.stopWalk(her);
    await st.walkTo(a, her.x + (fromLeft ? -22 : 22), y);
    if (!alive()) return;
    a.anim = 'stand_side';
    a.dir = fromLeft ? 1 : -1;
    her.anim = 'stand_side';
    her.dir = fromLeft ? -1 : 1;
    st.emote(her, visit.id === 'tao' && s.age >= 13 ? 'heart' : 'bang', 1.4);
    for (const [who, text] of visit.lines) {
      if (!alive()) return;
      const actor = who === 'her' ? her : a;
      ui.bubble(actor, text, 3600);
      if (who === 'her' && /!/.test(text)) her.anim = 'cheer';
      G.Audio.blip && G.Audio.blip();
      await G.U.wait(Math.min(4400, 1600 + text.length * 40));
      if (her.anim === 'cheer') her.anim = 'stand_side';
    }
    if (!alive()) return;
    M.need(s, 'friends', ['mei', 'tao', 'wanyin', 'prince', 'kid'].includes(visit.id) ? 3 : 1);
    if (s.friends[visit.id] != null) s.friends[visit.id] = Math.min(100, s.friends[visit.id] + 1);
    await G.U.wait(900);
    if (!alive()) return;
    her.anim = 'idle';
    if (/^(mei|tao|wanyin|kid)$/.test(visit.id) && Math.random() < 0.5) st.emote(her, 'heart', 1.5);
    await st.walkTo(a, fromLeft ? -14 : 334, y);
    st.remove('visitor');
  };
})();
