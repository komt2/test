/* Silver River — story events. Each event: { id, phase: 'intro'|'start'|'mid', when(s), weight, priority, run(g) }.
   g is the script context from Sim.ctx: g.her(expr, text), g.say(who, text), g.nar(text), await g.choose([...]) ... */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const D = G.D;
  const M = G.Mind;
  const EV = (G.Events = G.Events || []);
  const add = (e) => EV.push(e);
  const season = (s) => D.SEASONS[s.turn % 4];

  const NAMES = ['Xing', 'Xingyue', 'Mingyue', 'Lian', 'Yunxi', 'Xiaoxing', 'Chenxi', 'Ruoxi', 'Wanxing', 'Yuxin'];
  G.suggestName = () => U.pick(NAMES);

  // ================================================================ ARRIVAL
  add({
    id: 'arrival', phase: 'intro', priority: 100,
    async run(g) {
      await g.scene('home', { tod: 'night', season: 'summer', noHer: true });
      await g.nar('It is the night of Qixi. Once a year, magpies build a bridge across the Silver River so the Weaver Girl and the Cowherd can meet.');
      await g.nar('You sit alone in your courtyard with a cup of cooling tea, watching the sky. One of the stars begins to fall.');
      await g.nar('It grows brighter, and brighter, and lands in your peach tree with a sound like a temple bell.');
      g.io.herAppear && (await g.io.herAppear('sit'));
      await g.nar('In the glow sits a little girl. Her hair shines like spun starlight, and she is holding a golden star-shaped hairpin in both hands.');
      await g.her('surprised', {
        sunny: 'Oh! Hello! Is this the ground? It\'s very hard.',
        soft: 'A-are you going to send me away?',
        sassy: 'Where am I? Who are you? Why is your tree so pointy?',
        dreamy: 'The stars were singing, and then they stopped. Are you a star too?',
        earnest: 'I apologize for landing in your tree. I don\'t know how I got here.',
      });
      const c = await g.choose([
        'Kneel beside her. "You\'re safe here."',
        '"Are you hurt? Let me look at you."',
        'Offer her your cup of tea.',
        '"Where did you come from, little one?"',
      ]);
      if (c === 0) { g.parent(5, 0); g.bond(4); g.need('love', 10); await g.her('teary', 'Safe... okay. Okay.'); }
      if (c === 1) { g.parent(4, 2); g.bond(3); await g.her('shy', 'Just my knee. And my pride.'); }
      if (c === 2) { g.parent(3, -2); g.bond(3); g.trait('playful', 4); await g.her('happy', '...It\'s cold. But it\'s nice. Thank you.'); }
      if (c === 3) { g.trait('dreamy', 3); await g.her('thinking', 'From up there, I think. I don\'t remember anything else.'); }
      await g.her('sad', 'I don\'t even remember my name.');
      const name = await g.input('What will you name her?', g.s.name);
      g.s.name = (name || g.s.name).trim().slice(0, 16) || g.s.name;
      await g.her('shy', g.s.name + '... ' + g.v({ _: 'I like it.', sassy: 'Hm. Acceptable. No, I like it. I like it a lot.', sunny: 'I LOVE it!' }));
      await g.her('thinking', 'Are you... my ' + (g.s.parent.role === 'mom' ? 'mama' : 'baba') + ' now?');
      const d = await g.choose(['"Yes. From tonight on, I am."', '"If you want me to be."', '"I\'ll take care of you, whatever you call me."']);
      if (d === 0) { g.parent(4, 2); g.bond(4); }
      if (d === 1) { g.parent(3, -3); g.bond(3); g.trust(4); }
      if (d === 2) { g.parent(2, 0); g.bond(2); }
      await g.her('joy', 'Then I\'ll call you ' + g.P + '.');
      g.remember({ id: 'arrival', title: 'The night she fell', caption: 'Qixi. A star landed in the peach tree.', text: 'the night she fell from the stars', weight: 6, val: 1, tags: ['parent', 'star'], photo: { scene: 'home', tod: 'night', anim: 'sit', expr: 'happy' } });
      await g.nar('You carry her inside. She is asleep before you reach the door, the star hairpin still clutched in her hand.');
    },
  });

  // ================================================================ FIRST DAYS
  add({
    id: 'first_morning', phase: 'start', priority: 90, when: (s) => s.turn === 0,
    async run(g) {
      await g.scene('home');
      await g.nar('The next morning you wake to the smell of something burning.');
      await g.her('worried', {
        sunny: 'Good morning! I made breakfast! It\'s... mostly black. Black is a food color, right?',
        soft: 'I-I wanted to make you breakfast. I\'m sorry. I ruined the pot.',
        sassy: 'Don\'t look in the kitchen. Just don\'t.',
        dreamy: 'I was making congee, and then a bird sat on the window, and then... this.',
        earnest: 'I have made breakfast. It did not go according to plan.',
      });
      const c = await g.choose(['Eat it anyway, bravely.', 'Laugh and cook a new pot together.', '"The kitchen is dangerous. Ask me first next time."']);
      if (c === 0) {
        g.bond(5); g.parent(5, -1);
        await g.her('laugh', 'You\'re making a face! You hate it! ...You\'re still eating it?');
        g.remember({ id: 'burnt_congee', text: 'You ate my burnt congee on my first morning.', letter: 'On my very first morning you ate my burnt congee and said it was the best you\'d ever had. You are a terrible liar. I loved you for it.', weight: 6, val: 1, tags: ['parent', 'food'] });
      } else if (c === 1) {
        g.bond(4); g.stat('craft', 2); g.trait('playful', 3); g.parent(4, 0);
        await g.her('joy', 'Can I stir? I\'ll stir so carefully.');
        g.remember({ id: 'first_cook', text: 'We cooked our first breakfast together.', letter: 'I still stir congee the way you showed me on my first morning, slowly, humming.', weight: 5, val: 1, tags: ['parent', 'food'] });
      } else {
        g.parent(0, 5); g.stat('heart', 1);
        await g.her('sad', 'Okay. I\'m sorry.');
        g.trait('bold', -3);
      }
      const k = g.s.traits.diligent > g.s.traits.playful ? 'diligent' : 'playful';
      g.learn('trait', k, k === 'diligent' ? 'She tries very hard to be useful.' : 'She turns everything into a game, even disasters.');
    },
  });

  add({
    id: 'meet_mei', phase: 'mid', priority: 60, when: (s) => s.turn >= 1 && s.turn <= 4,
    async run(g) {
      await g.scene('home');
      g.npc('mei', 'right');
      await g.say('mei', 'Hello! I\'m Mei, from the lantern shop! Is it true a star girl lives here? Can she come out and play?');
      const shy = g.s.traits.bold < -15;
      await g.her(shy ? 'shy' : 'surprised', shy ? '(She hides behind you and peeks out at Mei.)' : 'Me? You want to play with me?');
      const c = await g.choose(['Gently nudge her forward.', 'Let her decide on her own.', 'Invite Mei in for sweets.']);
      if (c === 0) { g.trait('bold', 4); g.parent(2, 3); }
      if (c === 1) { g.parent(2, -3); g.trust(3); }
      if (c === 2) { g.gold(-5); g.bond(2); g.friend('mei', 6); }
      await g.her('joy', 'Mei says she can show me where the frogs live!');
      g.friend('mei', 12);
      g.need('friends', 25);
      g.remember({ id: 'mei_first', title: 'Her first friend', caption: 'Mei came knocking at the gate.', text: 'the day Mei knocked on our gate', weight: 4, val: 1, tags: ['friend', 'mei'], photo: { scene: 'home', anim: 'cheer', expr: 'joy', npcs: ['mei'] } });
      g.diary('I have a friend. Her name is Mei and she knows where the frogs live.');
      g.clearNpcs();
    },
  });

  add({
    id: 'storm', phase: 'mid', weight: (s) => (s.fav.fear === 'thunderstorms' ? 5 : 2),
    when: (s) => (s.age <= 14 || s.fav.fear === 'thunderstorms') && ['autumn', 'summer', 'spring'].includes(season(s)),
    async run(g) {
      await g.scene('room', { tod: 'night' });
      await g.nar('Thunder rolls over the valley, so loud the shutters rattle. A moment later your door creaks open.');
      const afraid = g.s.fav.fear === 'thunderstorms';
      await g.her(afraid ? 'cry' : 'worried', afraid
        ? { _: g.P + '... can I stay here? Just until it stops?', sassy: 'I\'m NOT scared. I just... heard a noise. Can I stay?', sunny: 'I\'m checking that you\'re not scared! ...Can I stay?' }
        : { _: g.P + ', the storm is so loud. Can I sit with you for a bit?' });
      if (afraid) g.learn('fav', 'fear', 'She is terrified of thunderstorms.');
      const opts = ['Lift the blanket. "Come here."', 'Tell her a story until the storm passes.', '"You\'re brave. Go back to bed."'];
      if (g.knows('fav', 'food')) opts.push('Warm up some ' + g.s.fav.food + ' for her.');
      const c = await g.choose(opts);
      if (c === 0) {
        g.bond(6); g.need('love', 15); g.parent(5, -1); g.trust(4);
        await g.her('sleep', '(She is asleep before the next thunderclap.)');
        g.remember({ id: 'storm', title: 'The storm', caption: 'She fell asleep before the next thunderclap.', text: 'the storm night', letter: 'The night of the big storm, you held me until I fell asleep. I don\'t think you slept at all. I\'m not scared of thunder anymore. I think it\'s because of that night.', weight: 8, val: 1, tags: ['parent', 'fear'], photo: { scene: 'room', tod: 'night', anim: 'sleep', expr: 'sleep' } });
      } else if (c === 1) {
        g.bond(4); g.stat('art', 2); g.parent(4, 0);
        await g.her('happy', 'And then the Weaver Girl did what? ...Keep going. Please keep going.');
        g.remember({ id: 'storm_story', text: 'the night you told me stories through the storm', letter: 'I still remember the story you told me during the storm, the one about the fox who stole the moon. I\'ve told it to so many children since.', weight: 6, val: 1, tags: ['parent', 'story'] });
      } else if (c === 2) {
        g.parent(-2, 5); g.trait('bold', 4); g.bond(-3); g.esteem(1);
        await g.her('sad', '...Okay.');
        g.diary('I went back to bed. The thunder was so loud. I counted to a thousand.');
        g.remember({ id: 'storm_alone', text: 'the storm I faced alone', letter: 'You sent me back to bed during the big storm. I counted to a thousand in the dark. I think I understand why you did it. I wish you hadn\'t.', weight: 5, val: -1, tags: ['parent', 'fear'] });
      } else {
        g.bond(8); g.need('love', 20); g.parent(6, 0); g.trust(6);
        await g.her('teary', 'You remembered it\'s my favorite...');
        g.remember({ id: 'storm_food', text: 'the storm night and the ' + g.s.fav.food, letter: 'The night of the storm you made me ' + g.s.fav.food + ' at midnight. You knew. You always knew.', weight: 8, val: 1, tags: ['parent', 'food'] });
      }
    },
  });

  add({
    id: 'kitten', phase: 'mid', weight: 2, when: (s) => s.age <= 15 && !s.flags.pet && s.turn >= 1,
    async run(g) {
      await g.scene('home');
      await g.nar('She comes home with something inside her jacket. The something says "mew".');
      await g.her('shy', {
        _: 'Its mama is gone and it was all alone under the teahouse steps. Can we keep it? Please? I\'ll feed it every day.',
        sassy: 'Before you say anything: it followed me. That\'s basically fate.',
        earnest: 'I will take full responsibility for it. I have made a feeding schedule.',
      });
      const c = await g.choose(['"Of course. What will you name it?"', '"Only if you take care of it yourself."', '"No. We can\'t keep an animal."']);
      if (c <= 1) {
        const nm = g.v({ sunny: 'Dumpling', soft: 'Little Cloud', sassy: 'General Whiskers', dreamy: 'Moonbeam', earnest: 'Mister Tofu' });
        g.flag('pet', nm);
        g.bond(c === 0 ? 6 : 4);
        g.stat('heart', 2);
        if (c === 1) { g.trait('diligent', 4); g.parent(2, 3); } else g.parent(4, -2);
        await g.her('joy', 'I\'ll call it ' + nm + '!');
        g.remember({ id: 'kitten', title: nm, caption: nm + ' joined the family.', text: 'the day ' + nm + ' came home', letter: 'Do you remember when I brought ' + nm + ' home in my jacket? You said yes before I even finished asking. (Okay, almost before.)', weight: 6, val: 1, tags: ['parent', 'pet'], photo: { scene: 'home', anim: 'love', expr: 'joy' } });
      } else {
        g.bond(-5); g.parent(-2, 4); g.feel('sad', 60);
        await g.her('cry', 'But... okay.');
        g.flag('secret_cat', true);
        g.s.secrets.push({ id: 'cat', text: 'She has been secretly feeding the kitten under the teahouse steps.' });
        g.diary('I still feed the kitten every morning. Don\'t tell anyone, diary.');
      }
    },
  });

  add({
    id: 'teased', phase: 'mid', weight: 2, when: (s) => s.age <= 14 && s.turn >= 1,
    async run(g) {
      await g.scene('town');
      await g.nar('She comes home with her hair tucked under a scarf and won\'t look at you.');
      await g.her('sad', { _: 'The kids at the well call me Ghost Girl. They say my hair is wrong. That I\'m not really from here.', sassy: 'Some kids said my hair looks like a haunted broom. I said worse things back. Then I left. Then I cried. In that order.' });
      const c = await g.choose(['"Your hair is starlight. They\'ve just never seen a star up close."', '"Stand up to them. Tell them who you are."', 'Go and have a word with their parents.', '"Just ignore them."']);
      if (c === 0) {
        g.esteem(6); g.bond(4); g.parent(5, 0);
        await g.her('teary', '...Starlight?');
        await g.nar('The next day, the scarf stays at home.');
        g.remember({ id: 'starlight_hair', text: 'the day you told me my hair was starlight', letter: 'When the kids called me Ghost Girl, you told me my hair was starlight. I still say that to myself sometimes, in the mirror, when no one\'s looking.', weight: 7, val: 1, tags: ['parent', 'esteem'] });
      } else if (c === 1) {
        g.trait('bold', 6); g.esteem(3); g.parent(2, 2);
        await g.her('determined', g.v({ _: 'Okay. Tomorrow I\'ll tell them.', soft: 'I... I\'ll try.' }));
        if (g.s.traits.bold > 10) { await g.nar('She marches out the next day. You don\'t know exactly what she said, but the name stops.'); g.esteem(4); }
        else { await g.nar('She tries. Her voice shakes. But she tries, and that seems to be enough.'); g.esteem(2); }
      } else if (c === 2) {
        g.parent(3, 4); g.bond(2); g.esteem(-1);
        await g.her('worried', 'You\'re going to talk to their parents? Everyone will know I told!');
        await g.nar('The teasing stops. So do the invitations to play, for a while.');
        g.need('friends', -10);
      } else {
        g.parent(-3, 0); g.esteem(-4); g.bond(-2);
        await g.her('sad', '...Okay.');
        g.s.secrets.push({ id: 'teased', text: 'The teasing never really stopped. She just stopped telling you.' });
        g.diary('Ignoring them doesn\'t work. I tried.');
      }
    },
  });

  add({
    id: 'meet_tao', phase: 'mid', weight: 3, when: (s) => s.turn >= 2 && s.age >= 11,
    async run(g) {
      await g.scene('market');
      g.npc('tao', 'right');
      await g.nar('At the market, the boy at the dumpling stall stares at her hair, turns red, and pushes a pork bun across the counter.');
      await g.say('tao', 'F-for you. It\'s free. It\'s, um. It\'s a free sample. For stars. I mean for people. I\'m Tao.');
      await g.her(g.s.traits.bold > 0 ? 'joy' : 'shy', { _: 'Thank you, Tao!', soft: 'Th-thank you...', sassy: 'Free food? I like you already.' });
      g.friend('tao', 12);
      g.learn('fact', 'tao', 'The boy at the dumpling stall, Tao, turns red whenever she walks by.');
      g.clearNpcs();
    },
  });

  // ================================================================ DREAMS
  add({
    id: 'dream_reveal', phase: 'mid', priority: 40,
    when: (s) => !s.dream && s.turn >= 2 && Object.keys(s.tried).some((id) => D.ACT_DREAM[id] && s.aff[id] >= 0.8),
    async run(g) {
      const s = g.s;
      const best = Object.keys(s.tried).filter((id) => D.ACT_DREAM[id]).sort((a, b) => s.aff[b] - s.aff[a])[0];
      let dream = D.ACT_DREAM[best];
      if (dream === 'general' && s.traits.bold > 30 && s.traits.diligent < 0) dream = 'swordswoman';
      if (dream === 'princess' && s.traits.dreamy < 0) dream = 'scholar';
      if (s.stats.art > 45 && s.stats.wit > 45 && s.traits.dreamy > 30 && U.chance(0.3)) dream = 'poet';
      await g.scene('home', { tod: 'dusk' });
      await g.nar('She sits beside you on the step as the lanterns come on.');
      await g.her('thinking', g.P + '... can I tell you something? You can\'t laugh.');
      await g.her('determined', D.DREAMS[dream].say);
      s.dream = dream;
      s.dreamHist.push(dream);
      const P = D.PARENTS[s.parent.bg];
      const yours = { general: 'general', scholar: 'scholar', merchant: 'merchant', physician: 'physician', musician: 'musician', tea: 'farmer' }[s.parent.bg];
      const opts = ['"Then that\'s what you\'ll be. I believe in you."', '"That\'s a hard road. Are you sure?"'];
      if (yours && yours !== dream) opts.push('"Have you ever thought about following in my footsteps?"');
      const c = await g.choose(opts);
      if (c === 0) {
        g.esteem(8); g.bond(4); g.parent(4, -1); g.flag('dream_support', true);
        await g.her('joy', 'You really think so? ...Okay. Okay! Then I\'ll really do it.');
        g.remember({ id: 'dream_believe', text: 'the evening you believed in my dream', letter: 'When I told you my dream on the courtyard step, you didn\'t laugh. You said "then that\'s what you\'ll be". I held on to that for years.', weight: 8, val: 1, tags: ['parent', 'dream'] });
      } else if (c === 1) {
        g.parent(0, 2);
        if (s.traits.fiery > 20 || s.traits.bold > 30) { g.esteem(2); await g.her('determined', 'I\'m sure. You\'ll see.'); }
        else { g.esteem(-4); await g.her('sad', '...Maybe you\'re right.'); }
      } else {
        g.parent(1, 5);
        if (s.bond > 55 && s.traits.fiery < 20) {
          await g.her('thinking', 'Like you? ...I never thought about that. Maybe.');
          s.dream = yours; s.dreamHist.push(yours);
        } else {
          g.bond(-3); g.esteem(-2);
          await g.her('pout', 'I told you MY dream. Not yours.');
        }
      }
      g.learn('fact', 'dream', 'Her dream: ' + D.DREAMS[s.dream].say);
    },
  });

  add({
    id: 'dream_change', phase: 'mid', weight: 3,
    when: (s) => s.dream && s.age >= 14 && Object.keys(s.tried).some((id) => D.ACT_DREAM[id] && D.ACT_DREAM[id] !== s.dream && s.aff[id] >= 1.3 && (s.counts[id] || 0) >= 3) && !s.flags.dream_changed,
    async run(g) {
      const s = g.s;
      const id = Object.keys(s.tried).filter((x) => D.ACT_DREAM[x] && D.ACT_DREAM[x] !== s.dream).sort((a, b) => s.aff[b] - s.aff[a])[0];
      const nd = D.ACT_DREAM[id];
      await g.scene('home', { tod: 'night' });
      await g.her('worried', { _: 'Remember what I said I wanted to be? I think... I think I want something different now.', sassy: 'So. Plot twist. I don\'t think I want what I said I wanted.' });
      await g.her('thinking', D.DREAMS[nd].say);
      const c = await g.choose(['"People change. Follow what you love now."', '"Don\'t give up on your first dream so easily."']);
      g.flag('dream_changed', true);
      if (c === 0) { s.dream = nd; s.dreamHist.push(nd); g.esteem(4); g.trust(4); g.parent(3, -3); await g.her('joy', 'You\'re not disappointed?'); }
      else { g.parent(0, 4); if (s.traits.fiery > 25) { s.dream = nd; s.dreamHist.push(nd); g.bond(-3); await g.her('pout', 'It\'s my dream. I get to change it.'); } else { g.esteem(-3); await g.her('sad', '...You\'re right. I\'ll keep trying.'); } }
    },
  });

  // ================================================================ RIVALRY
  add({
    id: 'rival', phase: 'mid', weight: 3,
    when: (s) => s.age >= 12 && ['etiquette', 'academy', 'guqin', 'dance', 'martial'].some((id) => (s.counts[id] || 0) >= 2),
    async run(g) {
      await g.scene('palace');
      g.npc('wanyin', 'mentor');
      await g.nar('A girl in lilac silk sweeps past with two maids behind her. Lady Wanyin, the magistrate\'s daughter.');
      await g.say('wanyin', 'Oh, it\'s the girl who fell out of a tree. I heard you were taking lessons. How brave of you.');
      await g.her(g.s.traits.fiery > 15 ? 'angry' : 'pout', { _: 'I didn\'t fall out of a tree. I fell INTO one.', soft: '...', sassy: 'At least I didn\'t fall out of a snob.' });
      await g.say('wanyin', 'Spring contest. You and me. Let\'s see who is really worth teaching.');
      g.flag('rival_contest', g.s.turn + 2);
      g.friend('wanyin', 5);
      g.feel('angry', 40);
      g.diary('Lady Wanyin challenged me. I\'m going to WIN.');
      g.clearNpcs();
    },
  });

  add({
    id: 'rival_contest', phase: 'mid', priority: 50, when: (s) => s.flags.rival_contest && s.turn >= s.flags.rival_contest && !s.flags.contest_done,
    async run(g) {
      const s = g.s;
      g.flag('contest_done', true);
      const opts = [['grace', 'tea ceremony'], ['wit', 'poetry duel'], ['art', 'guqin recital'], ['vigor', 'sword duel']];
      const [stat, kind] = opts.sort((a, b) => s.stats[b[0]] - s.stats[a[0]])[0];
      await g.scene(stat === 'vigor' ? 'hall' : 'palace');
      g.npc('wanyin', 'mentor');
      await g.nar('The whole town turns out for the contest. The judges choose a ' + kind + '.');
      await g.her('determined', { _: 'Watch me, ' + g.P + '.', soft: 'My hands are shaking... but I\'ll do it.' });
      let win;
      if (stat === 'art') {
        const r = await g.minigame('recital', { level: Math.round(3 + s.stats.art / 25) });
        win = r.skipped ? g.check('art', 55) : r.win;
      } else if (stat === 'vigor') {
        const r = await g.minigame('duel', { skill: s.stats.vigor });
        win = r.skipped ? g.check('vigor', 55) : r.win;
      } else win = g.check(stat, 55);
      if (win) {
        g.esteem(10); g.need('pride', 30); g.stat(stat, 3); g.feel('proud', 80);
        await g.nar('When the judges announce the winner, it is her name they call.');
        await g.her('joy', 'I won! ' + g.P + ', I WON!');
        await g.say('wanyin', '...Well played. This time.');
        g.remember({ id: 'contest_win', title: 'Victory', caption: 'She beat Lady Wanyin in the ' + kind + '.', text: 'the day I beat Lady Wanyin', letter: 'You were standing at the very front when I won the ' + kind + ' against Wanyin. You cheered so loudly the judges frowned at you. I have never been prouder of anything.', weight: 7, val: 1, tags: ['pride', 'rival'], photo: { scene: stat === 'vigor' ? 'hall' : 'palace', anim: 'cheer', expr: 'joy', npcs: ['wanyin'] } });
      } else {
        g.esteem(-4); g.need('pride', -15); g.feel('sad', 60);
        await g.nar('Wanyin wins, by a hair. The crowd applauds politely.');
        await g.her('cry', { _: 'I practiced so hard...', sassy: 'The judges were bribed. Probably. ...No. She was just better.' });
        const c = await g.choose(['"I\'m proud of you. Win or lose."', '"Then we practice harder."', 'Buy her candied hawthorn on the way home.']);
        if (c === 0) { g.esteem(6); g.bond(5); g.parent(5, 0); g.remember({ id: 'contest_proud', text: 'you were proud of me when I lost', letter: 'When I lost to Wanyin, you said you were proud of me anyway. I didn\'t believe you then. I do now.', weight: 7, val: 1, tags: ['parent', 'esteem'] }); }
        if (c === 1) { g.trait('diligent', 5); g.parent(0, 4); g.esteem(1); }
        if (c === 2) { g.bond(4); g.gold(-5); g.need('fun', 10); await g.her('teary', '...It\'s really good hawthorn.'); }
      }
      g.friend('wanyin', 8);
      g.clearNpcs();
    },
  });

  add({
    id: 'rival_friend', phase: 'mid', weight: 3, when: (s) => s.flags.contest_done && s.age >= 15 && !s.flags.wanyin_friend,
    async run(g) {
      await g.scene('lake');
      g.npc('wanyin', 'left');
      await g.nar('She finds Lady Wanyin crying alone by the lake, her silk sleeves soaked.');
      await g.say('wanyin', 'Go ahead and laugh. My father says I\'m a disgrace because I only came second in the capital. Second. In the whole capital.');
      const c = await g.choose(['Let her decide what to do.', 'Tell her to sit with Wanyin.', 'Tell her Wanyin was cruel to her first.']);
      if (c === 2) { g.parent(0, 3); await g.her('thinking', 'She was... but look at her.'); }
      if (c === 1) g.parent(2, 3);
      if (c === 0) g.parent(2, -3);
      const kind = g.s.stats.heart + g.s.traits.bold / 2 > 35 || c === 1;
      if (kind) {
        await g.her('calm', 'Second in the capital sounds amazing to me. Want to throw rocks into the lake? It helps.');
        await g.say('wanyin', '...Throwing rocks is undignified. ...Give me a big one.');
        g.flag('wanyin_friend', true); g.friend('wanyin', 30); g.stat('heart', 3);
        g.remember({ id: 'wanyin_rocks', title: 'Rivals no more', caption: 'Throwing rocks into the lake with Wanyin.', text: 'the day Wanyin and I became friends', weight: 5, val: 1, tags: ['friend'], photo: { scene: 'lake', anim: 'cheer', expr: 'happy', npcs: ['wanyin'] } });
      } else {
        await g.nar('She hesitates, then walks away. Some bridges take longer to build.');
      }
      g.clearNpcs();
    },
  });

  // ================================================================ TROUBLE AND LOVE
  add({
    id: 'broken', phase: 'mid', weight: 2, when: (s) => s.age >= 11 && s.age <= 15 && s.turn >= 2,
    async run(g) {
      const item = D.PARENTS[g.s.parent.bg].item;
      await g.scene('room');
      await g.nar('A crash from your room. When you get there, she is standing over ' + item + ', broken in two.');
      await g.her('cry', { _: 'I just wanted to hold it. I\'m sorry, I\'m sorry, I\'m so sorry.', sassy: 'It... jumped. (It didn\'t jump. I\'m sorry.)', earnest: 'I broke it. I have no excuse. I will accept any punishment.' });
      const c = await g.choose(['Let out your anger. It was precious to you.', 'Kneel down. Tell her the story behind it.', '"You broke it, so you\'ll help me mend it."']);
      if (c === 0) {
        g.bond(-7); g.parent(-4, 5); g.feel('scared', 70); g.esteem(-3);
        g.remember({ id: 'broken_angry', text: 'the day I broke ' + item, letter: 'I know you were angry the day I broke ' + item + '. You had every right. I still feel sick when I think about your face. I\'m sorry, again.', weight: 6, val: -1, tags: ['parent'] });
        g.diary('I broke ' + item + '. ' + g.P + ' has never looked at me like that before.');
      } else if (c === 1) {
        g.bond(7); g.parent(6, -2); g.trust(5);
        await g.nar('You tell her where it came from, and who you were back then. She listens with her chin on her knees.');
        await g.her('teary', 'You were like that? Before me?');
        g.remember({ id: 'broken_story', text: 'the night you told me about ' + item, letter: 'When I broke ' + item + ', you didn\'t shout. You told me the story of it instead. That was the night I realized you had a whole life before me, and you chose to share it.', weight: 8, val: 1, tags: ['parent'] });
      } else {
        g.stat('craft', 3); g.trait('diligent', 3); g.parent(2, 3); g.bond(2);
        await g.nar('It takes three evenings of glue and patience. The crack still shows. Somehow you like it better that way.');
        g.remember({ id: 'broken_mend', text: 'the crack we mended together', letter: 'You still have ' + item + ' with the crack we mended together. I saw it last time I visited. You kept it on the shelf where everyone can see.', weight: 6, val: 1, tags: ['parent'] });
      }
    },
  });

  add({
    id: 'fever', phase: 'mid', priority: 30, when: (s) => (s.stress >= 80 || (s.turn >= 3 && U.rand() < 0.08)) && !s.flags.fever,
    async run(g) {
      g.flag('fever', true);
      await g.scene('room', { tod: 'night' });
      await g.nar('She comes home pale and shivering. By nightfall she is burning with fever.');
      await g.her('tired', { _: g.P + '... everything is spinning...', sassy: 'I\'m fine. Totally fi— (she sways and sits down hard)' });
      const c = await g.choose(['Stay by her bed all night.', 'Run for Physician Lu. (40 coins)', 'Give her medicine and get some rest yourself.']);
      g.stress(-40);
      if (c === 0) {
        g.bond(9); g.trust(6); g.parent(7, 0); g.need('love', 30);
        await g.nar('You change the cloth on her forehead every hour until dawn. Somewhere in the night she whispers your name.');
        g.remember({ id: 'fever', title: 'The fever', caption: 'You never left her side.', text: 'the night of the fever', letter: 'The night I had that awful fever, I pretended to be asleep so you would rest. You never did. Every time I opened my eyes you were there. I think about that night more than almost anything else.', weight: 10, val: 1, tags: ['parent', 'illness'], photo: { scene: 'room', tod: 'night', anim: 'sleep', expr: 'sleep' } });
      } else if (c === 1) {
        g.gold(-40); g.bond(5); g.parent(4, 1);
        await g.say('lu', 'She\'ll be fine. Rest, broth, and no lessons for a while. And stop making that face; she\'s young and strong.');
        g.remember({ id: 'fever_lu', text: 'the fever', letter: 'When I had the fever you ran through the rain for Physician Lu without your shoes. He told me later. He said he\'d never seen anyone run so fast.', weight: 7, val: 1, tags: ['parent', 'illness'] });
      } else {
        g.bond(-3); g.parent(-2, 2);
        await g.nar('In the morning she\'s better. She doesn\'t mention the night. Neither do you.');
        g.remember({ id: 'fever_alone', text: 'the fever', letter: 'When I had the fever, I woke up in the middle of the night and the house was so quiet. I know you were tired. I was just scared.', weight: 5, val: -1, tags: ['parent', 'illness'] });
      }
      g.diary('I was sick. I don\'t remember much. I remember ' + g.P + '.');
    },
  });

  add({
    id: 'diary_lock', phase: 'mid', priority: 20, when: (s) => s.age >= 14 && !s.flags.diary_lock,
    async run(g) {
      g.flag('diary_lock', true);
      await g.scene('room');
      await g.nar('She has bought a tiny brass lock for her diary. She wears the key on a red string around her neck.');
      await g.nar('A week later, you find the diary on the table. Unlocked. She is out.');
      const c = await g.choose(['Read it. Just one page.', 'Leave it closed.', 'Wait, and ask her about her week instead.']);
      if (c === 0) {
        const sec = g.s.secrets[0];
        await g.nar(sec ? sec.text : 'Mostly it is about Mei, a stray cat, and whether the moon gets lonely. Also, twice, about you.');
        if (sec) g.learn('fact', sec.id, sec.text);
        if (U.chance(0.45)) {
          await g.her('angry', { _: 'You READ it? That was PRIVATE!', soft: 'You... read it? (Her eyes fill with tears.)', sassy: 'Wow. Just wow. I\'m buying a bigger lock. And a moat.' });
          g.trust(-20); g.bond(-8); g.parent(-3, 6);
          g.remember({ id: 'diary_read', text: 'the day you read my diary', letter: 'I was so angry when you read my diary. I get it now, a little. You were worried. But I still don\'t write anything important on paper, you know. That\'s your fault.', weight: 7, val: -1, tags: ['parent', 'trust'] });
        } else {
          g.trust(-3);
          g.flag('diary_read_secretly', true);
        }
      } else if (c === 1) {
        g.trust(8); g.parent(2, -4);
        g.flag('diary_respected', true);
      } else {
        g.trust(5); g.bond(3);
        await g.her('thinking', '...It was okay. Actually, can I tell you something?');
        const sec = g.s.secrets[0];
        if (sec && g.s.trust > 45) { g.learn('fact', sec.id, sec.text); await g.nar('She tells you. You listen.'); }
      }
    },
  });

  add({
    id: 'diary_share', phase: 'mid', weight: 3, when: (s) => s.flags.diary_respected && s.trust >= 60 && s.age >= 15 && !s.flags.diaryShared,
    async run(g) {
      await g.scene('room', { tod: 'night' });
      await g.nar('She knocks on your door, holding her diary.');
      await g.her('shy', { _: 'You never read it, even when I left it out. I know you didn\'t. So... do you want to read a page? I picked a good one.', sassy: 'You passed the test. I left it out on purpose. Here. One page. Don\'t make it weird.' });
      g.flag('diaryShared', true);
      g.trust(8); g.bond(6);
      g.remember({ id: 'diary_shared', text: 'the night I let you read my diary', letter: 'Letting you read my diary was the most frightening, wonderful thing I did that year.', weight: 7, val: 1, tags: ['parent', 'trust'] });
    },
  });

  add({
    id: 'haircut', phase: 'mid', weight: 2, when: (s) => s.age >= 15 && !s.flags.haircut,
    async run(g) {
      const t = g.s.traits;
      const cur = g.s.style;
      let ns = t.bold > 25 ? 'ponytail' : t.dreamy > 25 ? 'braid' : t.diligent > 25 ? 'updo' : t.playful > 25 ? 'buns' : 'straight';
      if (ns === cur) ns = cur === 'updo' ? 'ponytail' : 'updo';
      g.flag('haircut', true);
      await g.scene('home');
      await g.nar('She walks through the gate and stops, waiting for you to notice.');
      g.s.style = ns;
      g.s.look.style = ns;
      g.io.refreshHer && g.io.refreshHer();
      await g.her('smug', { _: 'Well? I did it myself. Mei helped. Mostly me.', soft: 'Do you... hate it?', sassy: 'Before you say anything, it\'s my hair.' });
      const c = await g.choose(['"You look wonderful. Very grown up."', '"Why didn\'t you ask me first?"', '"It\'s your hair. Do you like it?"']);
      if (c === 0) { g.esteem(5); g.bond(3); await g.her('joy', 'Really?!'); }
      if (c === 1) { g.parent(0, 5); g.need('freedom', -12); g.bond(-4); await g.her('pout', 'Because it\'s MY head.'); }
      if (c === 2) { g.parent(3, -4); g.need('freedom', 12); g.trust(4); await g.her('happy', 'I love it.'); }
      g.remember({ id: 'haircut', title: 'New hair', caption: 'She did it herself. Mostly.', text: 'the day I cut my own hair', weight: 3, val: 1, tags: ['growth'], photo: { scene: 'home', anim: 'cheer', expr: 'smug' } });
    },
  });

  add({
    id: 'fight', phase: 'mid', priority: 25, when: (s) => s.age >= 14 && !s.flags.fight && (s.parenting.control >= 22 || Object.values(s.forced).reduce((a, b) => a + b, 0) >= 3 || (s.flags.rebellious || 0) >= 2),
    async run(g) {
      g.flag('fight', g.s.turn);
      await g.scene('home', { tod: 'dusk' });
      await g.nar('It starts with something small. It becomes something big.');
      await g.her('angry', { _: 'You NEVER let me decide anything! Not my lessons, not my friends, not anything! I\'m not a little star you found in a tree anymore!', soft: 'I... I never get to choose. Ever. I\'m tired of being good all the time.', sassy: 'You know what? Plan my whole life. Go ahead. You will anyway.' });
      const c = await g.choose(['"...You\'re right. I\'m sorry. Let\'s find a way to give you more say."', '"I decide because I\'m your parent. That\'s final."', '"Go to your room!"', 'Say nothing, and let her storm off.']);
      if (c === 0) { g.parent(4, -12); g.need('freedom', 25); g.bond(3); g.trust(6); g.flag('fight_resolved', true); await g.her('cry', 'You... you\'re not angry?'); g.remember({ id: 'fight_sorry', text: 'the big fight, and your apology', letter: 'When we had that huge fight, you apologized first. Grown-ups never apologize first. I never forgot it.', weight: 8, val: 1, tags: ['parent', 'fight'] }); }
      if (c === 1) { g.parent(-3, 8); g.bond(-6); g.trust(-6); g.feel('angry', 80); }
      if (c === 2) { g.parent(-5, 6); g.bond(-8); g.trust(-4); g.feel('hurt', 80); }
      if (c === 3) { g.bond(-4); g.feel('hurt', 60); }
      if (c > 0) g.remember({ id: 'fight', text: 'the big fight', letter: 'I said terrible things during our big fight. I\'ve wanted to take them back for years. I\'m taking them back now.', weight: 6, val: -1, tags: ['parent', 'fight'] });
    },
  });

  add({
    id: 'makeup', phase: 'mid', priority: 26, when: (s) => s.flags.fight && !s.flags.fight_resolved && s.turn >= s.flags.fight + 1,
    async run(g) {
      g.flag('fight_resolved', true);
      await g.scene('home', { tod: 'night' });
      await g.nar('Late at night there is a knock. She is holding two cups of tea.');
      await g.her('shy', { _: 'I made tea. It\'s probably too strong. I\'m... I\'m sorry about what I said.', sassy: 'Truce? I brought tea. It\'s a peace tea.', earnest: 'I was wrong to speak to you like that. I\'ve made tea. I would like to apologize properly.' });
      const c = await g.choose(['"I\'m sorry too." Take the tea.', '"Thank you. Let\'s talk about what you need."']);
      g.bond(6); g.trust(5);
      if (c === 1) { g.need('freedom', 15); g.parent(3, -6); }
      g.remember({ id: 'makeup_tea', title: 'Peace tea', caption: 'Two cups of too-strong tea.', text: 'the night we made up', letter: 'After our big fight I brought you tea that was much too strong, and you drank the whole thing. That\'s when I knew we\'d be okay.', weight: 8, val: 1, tags: ['parent', 'fight'], photo: { scene: 'home', tod: 'night', anim: 'serve', expr: 'shy' } });
    },
  });

  add({
    id: 'late_night', phase: 'mid', weight: (s) => 1 + Math.max(0, s.traits.bold) / 30 + (s.flags.rebellious || 0), when: (s) => s.age >= 15,
    async run(g) {
      await g.scene('home', { tod: 'night' });
      await g.nar('The moon is high. The night market closed an hour ago. She still isn\'t home.');
      await g.nar('When the gate finally creaks, she tiptoes in with her shoes in her hand.');
      await g.her('worried', { _: 'Oh. You\'re awake. Um. Hi.', sassy: 'Before you say anything, I can explain. Mostly.' });
      const c = await g.choose(['Hug her first. Then ask.', '"Do you know how worried I was?"', '"You\'re grounded. A whole season."']);
      if (c === 0) { g.bond(5); g.trust(6); g.parent(5, 0); await g.her('teary', '...We lost track of time watching the lanterns on the river. I\'m sorry. I should have sent word.'); g.remember({ id: 'late_hug', text: 'the night you hugged me instead of shouting', letter: 'The night I came home late, you hugged me before you said a single word. I never came home late again. Well. Almost never.', weight: 6, val: 1, tags: ['parent'] }); }
      if (c === 1) { g.parent(2, 4); g.trust(2); await g.her('sad', 'I know. I\'m sorry.'); }
      if (c === 2) { g.parent(-2, 8); g.need('freedom', -20); g.bond(-5); g.flag('grounded', g.s.turn + 1); await g.her('angry', 'A whole SEASON? That\'s so unfair!'); }
    },
  });

  add({
    id: 'sick_parent', phase: 'mid', weight: 2, when: (s) => s.age >= 14 && s.turn >= 5 && !s.flags.sick_parent,
    async run(g) {
      g.flag('sick_parent', true);
      await g.scene('room', { tod: 'day' });
      await g.nar('This time it is you who falls ill. For three days you can barely lift your head.');
      if (g.s.bond >= 45) {
        await g.nar('Every time you open your eyes, she is there: with broth, with a cold cloth, with a book she reads aloud badly on purpose to make you laugh.');
        await g.her('worried', 'Don\'t you dare get worse. I\'m in charge now. Drink your broth.');
        g.stat('heart', 4); g.bond(5); g.trait('diligent', 3);
        g.remember({ id: 'nursed_you', text: 'the days I took care of you', letter: 'When you were sick and I took care of you, I finally understood all those nights you took care of me. It\'s terrifying, loving someone that much.', weight: 8, val: 1, tags: ['parent', 'illness'] });
      } else {
        await g.nar('She brings you tea twice a day and leaves quickly. On the third day she stays a little longer.');
        g.stat('heart', 2); g.bond(3);
      }
    },
  });

  // ================================================================ STAR THREAD
  add({
    id: 'immortal', phase: 'mid', weight: (s) => 2 + s.star, when: (s) => s.age >= 13 && !s.flags.immortal_met && (s.traits.dreamy > 5 || s.star >= 2 || s.journeys > 0),
    async run(g) {
      g.flag('immortal_met', true);
      await g.scene('mountain', { tod: 'dusk' });
      g.npc('bai', 'mentor');
      await g.nar('On the mountain path, an old man with long white hair is sitting on a rock that wasn\'t there a moment ago.');
      await g.say('bai', 'Ah. The little thread from the river. You\'ve grown.');
      await g.her('surprised', 'You know who I am?');
      await g.say('bai', 'I know what you are. That is less interesting. If you want to learn to listen to the mountain, come back when the moon is full.');
      await g.nar('And then there is only the rock, and the wind.');
      g.learn('fact', 'immortal', 'A white-haired immortal on the mountain has offered to teach her. (Mountain Cultivation unlocked.)');
      g.clearNpcs();
    },
  });

  add({
    id: 'star_dream', phase: 'mid', weight: 3, when: (s) => s.age >= 13 && !s.flags.star_dream,
    async run(g) {
      g.flag('star_dream', true);
      g.star = g.s.star += 1;
      await g.scene('room', { tod: 'night' });
      await g.nar('She wakes up gasping and comes to find you, her hairpin glowing faintly in the dark.');
      await g.her('worried', 'I dreamed of a woman weaving the stars. She called me "little thread". She said the river misses me.');
      const c = await g.choose(['"It was only a dream. You\'re home."', '"Tell me everything you remember."', 'Sit with her by the window until dawn.']);
      if (c === 0) { g.bond(2); g.need('love', 8); }
      if (c === 1) { g.trust(5); g.trait('dreamy', 3); await g.her('thinking', 'She had my eyes. Isn\'t that strange?'); }
      if (c === 2) { g.bond(5); g.need('love', 15); g.remember({ id: 'star_window', text: 'watching the stars with you until dawn', letter: 'The night I dreamed of the Weaver, we sat by the window until sunrise and you pointed out every constellation you knew. You made half of them up. I noticed.', weight: 7, val: 1, tags: ['parent', 'star'] }); }
    },
  });

  add({
    id: 'star_legend', phase: 'mid', weight: 3, when: (s) => (s.star >= 3 || (s.counts.observatory || 0) >= 2) && !s.flags.star_legend && s.age >= 13,
    async run(g) {
      g.flag('star_legend', true);
      await g.scene('observatory');
      g.npc('xing', 'mentor');
      await g.say('xing', 'There is an old story. Sometimes, on Qixi, a star slips off the Weaver\'s loom and falls to earth as a child.');
      await g.say('xing', 'And on the child\'s eighteenth Qixi, the magpies build a second bridge, just for her. She may cross it and go home. Or not.');
      await g.her('worried', '...And what do they choose? The star children?');
      await g.say('xing', 'The story never says. I suspect it depends on what they are leaving behind.');
      g.learn('fact', 'legend', 'Old Xing\'s legend: on her eighteenth Qixi, the stars will call her home. She will have to choose.');
      g.clearNpcs();
    },
  });

  add({
    id: 'star_question', phase: 'mid', priority: 20, when: (s) => s.flags.star_legend && s.age >= 16 && !s.flags.star_question,
    async run(g) {
      g.flag('star_question', true);
      await g.scene('home', { tod: 'night' });
      await g.nar('She sits on the courtyard wall, looking up at the Silver River.');
      await g.her('thinking', g.P + '? If the stars really called me back one day... would you want me to go?');
      const c = await g.choose(['"I\'d want you to stay. But it would be your choice."', '"Never. You\'re my daughter. You belong here."', '"If it made you happy, I would let you go."']);
      g.flag('star_answer', ['free', 'stay', 'go'][c]);
      if (c === 0) { g.trust(8); g.bond(4); await g.her('teary', 'That\'s the best answer anyone could give.'); }
      if (c === 1) { g.bond(g.s.bond >= 50 ? 5 : -2); g.parent(3, 4); await g.her('shy', 'Your daughter... yeah.'); }
      if (c === 2) { g.trust(4); g.bond(-2); await g.her('sad', 'Oh. ...That\'s very generous of you.'); }
      g.remember({ id: 'star_question', text: 'the night I asked if you\'d let me go', letter: 'When I asked if you\'d let me go back to the stars, you answered honestly. I think about that answer a lot.', weight: 6, val: 1, tags: ['parent', 'star'] });
    },
  });

  // ================================================================ GROWING UP
  add({
    id: 'proud', phase: 'mid', weight: 3, when: (s) => Object.values(s.stats).some((v) => v >= 60) && !s.flags.proud,
    async run(g) {
      g.flag('proud', true);
      const top = Object.keys(g.s.stats).sort((a, b) => g.s.stats[b] - g.s.stats[a])[0];
      const who = { vigor: 'gao', wit: 'wen', art: 'liu', grace: 'hua', heart: 'jingci', craft: 'bao' }[top];
      const scene = { vigor: 'hall', wit: 'academy', art: 'teahouse', grace: 'palace', heart: 'temple', craft: 'kitchen' }[top];
      await g.scene(scene);
      g.npc(who, 'mentor');
      await g.say(who, 'I have taught for thirty years. I will say this once, so listen: your daughter has a gift.');
      await g.her('joy', { _: 'Did you hear that, ' + g.P + '?! Did you HEAR?', soft: '(She is trying very hard not to smile, and failing.)', sassy: 'I mean. Obviously. (She is beaming.)' });
      const c = await g.choose(['Tell her you\'re bursting with pride.', 'Nod: "Keep working hard."', '"A gift means nothing without effort."']);
      if (c === 0) { g.esteem(8); g.bond(4); g.need('pride', 20); }
      if (c === 1) { g.esteem(3); g.trait('diligent', 3); }
      if (c === 2) { g.parent(-2, 5); g.esteem(-2); g.trait('diligent', 4); await g.her('neutral', '...Right. Of course.'); }
      g.clearNpcs();
    },
  });

  add({
    id: 'burnout', phase: 'mid', priority: 35, when: (s) => s.stress >= 85 && !s.flags.burnout,
    async run(g) {
      g.flag('burnout', true);
      await g.scene('home', { tod: 'dusk' });
      await g.nar('You find her sitting in the corner of the courtyard, knees pulled up, not crying exactly. Just empty.');
      await g.her('tired', { _: 'I can\'t do it anymore, ' + g.P + '. Every day is lessons and lessons and I\'m so tired I can\'t even feel tired.', sassy: 'I\'m done. Broken. Put me out with the old pots.' });
      const c = await g.choose(['"Then we stop. The next month is only rest."', 'Sit beside her and say nothing at all.', '"Everyone is tired. Push through."']);
      if (c === 0) { g.stress(-30); g.bond(5); g.parent(5, -3); g.trust(5); }
      if (c === 1) { g.stress(-15); g.bond(6); g.need('love', 20); await g.nar('After a long while, she leans her head on your shoulder.'); }
      if (c === 2) { g.parent(-4, 6); g.esteem(-6); g.bond(-6); g.remember({ id: 'burnout_push', text: 'when you told me to push through', letter: 'When I was so exhausted I couldn\'t feel anything, you told me to push through. I did. I don\'t think I should have had to.', weight: 6, val: -1, tags: ['parent'] }); }
    },
  });

  add({
    id: 'mei_trouble', phase: 'mid', weight: 2, when: (s) => s.friends.mei >= 35 && s.age >= 12 && !s.flags.mei_trouble,
    async run(g) {
      g.flag('mei_trouble', true);
      await g.scene('town');
      await g.her('worried', 'Mei\'s father is sick and they can\'t afford the medicine. Mei says she might have to go work in the city. Can we help? Please?');
      const c = await g.choose(['Pay for the medicine. (60 coins)', '"We can\'t afford it. I\'m sorry."', '"Let\'s think of a way you can help, yourself."']);
      if (c === 0) { g.gold(-60); g.friend('mei', 20); g.bond(5); g.stat('heart', 2); g.remember({ id: 'mei_medicine', text: 'the medicine for Mei\'s father', letter: 'You paid for Mei\'s father\'s medicine without even thinking about it. Mei still brings it up every single time I see her.', weight: 6, val: 1, tags: ['parent', 'mei'] }); }
      if (c === 1) { g.bond(-2); g.friend('mei', -5); await g.her('sad', 'Okay...'); }
      if (c === 2) { g.stat('heart', 3); g.stat('craft', 2); g.stress(8); g.friend('mei', 15); await g.nar('She spends every spare hour folding paper lanterns to sell. It\'s not enough on its own, but together with Mei\'s it is.'); g.esteem(4); }
    },
  });

  add({
    id: 'tao_crush', phase: 'mid', weight: 3, when: (s) => s.age >= 14 && s.friends.tao >= 30 && !s.flags.tao_crush,
    async run(g) {
      g.flag('tao_crush', true);
      await g.scene('home');
      await g.her('shy', { _: g.P + '... how do you know if you like someone? Not for me. For... a friend.', sassy: 'Hypothetically. If someone kept thinking about someone\'s stupid dumplings. What would that mean.' });
      const c = await g.choose(['Tease her gently: "Does this friend make dumplings?"', '"You just know. Your heart feels warm and silly."', '"You\'re too young to think about that."']);
      if (c === 0) { g.bond(3); g.trait('playful', 2); await g.her('shy', '...I hate you. (She doesn\'t.)'); g.friend('tao', 5); }
      if (c === 1) { g.trust(5); g.bond(3); await g.her('love', 'Warm and silly... yeah.'); g.friend('tao', 8); }
      if (c === 2) { g.parent(-1, 6); g.trust(-4); g.need('freedom', -10); await g.her('pout', 'I\'m not too young to think.'); g.s.secrets.push({ id: 'crush', text: 'She has a crush on Tao from the dumpling stall.' }); }
    },
  });

  add({
    id: 'tao_confess', phase: 'mid', weight: 3, when: (s) => s.flags.tao_crush && s.friends.tao >= 50 && s.age >= 16 && !s.flags.tao_love && !s.flags.prince_route,
    async run(g) {
      await g.scene('garden', { tod: 'dusk' });
      g.npc('tao', 'right');
      await g.nar('Tao arrives at your gate in his cleanest shirt, holding a steamer basket like a shield.');
      await g.say('tao', 'I-I\'d like to ask your permission to walk with your daughter at the Lantern Festival. And maybe every festival. For a long time.');
      await g.her('shy', '(She is standing behind you, bright red, and very carefully not looking at anyone.)');
      const c = await g.choose(['"Ask her, not me."', '"You have my blessing."', '"She\'s far too young."']);
      if (c === 0) { g.trust(6); g.parent(3, -4); await g.her('love', '...Yes. Obviously yes.'); g.flag('tao_love', true); g.friend('tao', 20); }
      if (c === 1) { g.bond(3); await g.her('love', 'Thank you...'); g.flag('tao_love', true); g.friend('tao', 15); }
      if (c === 2) { g.parent(-2, 7); g.bond(-6); g.need('freedom', -15); await g.her('angry', 'That\'s not your decision!'); }
      if (g.flag('tao_love')) g.remember({ id: 'tao_ask', title: 'Tao asks', caption: 'He brought dumplings for courage.', text: 'the day Tao came to ask', weight: 6, val: 1, tags: ['love'], photo: { scene: 'garden', tod: 'dusk', anim: 'love', expr: 'love', npcs: ['tao'] } });
      g.clearNpcs();
    },
  });

  add({
    id: 'prince_letters', phase: 'mid', weight: 3, when: (s) => s.flags.prince_met && s.age >= 15 && !s.flags.prince_letters,
    async run(g) {
      g.flag('prince_letters', true);
      await g.scene('home');
      await g.nar('Letters begin to arrive, sealed with blue wax and no name. She reads them in the peach tree where she thinks you can\'t see.');
      const c = await g.choose(['Ask who is writing to her.', 'Pretend not to notice.', 'Forbid letters from strangers.']);
      if (c === 0) { await g.her('shy', 'It\'s Jing. The scholar from the Lantern Festival. He writes about books. And stars. And... other things.'); g.trust(3); }
      if (c === 1) { g.trust(5); g.need('freedom', 8); }
      if (c === 2) { g.parent(-2, 7); g.bond(-5); g.s.secrets.push({ id: 'letters', text: 'She kept writing to Jing in secret, through Mei.' }); }
      g.friend('prince', 10);
    },
  });

  add({
    id: 'banquet', phase: 'mid', weight: 3, when: (s) => s.flags.prince_met && s.age >= 16 && s.stats.grace >= 45 && !s.flags.banquet,
    async run(g) {
      g.flag('banquet', true);
      await g.scene('palace', { tod: 'night' });
      await g.nar('An invitation arrives, sealed with the imperial phoenix: the Mid-Autumn banquet at the summer palace. You both go.');
      g.npc('prince', 'prince');
      await g.nar('At the top of the steps, in the crown prince\'s robes, stands the scholar from the Lantern Festival.');
      await g.say('prince', 'I\'m sorry I never told you. When you\'re a prince, people only ever see the crown. You saw a boy who was bad at riddles.');
      await g.her('surprised', 'You\'re... Jing is... you\'re the PRINCE?');
      const feel = g.s.friends.prince + g.s.stats.grace / 3;
      if (feel >= 45) {
        await g.her('shy', 'You\'re still bad at riddles, you know.');
        await g.say('prince', 'Then you\'ll have to keep helping me.');
        g.flag('prince_route', true); g.friend('prince', 20);
        g.remember({ id: 'banquet', title: 'The banquet', caption: 'The scholar was the crown prince.', text: 'the Mid-Autumn banquet', weight: 7, val: 1, tags: ['love', 'prince'], photo: { scene: 'palace', tod: 'night', anim: 'love', expr: 'shy', npcs: ['prince'] } });
      } else {
        await g.her('neutral', '...It was nice to see you again, Your Highness.');
        g.friend('prince', 5);
      }
      g.clearNpcs();
    },
  });

  add({
    id: 'own_job', phase: 'mid', weight: 2, when: (s) => s.age >= 16 && s.traits.bold > -10 && !s.flags.own_job,
    async run(g) {
      g.flag('own_job', true);
      await g.scene('home');
      await g.her('determined', { _: 'I got a job! At the teahouse, three days a week. I start tomorrow. I already said yes.', sassy: 'So I\'m employed now. You can congratulate me.' });
      const c = await g.choose(['"Without asking me? ...Congratulations. I\'m proud of you."', '"You should have asked first."', '"Absolutely not. Tell them no."']);
      if (c === 0) { g.esteem(6); g.need('freedom', 15); g.parent(4, -5); g.gold(40); }
      if (c === 1) { g.parent(1, 4); g.gold(40); await g.her('pout', 'I\'m sixteen...'); }
      if (c === 2) { g.parent(-2, 8); g.bond(-6); g.need('freedom', -20); g.esteem(-3); }
    },
  });

  add({
    id: 'capital_trip', phase: 'mid', weight: 2, when: (s) => s.age >= 16 && s.friends.mei >= 30 && !s.flags.capital,
    async run(g) {
      g.flag('capital', true);
      await g.scene('town');
      await g.her('worried', 'Mei and I want to go to the capital for the spring fair. Four days. We\'d travel with the tea caravan. Please?');
      const c = await g.choose(['"Go. Write to me every day."', '"Only if I come with you."', '"No. The roads are dangerous."']);
      if (c === 0) { g.need('freedom', 25); g.trust(6); g.stat('grace', 3); g.stat('wit', 2); g.esteem(5); g.gold(-30); g.remember({ id: 'capital', title: 'The capital', caption: 'Four days, forty letters.', text: 'my trip to the capital with Mei', letter: 'You let me go to the capital with Mei. I wrote you a letter every day, like you asked. Forty letters in four days. You kept all of them. I saw them in the box.', weight: 7, val: 1, tags: ['parent', 'freedom'], photo: { scene: 'palace', anim: 'cheer', expr: 'joy', npcs: ['mei'] } }); }
      if (c === 1) { g.bond(3); g.need('freedom', 5); g.gold(-50); g.stat('grace', 2); await g.her('shy', 'With you? ...Actually, that could be fun.'); }
      if (c === 2) { g.parent(-1, 6); g.need('freedom', -15); g.bond(-4); }
    },
  });

  add({
    id: 'future_talk', phase: 'mid', priority: 15, when: (s) => s.age >= 17 && !s.flags.future_talk,
    async run(g) {
      g.flag('future_talk', true);
      await g.scene('home', { tod: 'dusk' });
      await g.nar('She sits down across from you with the serious face she used to wear when she was small and had something important to say.');
      await g.her('thinking', 'Next Qixi I\'ll be eighteen. I keep thinking about what comes after. What do you want for me, ' + g.P + '?');
      const c = await g.choose(['"I want you to be happy. That\'s all."', '"I want you to chase your dream."', '"I want you to be safe, and close to home."']);
      if (c === 0) { g.trust(5); g.bond(4); g.esteem(3); }
      if (c === 1) { g.esteem(6); g.flag('dream_support', true); }
      if (c === 2) { g.parent(3, 3); g.bond(2); g.need('freedom', -5); }
      await g.her('calm', 'Thank you. For asking me, not just telling me.');
    },
  });

  // ================================================================ REQUESTS (season start)
  add({
    id: 'req_sleepover', phase: 'start', once: false, weight: 2, when: (s) => s.age <= 15 && s.friends.mei >= 25 && s.needs.friends < 60 && (s.seen.req_sleepover || -9) < s.turn - 5,
    async run(g) {
      g.s.seen.req_sleepover = g.s.turn;
      await g.her('happy', 'Can I sleep over at Mei\'s house? Her grandmother is making sesame balls!');
      const c = await g.choose(['"Have fun!"', '"Not this time."']);
      if (c === 0) { g.need('friends', 20); g.need('freedom', 8); g.need('fun', 10); g.friend('mei', 5); g.parent(2, -2); }
      else { g.need('freedom', -8); g.parent(0, 3); await g.her('pout', 'Fine...'); }
    },
  });
  add({
    id: 'req_festival_alone', phase: 'start', weight: 2, when: (s) => s.age >= 14,
    async run(g) {
      await g.her('shy', { _: 'This festival... can I go with my friends? Just us? Not that I don\'t want to go with you. I just...', sassy: 'So, the festival. Friends only. Nothing personal. Okay, a little personal.' });
      const c = await g.choose(['"Of course. Go and have fun."', '"I\'ll miss you. But yes."', '"No. We always go together."']);
      if (c <= 1) { g.need('freedom', 15); g.need('friends', 15); g.trust(4); g.parent(2, -3); if (c === 1) { g.bond(2); await g.her('teary', 'I\'ll bring you back a sugar figure. The best one.'); } }
      else { g.need('freedom', -10); g.bond(-2); g.parent(0, 5); }
    },
  });
  add({
    id: 'req_allowance', phase: 'start', weight: 1, when: (s) => s.age >= 12 && s.gold >= 60,
    async run(g) {
      await g.her('thinking', { _: 'Could I have some pocket money? There\'s a hairpin at the market. It has a little crane on it.', sassy: 'I have been an excellent daughter. I would like to be paid.' });
      const c = await g.choose(['Give her 20 coins.', '"Earn it. Help with the chores."', '"We don\'t have money for that."']);
      if (c === 0) { g.gold(-20); g.need('fun', 12); g.bond(2); g.learn('fact', 'crane', 'She saved up for a hairpin with a little crane on it.'); }
      if (c === 1) { g.trait('diligent', 3); g.stat('craft', 1); g.parent(0, 3); }
      if (c === 2) { g.need('fun', -5); }
    },
  });
  add({
    id: 'req_quit', phase: 'start', weight: 3, once: false,
    when: (s) => Object.keys(s.tried).some((id) => s.aff[id] <= -1 && (s.counts[id] || 0) >= 3 && !s.flags['quit_asked_' + id]),
    async run(g) {
      const id = Object.keys(g.s.tried).filter((x) => g.s.aff[x] <= -1 && (g.s.counts[x] || 0) >= 3 && !g.s.flags['quit_asked_' + x]).sort((a, b) => g.s.aff[a] - g.s.aff[b])[0];
      g.flag('quit_asked_' + id, true);
      const act = D.ACT[id].name;
      await g.her('sad', { _: 'Please let me stop ' + act + '. I\'ve tried. I really have.', sassy: 'I am formally resigning from ' + act + '. Effective immediately.' });
      const c = await g.choose(['"Alright. You tried your best."', '"Give it one more season."', '"No. It\'s good for you."']);
      if (c === 0) { g.trust(5); g.need('freedom', 10); g.parent(3, -4); g.flag('quit_' + id, g.s.turn + 4); }
      if (c === 1) { g.parent(1, 2); }
      if (c === 2) { g.parent(-2, 6); g.need('freedom', -10); g.bond(-3); }
    },
  });
  add({
    id: 'req_dress', phase: 'start', weight: 1, when: (s) => s.age >= 13 && s.wardrobe.length < 4 && s.gold >= 90,
    async run(g) {
      const o = U.pick(['plum', 'moon', 'festival'].filter((x) => !g.s.wardrobe.includes(x)));
      if (!o) return;
      const O = D.OUTFITS[o];
      await g.her('shy', 'There\'s a ' + O.name.toLowerCase() + ' at the tailor\'s. It\'s ' + g.s.fav.color + '... well, almost. Could I... no, never mind.');
      g.learn('fav', 'color', 'Her favorite color is ' + g.s.fav.color + '.');
      const c = await g.choose(['Buy it for her. (' + O.cost + ' coins)', '"Maybe for your birthday."']);
      if (c === 0) { g.gold(-O.cost); g.s.wardrobe.push(o); g.bond(4); g.esteem(3); await g.her('joy', 'Really?! I\'ll wear it to every festival!'); }
      else { await g.her('neutral', 'Okay!'); }
    },
  });
  add({
    id: 'req_choose', phase: 'start', priority: 12, when: (s) => s.age >= 16 && !s.flags.autonomy,
    async run(g) {
      await g.her('determined', { _: 'I\'m sixteen now. From now on, could I plan one month each season myself?', sassy: 'New rule proposal: one month per season is MINE. Discuss.' });
      const c = await g.choose(['"That\'s fair. Yes."', '"Only if you use it well."', '"Not yet."']);
      if (c <= 1) { g.flag('autonomy', true); g.need('freedom', 20); g.trust(5); g.parent(2, c === 1 ? 2 : -5); }
      else { g.need('freedom', -15); g.parent(0, 6); g.flag('autonomy_denied', g.s.turn); }
    },
  });
  add({
    id: 'req_help', phase: 'start', weight: (s) => 1 + s.stats.heart / 40, when: (s) => s.stats.heart >= 30,
    async run(g) {
      await g.her('worried', 'Old Granny Fang next door can\'t fix her roof and it\'s going to rain. Can I help her this week?');
      const c = await g.choose(['"Go. I\'ll bring tea for both of you."', '"Your lessons come first."']);
      if (c === 0) { g.stat('heart', 3); g.stress(4); g.bond(2); g.esteem(2); g.remember({ id: 'granny_roof', text: 'fixing Granny Fang\'s roof', weight: 3, val: 1, tags: ['kindness'] }); }
      else { g.parent(0, 3); g.trait('fiery', 2); }
    },
  });
  add({
    id: 'secret_cat', phase: 'start', weight: 3, when: (s) => s.flags.secret_cat && !s.flags.secret_cat_found,
    async run(g) {
      g.flag('secret_cat_found', true);
      await g.scene('town');
      await g.nar('On your way home you spot her crouched under the teahouse steps, feeding a scruffy cat from her own lunch.');
      await g.her('surprised', '...It\'s not what it looks like. It\'s exactly what it looks like.');
      const c = await g.choose(['"Bring it home. It\'s family now."', '"You disobeyed me."']);
      if (c === 0) { g.flag('pet', 'Little Tiger'); g.bond(8); g.trust(6); await g.her('cry', 'Really? Thank you, thank you!'); g.remember({ id: 'cat_home', text: 'the day Little Tiger came home', letter: 'When you found me feeding that cat in secret, you said "bring it home". I think that was the day I stopped being afraid of disappointing you.', weight: 7, val: 1, tags: ['parent', 'pet'] }); }
      else { g.bond(-4); g.parent(-2, 5); }
    },
  });
})();
