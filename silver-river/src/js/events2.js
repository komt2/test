/* Silver River — more of the town's life: the people around her have their own stories,
   and she acts on her own more and more as she grows. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const EV = (G.Events = G.Events || []);
  const add = (e) => EV.push(e);
  const cnt = (s, id) => s.counts[id] || 0;

  // ================================================================ THE PEOPLE AROUND HER
  add({
    id: 'mei_lantern', phase: 'mid', weight: 2, when: (s) => s.friends.mei >= 35 && s.age >= 11 && !s.flags.mei_lantern,
    async run(g) {
      g.flag('mei_lantern', true);
      await g.scene('town');
      g.npc('mei', 'right');
      await g.say('mei', 'The lantern contest is next month and our shop needs to win. Business has been so slow... I\'m building a rabbit. A HUGE rabbit. Will you help me paint it?');
      const c = await g.choose(['"Go help her. Lanterns can wait for no one."', '"Only after your lessons."', '"Not this time."']);
      if (c === 0) { g.stat('art', 2); g.stress(4); g.friend('mei', 12); g.parent(2, -2); await g.her('joy', 'I\'ll paint the ears! The ears are the most important part!'); g.remember({ id: 'rabbit_lantern', title: 'The rabbit lantern', caption: 'Two painters, one enormous rabbit.', text: 'painting the giant rabbit lantern with Mei', weight: 4, val: 1, tags: ['friend', 'mei'], photo: { scene: 'town', tod: 'night', anim: 'cheer', expr: 'joy', npcs: ['mei'] } }); }
      if (c === 1) { g.friend('mei', 5); g.parent(0, 3); await g.her('neutral', 'I\'ll come in the evenings, Mei. Promise.'); }
      if (c === 2) { g.friend('mei', -6); await g.say('mei', 'Oh. That\'s... okay. It\'s fine.'); await g.her('sad', '...'); }
      g.clearNpcs();
    },
  });

  add({
    id: 'tao_father', phase: 'mid', weight: 2, when: (s) => s.friends.tao >= 30 && s.age >= 12 && !s.flags.tao_father,
    async run(g) {
      g.flag('tao_father', true);
      await g.scene('market');
      g.npc('tao', 'right');
      await g.nar('The dumpling stall has only one cook today. Tao\'s father hurt his back carrying flour, and Tao is trying to do everything at once. There is flour in his eyebrows.');
      await g.say('tao', 'I\'m f-fine! Totally fine! Everything is under control! (Something in the steamer catches fire.)');
      await g.her('worried', g.P + ', can I help him this week? Please?');
      const c = await g.choose(['"Go. Take an apron."', '"You have your own lessons."']);
      if (c === 0) {
        g.stat('craft', 3); g.stat('heart', 2); g.stress(5); g.friend('tao', 15);
        await g.nar('By the end of the week the stall is running better than ever. Tao\'s father insists on paying her in buns. Forever.');
        g.remember({ id: 'tao_stall', title: 'The dumpling week', caption: 'Flour in everyone\'s eyebrows.', text: 'the week I ran the dumpling stall with Tao', weight: 5, val: 1, tags: ['friend', 'tao'], photo: { scene: 'market', anim: 'cook', expr: 'joy', npcs: ['tao'] } });
      } else { g.parent(0, 3); g.friend('tao', -3); await g.her('pout', 'Okay...'); }
      g.clearNpcs();
    },
  });

  add({
    id: 'gao_past', phase: 'mid', weight: 3, when: (s) => cnt(s, 'martial') >= 4 && !s.flags.gao_past,
    async run(g) {
      g.flag('gao_past', true);
      await g.scene('hall', { tod: 'dusk' });
      g.npc('gao', 'mentor');
      await g.nar('After practice, Master Gao sits on the steps rubbing his bad knee. For once he doesn\'t send her home.');
      await g.say('gao', 'You want to know why an old soldier teaches children? Twenty years ago my general ordered us to burn a village. I refused. They took my rank, and my knee.');
      await g.say('gao', 'A sword is for protecting. Never for proving. If you learn nothing else from me, learn that.');
      await g.her('determined', 'I\'ll remember, Master Gao.');
      g.stat('heart', 2); g.trait('fiery', -3);
      g.learn('fact', 'gao', 'Master Gao lost his rank for refusing an order to burn a village.');
      g.remember({ id: 'gao_sword', text: 'what Master Gao told me about swords', letter: 'Master Gao once told me a sword is for protecting, never for proving. I think you already knew that. I think that\'s why you let me learn.', weight: 5, val: 1, tags: ['mentor'] });
      g.clearNpcs();
    },
  });

  add({
    id: 'wen_poem', phase: 'mid', weight: 3, when: (s) => cnt(s, 'academy') >= 4 && !s.flags.wen_poem,
    async run(g) {
      g.flag('wen_poem', true);
      await g.scene('academy');
      g.npc('wen', 'mentor');
      await g.nar('Scholar Wen is on his hands and knees, searching every shelf. The only copy of a poem his late wife wrote has gone missing.');
      await g.say('wen', 'Forty years... and I cannot remember the third line. I can remember every classic in the empire, and not her third line.');
      if (g.check('wit', 45)) {
        await g.her('thinking', 'You read it to us once, in the spring. "The swallows return before the plum rain; / I keep the lamp lit, though you know the way..."');
        await g.nar('Scholar Wen stares at her. Then he writes it down with a shaking hand, and doesn\'t speak for a long time.');
        g.stat('wit', 3); g.esteem(6);
        g.remember({ id: 'wen_poem', text: 'remembering Scholar Wen\'s poem', letter: 'Do you remember when I recited Scholar Wen\'s lost poem? He framed it. It hangs in the academy now, next to a note with my name on it.', weight: 6, val: 1, tags: ['mentor', 'pride'] });
      } else {
        await g.her('sad', 'I\'m sorry, Scholar Wen. I don\'t remember it either.');
        await g.nar('They search together until dark. It turns up inside a dictionary, used as a bookmark. He laughs until he cries.');
        g.stat('heart', 2);
      }
      g.clearNpcs();
    },
  });

  add({
    id: 'bao_secret', phase: 'mid', weight: 3, when: (s) => cnt(s, 'kitchen') >= 4 && !s.flags.bao_secret,
    async run(g) {
      g.flag('bao_secret', true);
      await g.scene('kitchen');
      g.npc('bao', 'mentor');
      await g.say('bao', 'Come here. Closer. I\'m getting old and somebody has to know. The secret of my dumplings...');
      await g.say('bao', '...is that I make every batch for somebody. Not for customers. For somebody. You taste the difference. Now go and never tell anyone.');
      await g.her('teary', 'That\'s the most beautiful thing anyone has ever said about a dumpling.');
      g.stat('craft', 3); g.stat('heart', 1);
      g.learn('fact', 'bao', 'Auntie Bao told her the secret of her dumplings. She won\'t tell you what it is.');
      g.clearNpcs();
    },
  });

  add({
    id: 'xing_comet', phase: 'mid', weight: 3, when: (s) => cnt(s, 'observatory') >= 3 && !s.flags.xing_comet,
    async run(g) {
      g.flag('xing_comet', true);
      await g.scene('observatory');
      g.npc('xing', 'mentor');
      await g.nar('A comet crosses the sky, trailing silver. Old Xing watches it with tears in his beard.');
      await g.say('xing', 'Six years ago I was sitting right here on Qixi night. I saw a star fall toward Peach Blossom Town. I wrote it down. I never told anyone. I thought I was going mad.');
      await g.her('surprised', 'You saw me fall?');
      await g.say('xing', 'I saw the most beautiful thing in forty years of looking up. And now it is learning to look up too.');
      g.s.star += 2;
      g.stat('wit', 2);
      g.remember({ id: 'xing_comet', title: 'The comet', caption: 'Old Xing saw her fall, all those years ago.', text: 'the night Old Xing told me he saw me fall', weight: 6, val: 1, tags: ['star', 'mentor'], photo: { scene: 'observatory', tod: 'night', anim: 'stars', expr: 'surprised', npcs: ['xing'] } });
      g.clearNpcs();
    },
  });

  add({
    id: 'jingci_past', phase: 'mid', weight: 3, when: (s) => cnt(s, 'temple') >= 4 && !s.flags.jingci_past,
    async run(g) {
      g.flag('jingci_past', true);
      await g.scene('temple', { tod: 'dusk' });
      g.npc('jingci', 'mentor');
      await g.her('thinking', 'Abbess, were you always a nun?');
      await g.say('jingci', 'No. Once I was a lady of the palace, with forty hairpins and no say in anything. One night I walked out of the gate in my slippers and kept walking until I reached this mountain.');
      await g.say('jingci', 'Every life is borrowed, child. Make sure you are the one who chooses what to do with yours.');
      g.stat('heart', 2); g.need('freedom', 5);
      g.learn('fact', 'jingci', 'Abbess Jingci was once a palace lady who walked away from it all.');
      g.clearNpcs();
    },
  });

  add({
    id: 'liu_friend', phase: 'mid', weight: 3, when: (s) => cnt(s, 'guqin') >= 4 && !s.flags.liu_friend,
    async run(g) {
      g.flag('liu_friend', true);
      await g.scene('teahouse');
      g.npc('liu', 'mentor');
      if (g.s.parent.bg === 'musician') {
        await g.nar('You come to fetch her from her lesson. Maestro Liu looks up, and the teacup falls from his hand.');
        await g.say('liu', 'It can\'t be. After twenty years? You vanished from the palace without a word! I thought you were dead!');
        await g.her('surprised', 'You two KNOW each other?!');
        await g.say('liu', 'Know each other? Your parent and I played for the Empress together. We were the best duet in the empire. Until someone decided to run away and raise chickens.');
        const c = await g.choose(['"I\'m sorry, old friend. I should have written."', '"Some things are more important than the palace."']);
        g.bond(4); g.stat('art', 3);
        await g.nar('That evening the two of you play together for the first time in twenty years. She sits between you with her eyes closed.');
        g.remember({ id: 'duet', title: 'The duet', caption: 'Two old friends, one guqin each.', text: 'the night you and Maestro Liu played together', letter: 'I will never forget the night you and Maestro Liu played your old duet. I didn\'t know you could play like that. I didn\'t know you had given it up for me.', weight: 9, val: 1, tags: ['parent', 'music'], photo: { scene: 'teahouse', tod: 'night', anim: 'guqin', expr: 'love', npcs: ['liu'] } });
        void c;
      } else {
        await g.say('liu', 'I had a friend once who played better than me. One day he vanished. His guqin was never found.');
        await g.nar('A season later, she spots an old guqin at the market with a crane carved on it, exactly as he described. She spends all her savings on it.');
        const c = await g.choose(['Add the rest of the money yourself. (30 coins)', 'Let her pay for it herself.']);
        if (c === 0) { g.gold(-30); g.bond(3); } else { g.stat('craft', 1); g.esteem(3); }
        await g.say('liu', '...This is his. Where did you... Child. Thank you.');
        g.stat('art', 2); g.stat('heart', 2);
      }
      g.clearNpcs();
    },
  });

  add({
    id: 'yue_last', phase: 'mid', weight: 3, when: (s) => cnt(s, 'dance') >= 4 && s.age >= 14 && !s.flags.yue_last,
    async run(g) {
      g.flag('yue_last', true);
      await g.scene('palace', { tod: 'night' });
      g.npc('yue', 'mentor');
      await g.say('yue', 'This will be my last performance. My knees have decided to retire before I have. I want you to dance the final piece beside me.');
      await g.her('worried', 'Me? In front of everyone?');
      const c = await g.choose(['"You were born for this. Go."', '"Only if you want to."']);
      if (c === 1) g.trust(3);
      if (g.check('art', 40)) { g.stat('art', 3); g.stat('grace', 2); g.esteem(6); await g.nar('Teacher and student dance the last piece together. When the music ends, Dancer Yue bows, not to the audience, but to her.'); }
      else { g.stat('grace', 2); await g.nar('She stumbles once. Dancer Yue catches her hand mid-turn and turns the stumble into a spin. Nobody notices. She will never forget it.'); }
      g.remember({ id: 'yue_last', title: 'The last dance', caption: 'Dancer Yue\'s final performance.', text: 'dancing beside Dancer Yue at her last performance', weight: 5, val: 1, tags: ['mentor'], photo: { scene: 'palace', tod: 'night', anim: 'dance', expr: 'joy', npcs: ['yue'] } });
      g.clearNpcs();
    },
  });

  add({
    id: 'hua_softens', phase: 'mid', weight: 3, when: (s) => cnt(s, 'etiquette') >= 4 && !s.flags.hua_softens,
    async run(g) {
      g.flag('hua_softens', true);
      await g.scene('palace');
      g.npc('hua', 'mentor');
      await g.say('hua', 'You think I\'m cruel. You\'re right to. The court I learned in was far crueler, and I would rather you learn to walk on ice here, with me, than there, alone.');
      await g.nar('She presses a small jade hairpin into her palm.');
      await g.say('hua', 'It was mine when I was your age. Don\'t lose it. And don\'t tell anyone I was kind to you.');
      g.stat('grace', 3); g.esteem(3);
      g.learn('fact', 'hua', 'Madam Hua gave her a jade hairpin from her own girlhood at court.');
      g.clearNpcs();
    },
  });

  add({
    id: 'wanyin_music', phase: 'mid', weight: 3, when: (s) => s.flags.wanyin_friend && !s.flags.wanyin_music,
    async run(g) {
      g.flag('wanyin_music', true);
      await g.scene('town');
      g.npc('wanyin', 'right');
      await g.say('wanyin', 'My father has forbidden me from studying the guqin. He says music is for entertainers, not for magistrates\' daughters. Would your family... speak to him?');
      const c = await g.choose(['Go and speak to the magistrate yourself.', 'Let your daughter plead Wanyin\'s case.', '"It isn\'t our place to interfere."']);
      if (c === 0) { g.parent(3, 2); await g.nar('The magistrate listens to you with a face like thunder. A week later, Wanyin has a guqin teacher. Nobody is quite sure why.'); g.friend('wanyin', 15); g.bond(2); }
      if (c === 1) { if (g.check('grace', 45)) { g.esteem(6); g.friend('wanyin', 20); await g.her('smug', 'He said yes! I talked for an hour. I used all seventeen polite ways to say thank you!'); } else { g.friend('wanyin', 8); await g.her('sad', 'He said no. But Wanyin says nobody has ever stood up to him for her before.'); } }
      if (c === 2) { g.friend('wanyin', -5); g.parent(0, 2); }
      g.clearNpcs();
    },
  });

  add({
    id: 'mei_wedding', phase: 'mid', weight: 3, when: (s) => s.age >= 17 && s.friends.mei >= 45 && !s.flags.mei_wedding,
    async run(g) {
      g.flag('mei_wedding', true);
      await g.scene('garden', { tod: 'dusk' });
      g.npc('mei', 'right');
      await g.say('mei', 'I\'m getting married in the spring! To the lantern maker\'s son from the next valley. And I need a bridesmaid. And it has to be you. It was always going to be you.');
      await g.her('cry', { _: 'Mei! You\'re getting MARRIED? When did we get old enough to get married?!', sassy: 'You\'re abandoning me for a boy with lanterns? ...Of course I\'ll be your bridesmaid, you idiot.' });
      g.friend('mei', 15);
      g.remember({ id: 'mei_wedding', title: 'Bridesmaid', caption: 'Of course it was always going to be her.', text: 'the day Mei asked me to be her bridesmaid', weight: 6, val: 1, tags: ['friend', 'mei'], photo: { scene: 'garden', tod: 'dusk', anim: 'love', expr: 'teary', npcs: ['mei'] } });
      g.clearNpcs();
    },
  });

  add({
    id: 'prince_escape', phase: 'mid', weight: 3, when: (s) => s.flags.prince_route && !s.flags.prince_escape,
    async run(g) {
      g.flag('prince_escape', true);
      await g.scene('town', { tod: 'night' });
      g.npc('prince', 'right');
      await g.nar('There is a knock at the back gate at midnight. It is the crown prince, in a borrowed farmer\'s coat, grinning like a boy.');
      await g.say('prince', 'I escaped. Don\'t look at me like that. I want to see the night market. The real one. Will you show me? I\'ll be back before the guards change.');
      const c = await g.choose(['"Go. I\'ll cover for you both."', '"Take her, but be home by the third bell."', '"Absolutely not. Go back to the palace, Your Highness."']);
      if (c <= 1) { g.friend('prince', 15); g.need('freedom', 15); g.trust(6); await g.her('love', 'Come on, Jing! You have to try the stinky tofu. No, you HAVE to.'); g.remember({ id: 'night_market', title: 'Night market', caption: 'A prince, a star, and stinky tofu.', text: 'showing Jing the night market', weight: 6, val: 1, tags: ['love', 'prince'], photo: { scene: 'market', tod: 'night', anim: 'cheer', expr: 'love', npcs: ['prince'] } }); }
      else { g.friend('prince', -5); g.parent(-1, 6); g.need('freedom', -10); await g.her('pout', 'You\'re so strict!'); }
      g.clearNpcs();
    },
  });

  add({
    id: 'kittens', phase: 'mid', weight: 2, when: (s) => s.flags.pet && s.turn >= 6 && !s.flags.kittens,
    async run(g) {
      g.flag('kittens', true);
      await g.scene('home');
      await g.nar(g.s.flags.pet + ' has been getting rounder. This morning, in a basket of clean laundry, there are four tiny kittens.');
      await g.her('love', { _: 'KITTENS! Can we keep them? All of them? Look at this one, it has a star on its nose!', sassy: 'I\'m naming them all. You can\'t stop me. This one is Emperor Sneeze.' });
      const c = await g.choose(['Keep them all. Why not.', 'Keep the one with the star; find homes for the rest.']);
      if (c === 0) { g.bond(4); g.stat('heart', 2); g.gold(-10); await g.nar('The courtyard is now, officially, a cat kingdom.'); }
      else { g.bond(2); g.stat('heart', 3); await g.nar('She finds each kitten a family herself, and checks on every one of them weekly.'); }
      g.remember({ id: 'kittens', title: 'Kittens', caption: 'Four kittens in the laundry.', text: 'the morning the kittens were born', weight: 4, val: 1, tags: ['pet'], photo: { scene: 'home', anim: 'love', expr: 'love' } });
    },
  });

  add({
    id: 'old_friend', phase: 'mid', weight: 2, when: (s) => s.age >= 13 && !s.flags.old_friend,
    async run(g) {
      g.flag('old_friend', true);
      const who = { general: 'a grizzled soldier who served under you at the northern pass', scholar: 'your old study partner, now a magistrate in the south', merchant: 'a desert trader you once pulled out of a sandstorm', physician: 'a woman whose child you saved during the plague winter', musician: 'a court lady who still hums your songs', tea: 'the tea master who once called your leaves ordinary' }[g.s.parent.bg];
      const story = { general: 'held the pass alone for a night so the rest of us could sleep', scholar: 'gave away the answers to the exam to a poor student, and failed yourself', merchant: 'walked back into the storm for a stranger\'s camel', physician: 'didn\'t sleep for forty nights', musician: 'made the Empress cry with one song', tea: 'proved me wrong, and I have never been happier to be wrong' }[g.s.parent.bg];
      await g.scene('home');
      await g.nar('A visitor comes to your gate: ' + who + '. Over tea, they tell her stories about you. You try to stop them. They do not stop.');
      await g.nar('"Did you know your ' + (g.s.parent.role === 'mom' ? 'mother' : 'father') + ' once ' + story + '?"');
      await g.her('surprised', { _: g.P + '! You never told me any of this!', sassy: 'Excuse me? You were COOL?' });
      g.bond(4); g.trust(3);
      g.remember({ id: 'old_friend', text: 'the day your old friend told me stories about you', letter: 'When your old friend visited and told me how you ' + story + ', I looked at you differently. Like you were a whole person, not just my ' + g.P + '. I liked both.', weight: 6, val: 1, tags: ['parent'] });
    },
  });

  // ================================================================ HER OWN INITIATIVE
  add({
    id: 'tea_for_you', phase: 'mid', priority: 18, when: (s) => s.focus === 'work' && s.bond >= 45 && !s.flags.tea_for_you,
    async run(g) {
      g.flag('tea_for_you', true);
      await g.scene('home', { tod: 'night' });
      await g.nar('You come home late again, bone-tired. There is a pot of tea waiting, still warm, and a note in her handwriting.');
      await g.nar('"You work too hard. Drink this. It has honey in it. Don\'t argue. — ' + g.name + '"');
      await g.her('shy', '(From the doorway) ...Did you drink it?');
      g.bond(3); g.stat('heart', 2);
      g.remember({ id: 'tea_note', text: 'the tea I left for you', letter: 'Do you still have the note I left with your tea, back when you worked every night? I found it in your drawer once. You kept it.', weight: 6, val: 1, tags: ['parent'] });
    },
  });

  add({
    id: 'gift_for_you', phase: 'mid', weight: (s) => (s.bond >= 60 ? 3 : 0), when: (s) => s.bond >= 60 && s.turn >= 4 && !s.flags.gift_for_you,
    async run(g) {
      g.flag('gift_for_you', true);
      const top = Object.keys(g.s.stats).sort((a, b) => g.s.stats[b] - g.s.stats[a])[0];
      const gift = { vigor: 'a walking stick she carved and sanded herself, "for your knees"', wit: 'a scroll with a poem about you, in her very best calligraphy', art: 'a song she wrote for you, played badly and perfectly on the guqin', grace: 'a tea ceremony, just for you, with every one of the seventeen polite thank-yous', heart: 'a charm she carried to the temple every day for a month', craft: 'a basket of dumplings, each one folded into a different animal' }[top];
      await g.scene('home');
      await g.her('shy', { _: 'Close your eyes. No peeking. ...Okay, open!', sassy: 'Don\'t make a big deal about this. Here.' });
      await g.nar('It is ' + gift + '.');
      const c = await g.choose(['Hug her tight.', 'Tell her it\'s the best gift you\'ve ever received.']);
      g.bond(4); g.esteem(3); void c;
      g.remember({ id: 'gift_for_you', title: 'A gift for you', caption: 'No reason. Just because.', text: 'the gift I made for you', letter: 'I made you ' + gift + ' once, for no reason at all. You looked at me like I\'d given you the moon.', weight: 7, val: 1, tags: ['parent'], photo: { scene: 'home', anim: 'love', expr: 'shy' } });
    },
  });

  add({
    id: 'defends_kid', phase: 'mid', weight: 2, when: (s) => s.stats.heart >= 35 && s.traits.bold > -20 && s.age >= 12 && !s.flags.defends_kid,
    async run(g) {
      g.flag('defends_kid', true);
      await g.scene('town');
      await g.nar('A woman you barely know stops you in the market and grabs both your hands.');
      await g.nar('"Your daughter stood between my son and three bigger boys today. She didn\'t hit anyone. She just stood there until they left. I wanted you to know."');
      await g.her('shy', { _: 'It wasn\'t a big deal...', sassy: 'They were being idiots. Someone had to be less of an idiot.' });
      const c = await g.choose(['"I\'m so proud of you."', '"That was brave, but be careful."']);
      g.esteem(c === 0 ? 7 : 4); g.stat('heart', 2); g.trait('bold', 3);
      if (c === 0) g.bond(2);
    },
  });

  add({
    id: 'caught_lying', phase: 'mid', weight: 2, when: (s) => s.age >= 13 && s.trust < 55 && s.secrets.length > 0 && !s.flags.caught_lying,
    async run(g) {
      g.flag('caught_lying', true);
      await g.scene('home', { tod: 'dusk' });
      await g.nar('She told you she was at the library. The librarian mentions, very kindly, that she hasn\'t been in for weeks.');
      await g.her('worried', 'I... I can explain.');
      const c = await g.choose(['"Then explain. I\'m listening."', '"You lied to me. You\'re grounded."', '"I\'m not angry. I\'m sad you felt you had to lie."']);
      const sec = g.s.secrets[0];
      if (c === 0 || c === 2) {
        if (sec) { await g.nar('It all comes out: ' + sec.text.charAt(0).toLowerCase() + sec.text.slice(1)); g.learn('fact', sec.id, sec.text); }
        g.trust(c === 2 ? 8 : 5); g.bond(2); g.parent(3, 1);
        await g.her('teary', 'I\'m sorry. I should have just told you.');
      } else {
        g.trust(-6); g.bond(-5); g.parent(-2, 7); g.flag('grounded', g.s.turn + 1);
        await g.her('angry', 'Fine! This is exactly why I didn\'t tell you!');
      }
    },
  });

  add({
    id: 'runaway', phase: 'mid', priority: 40, when: (s) => s.age >= 14 && !s.flags.runaway && (s.bond < 22 || (s.flags.rebellious || 0) >= 3),
    async run(g) {
      g.flag('runaway', true);
      await g.scene('mountain', { tod: 'night' });
      await g.nar('Her bed is empty. Her travel bag is gone. On her pillow: "Don\'t look for me."');
      await g.nar('You search all night. At dawn you find her on the mountain path, sitting on a rock, shivering, looking at the stars.');
      await g.her('cry', { _: 'I don\'t even know where I was going. I just couldn\'t stay.', sassy: 'Great. Found. I didn\'t even make it to the next village. Go ahead and yell.' });
      const c = await g.choose(['Wrap your coat around her and sit down beside her.', '"How could you do this to me?"']);
      if (c === 0) {
        g.bond(10); g.trust(8); g.parent(6, -4); g.need('love', 25);
        await g.nar('You sit together until the sun comes up. Neither of you says much. On the way home, she holds your sleeve like she did when she was small.');
        g.remember({ id: 'runaway_found', text: 'the night I ran away and you found me', letter: 'The night I ran away, you didn\'t shout. You gave me your coat and watched the sunrise with me. I think that\'s the night I decided to come home for real.', weight: 9, val: 1, tags: ['parent'] });
      } else {
        g.bond(-4); g.parent(-3, 5);
        g.remember({ id: 'runaway_angry', text: 'the night I ran away', letter: 'When I ran away, you asked how I could do that to you. I didn\'t know how to tell you I wasn\'t doing it to you. I was just drowning.', weight: 7, val: -1, tags: ['parent'] });
      }
    },
  });
})();
