/* Silver River — who she becomes: careers, the Magpie Bridge decision, epilogues and her letter to you. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const M = G.Mind;
  const E = (G.Endings = {});

  const c = (s, k) => s.counts[k] || 0;
  E.CAREERS = [
    { id: 'empress', name: 'Empress of the Realm', zh: '皇后', outfit: 'empress', scene: 'palace', hint: 'Grace, wisdom and kindness, and a prince\'s heart.',
      req: (s, t) => t.grace >= 82 && t.wit >= 65 && t.heart >= 65 && s.friends.prince >= 70 && s.flags.prince_route,
      score: (s, t) => t.grace * 1.3 + t.wit * 0.6 + t.heart * 0.6 + 40,
      text: '{name} married the prince she once met in disguise at the Lantern Festival. When he took the throne, she took it beside him, and the court learned very quickly that the new empress read every petition herself. The poor of the capital call her the Lantern Empress.' },
    { id: 'princess', name: 'Crown Princess', zh: '太子妃', outfit: 'royal', scene: 'palace', hint: 'Win the prince\'s heart and carry yourself like royalty.',
      req: (s, t) => t.grace >= 62 && t.heart >= 45 && s.friends.prince >= 50 && s.flags.prince_route,
      score: (s, t) => t.grace * 1.2 + t.heart * 0.6 + s.friends.prince * 0.4 + 20,
      text: '{name} became the Crown Princess. The palace is enormous and full of rules, and she still breaks one every day, usually the one about sneaking out to eat street food with the prince.' },
    { id: 'general', name: 'General of the Northern Pass', zh: '女將軍', outfit: 'general', scene: 'hall', hint: 'Years at the Martial Hall and a strong body and mind.',
      req: (s, t) => t.vigor >= 72 && t.wit >= 40 && c(s, 'martial') >= 6,
      score: (s, t) => t.vigor * 1.3 + t.wit * 0.5 + c(s, 'martial') * 3,
      text: 'When raiders came down from the north, {name} rode out at the head of the border guard. She came back with a scar on her chin and the Emperor\'s own banner. Soldiers who once laughed at "the little star" now salute her first.' },
    { id: 'swordswoman', name: 'Wandering Swordswoman', zh: '女俠', outfit: 'swordswoman', scene: 'mountain', hint: 'Strength, courage and many journeys.',
      req: (s, t) => t.vigor >= 58 && s.journeys + c(s, 'escort') >= 3,
      score: (s, t) => t.vigor * 1.1 + (s.journeys + c(s, 'escort')) * 6 + Math.max(0, s.traits.bold) * 0.3,
      text: '{name} took her sword and her straw hat and walked the rivers and lakes of the realm. Villages from here to the desert tell stories of a golden-haired swordswoman who arrives when she is needed and leaves before anyone can thank her.' },
    { id: 'scholar', name: 'First in the Imperial Exam', zh: '狀元', outfit: 'official', scene: 'palace', hint: 'Years of study and a brilliant mind.',
      req: (s, t) => t.wit >= 80 && c(s, 'academy') >= 7,
      score: (s, t) => t.wit * 1.4 + c(s, 'academy') * 3,
      text: 'Women were not supposed to sit the imperial exam. {name} sat it anyway, came first in the whole empire, and then wrote the Emperor such a reasonable letter about it that the rule was changed the following spring.' },
    { id: 'astronomer', name: 'Imperial Astronomer', zh: '欽天監', outfit: 'astronomer', scene: 'observatory', hint: 'Many nights under the stars.',
      req: (s, t) => t.wit >= 55 && s.star >= 10 && c(s, 'observatory') >= 4,
      score: (s, t) => t.wit * 0.9 + s.star * 6,
      text: '{name} became the youngest astronomer the Imperial Bureau has ever had. She maps the Silver River night after night, and sometimes, when she thinks nobody is looking, she waves at it.' },
    { id: 'immortal', name: 'Immortal of the Clouds', zh: '仙子', outfit: 'immortal', scene: 'mountain', hint: 'Cultivation on the mountain with a strange teacher.',
      req: (s, t) => c(s, 'cultivation') >= 5 && t.wit >= 50 && t.art >= 40,
      score: (s, t) => c(s, 'cultivation') * 10 + t.wit * 0.6 + t.art * 0.5,
      text: '{name} climbed the mountain one last time and did not come down the usual way. Travelers say a young immortal with starlight hair lives above the waterfall now, and that if you are lost in the clouds, she will walk you home.' },
    { id: 'physician', name: 'Imperial Physician', zh: '御醫', outfit: 'physician', scene: 'town', hint: 'Medicine, a kind heart and a clever head.',
      req: (s, t) => t.heart >= 58 && t.wit >= 55 && c(s, 'medicine') >= 5,
      score: (s, t) => t.heart * 0.9 + t.wit * 0.9 + c(s, 'medicine') * 3,
      text: '{name} was summoned to the palace after she cured a fever the court physicians had given up on. She still keeps a clinic in town, where anyone can be seen for free on the first day of each month.' },
    { id: 'musician', name: 'Guqin Master', zh: '琴師', outfit: 'musician', scene: 'teahouse', hint: 'Years at the guqin and a gift for art.',
      req: (s, t) => t.art >= 75 && c(s, 'guqin') >= 6,
      score: (s, t) => t.art * 1.3 + c(s, 'guqin') * 3,
      text: '{name} played the guqin before the Emperor on the first night of the new year. The hall fell so silent you could hear the snow. Maestro Liu, in the back row, cried and denied it afterwards.' },
    { id: 'dancer', name: 'Star of the Pear Garden', zh: '梨園', outfit: 'dancer', scene: 'palace', hint: 'Dance lessons, grace and art.',
      req: (s, t) => t.art >= 60 && t.grace >= 55 && t.vigor >= 35 && c(s, 'dance') >= 5,
      score: (s, t) => t.art * 0.9 + t.grace * 0.8 + c(s, 'dance') * 4,
      text: '{name} was invited to the Pear Garden, the imperial academy of music and dance. On the night of her first performance, her long sleeves flew like cranes over the stage, and the capital talked of nothing else for a month.' },
    { id: 'poet', name: 'Celebrated Poet', zh: '才女', outfit: 'plum', scene: 'lake', hint: 'A rare mix of art and wit.',
      req: (s, t) => t.art >= 62 && t.wit >= 62,
      score: (s, t) => t.art * 0.9 + t.wit * 0.9 + Math.max(0, s.traits.dreamy) * 0.3,
      text: 'The poems {name} wrote about falling stars and courtyard peach trees are copied out by schoolchildren now. Her most famous poem is about a lantern left burning in a window. Everyone assumes it is a metaphor. It is not.' },
    { id: 'envoy', name: 'Envoy to the Western Kingdoms', zh: '使節', outfit: 'merchant', scene: 'palace', hint: 'Grace, wit and a bold spirit.',
      req: (s, t) => t.grace >= 65 && t.wit >= 60 && s.traits.bold > 0,
      score: (s, t) => t.grace * 0.9 + t.wit * 0.9 + s.traits.bold * 0.2,
      text: '{name} led the Emperor\'s embassy along the Silk Road, across deserts and over mountains, and came home with a peace treaty, a camel, and opinions about western food.' },
    { id: 'priestess', name: 'Abbess of the Cloud Temple', zh: '住持', outfit: 'priestess', scene: 'temple', hint: 'A great heart and many seasons at the temple.',
      req: (s, t) => t.heart >= 80 && c(s, 'temple') >= 6,
      score: (s, t) => t.heart * 1.3 + c(s, 'temple') * 3,
      text: 'When Abbess Jingci retired, she handed her prayer beads to {name}. The Cloud Temple is busier than it has been in a hundred years, mostly because the new abbess feeds everyone who walks through the gate.' },
    { id: 'teacher', name: 'Beloved Teacher', zh: '先生', outfit: 'scholar', scene: 'academy', hint: 'Teach children, with heart and wit.',
      req: (s, t) => t.heart >= 55 && t.wit >= 50 && c(s, 'tutor') >= 2,
      score: (s, t) => t.heart * 0.8 + t.wit * 0.8 + c(s, 'tutor') * 5,
      text: '{name} opened a school for children who could not afford one. Her students call her Teacher Star. Some of them are already smarter than her, which she says is the whole point.' },
    { id: 'chef', name: 'Imperial Chef', zh: '御廚', outfit: 'chef', scene: 'kitchen', hint: 'Master the kitchen.',
      req: (s, t) => t.craft >= 70 && c(s, 'kitchen') + c(s, 'stall') >= 6,
      score: (s, t) => t.craft * 1.3 + (c(s, 'kitchen') + c(s, 'stall')) * 2,
      text: '{name} cooked her way from Auntie Bao\'s kitchen to the imperial kitchens. The Emperor has asked for her dumplings at every banquet since. She still uses Auntie Bao\'s recipe and still won\'t tell anyone the secret ingredient.' },
    { id: 'merchant', name: 'Head of a Trading House', zh: '商號', outfit: 'merchant', scene: 'market', hint: 'Earn a fortune with clever hands and a clever head.',
      req: (s, t) => t.craft >= 45 && t.wit >= 45 && t.grace >= 45 && s.earned >= 600,
      score: (s, t) => t.craft * 0.6 + t.wit * 0.6 + t.grace * 0.6 + s.earned / 30,
      text: '{name} started with one cart of tea and one very stubborn plan. Now her trading house, the Silver River Company, sends caravans as far as the western deserts. Her first employee was Mei.' },
    { id: 'teahouse', name: 'Owner of the Moon Teahouse', zh: '茶館', outfit: 'teahouse', scene: 'teahouse', hint: 'Work at the teahouse and win people\'s hearts.',
      req: (s, t) => t.craft >= 45 && t.heart >= 45 && t.grace >= 40 && c(s, 'teahouse') >= 4,
      score: (s, t) => t.craft * 0.6 + t.heart * 0.6 + t.grace * 0.5 + c(s, 'teahouse') * 4,
      text: '{name} bought the old teahouse by the lake and renamed it the Moon Teahouse. Travelers come for the tea and stay for the stories. There is always one table by the window kept free. It is yours.' },
    { id: 'farmer', name: 'Tea Master of the Valley', zh: '茶師', outfit: 'farmer', scene: 'field', hint: 'Work the tea terraces.',
      req: (s, t) => t.craft >= 50 && t.vigor >= 40 && c(s, 'tea') >= 4,
      score: (s, t) => t.craft * 0.8 + t.vigor * 0.6 + c(s, 'tea') * 4,
      text: '{name} planted her own terraces on the mountainside. Her spring tea, Falling Star Silver Needle, won the imperial tea contest three years running. The fourth year she didn\'t enter, to give everyone else a chance.' },
    { id: 'weaver', name: 'Master Embroiderer', zh: '繡娘', outfit: 'plum', scene: 'silk', hint: 'Skilled, artistic hands at the silk workshop.',
      req: (s, t) => t.craft >= 60 && t.art >= 50 && c(s, 'silk') >= 4,
      score: (s, t) => t.craft * 0.9 + t.art * 0.8 + c(s, 'silk') * 4,
      text: '{name}\'s embroidery hangs in the palace now: a Silver River of white silk so fine it seems to move. People say she must have learned it from the Weaver Girl herself. She just smiles.' },
    { id: 'artisan', name: 'Master Inventor', zh: '巧匠', outfit: 'work', scene: 'silk', hint: 'Clever hands and a clever head.',
      req: (s, t) => t.craft >= 60 && t.wit >= 60,
      score: (s, t) => t.craft * 0.9 + t.wit * 0.9,
      text: '{name} built a water clock that also plays a song, a loom that weaves twice as fast, and a kite big enough to carry a goat. (The goat did not enjoy it.) The Ministry of Works wants her. She is thinking about it.' },
    { id: 'quiet', name: 'A Quiet, Happy Life', zh: '平安', outfit: 'everyday', scene: 'home', hint: 'Sometimes a gentle life is the best ending of all.',
      fallback: true, req: (s) => s.bond >= 35, score: () => 1,
      text: '{name} didn\'t become anything grand. She married late, kept chickens, laughed a lot, and grew the best peach tree in town from the one in your courtyard. She says she became exactly what she wanted: happy.' },
    { id: 'wanderer', name: 'The Open Road', zh: '遠行', outfit: 'traveler', scene: 'mountain', hint: 'What happens when a daughter feels she must leave.',
      fallback: true, req: () => true, score: () => 0,
      text: '{name} left home the spring after her eighteenth birthday with a small bag and no plan. For a long time you heard nothing. Then letters began to arrive, from further and further away.' },
  ];
  E.STAR = { id: 'star', name: 'Return to the Silver River', zh: '歸星', outfit: 'celestial', scene: 'night', hint: 'On her eighteenth Qixi, the stars call her home.' };
  E.STAR_BRIDGE = { id: 'starbridge', name: 'The Weaver\'s Daughter', zh: '鵲橋', outfit: 'celestial', scene: 'night', hint: 'She goes home to the stars, but she comes back.' };
  E.ALL = E.CAREERS.concat([E.STAR, E.STAR_BRIDGE]);
  E.byId = (id) => E.ALL.find((x) => x.id === id);

  E.career = function (s) {
    const t = s.stats;
    const dreamCareer = s.dream && G.D.DREAMS[s.dream] ? G.D.DREAMS[s.dream].career : null;
    const scored = E.CAREERS.filter((x) => !x.fallback && x.req(s, t)).map((x) => ({ x, sc: x.score(s, t) + (x.id === dreamCareer ? 30 : 0) }));
    scored.sort((a, b) => b.sc - a.sc);
    if (scored.length) return scored[0].x;
    return E.CAREERS.find((x) => x.fallback && x.req(s, t));
  };

  // Does she stay when the stars call? choice: 'stay' (ask her to stay), 'free' (her choice), 'go' (let her go)
  E.decide = function (s, choice) {
    const friends = (s.friends.mei + s.friends.tao + s.friends.prince + s.friends.wanyin) / 4;
    const career = E.career(s);
    const dreamFulfilled = s.dream && G.D.DREAMS[s.dream] && G.D.DREAMS[s.dream].career === career.id;
    let score = s.bond * 0.8 + s.trust * 0.35 + friends * 0.25 + (dreamFulfilled ? 12 : 0) + (s.esteem - 50) * 0.1 - Math.min(12, s.star * 0.6);
    if (choice === 'free') score += s.bond >= 60 ? 14 : 0;
    if (choice === 'stay') score += s.bond >= 50 ? 10 : -10;
    if (choice === 'go') score -= 35;
    const stays = score >= 58;
    return { stays, score: Math.round(score), bridge: !stays && s.bond >= 55 };
  };

  E.relationText = function (s) {
    const P = M.addr(s);
    const b = s.bond;
    if (b >= 85) return 'She never really left. Even now she comes home every Qixi, sits with you under the peach tree, and tells you everything, exactly like when she was ten.';
    if (b >= 65) return 'She writes to you every week, long letters full of drawings in the margins. Every one of them starts "Dear ' + P + '".';
    if (b >= 45) return 'She visits at New Year and for your birthday. The two of you still argue about the same silly things, and you both secretly enjoy it.';
    if (b >= 25) return 'Her letters are short, but they come. Last winter one of them ended with "I miss you". She underlined it twice.';
    return 'For a long time she did not write at all. Then one day a single dried peach blossom arrived in an envelope. No letter. You know what it means.';
  };

  E.friendsText = function (s) {
    const out = [];
    if (s.flags.tao_love) out.push('She and Tao were married under the peach tree. He still saves her the first basket of dumplings every morning.');
    else if (s.friends.tao >= 50) out.push('Tao opened his own dumpling house. There is a dish on the menu named after her, and he refuses to explain why.');
    if (s.friends.mei >= 55) out.push('Mei is still her best friend. They have a standing appointment every Lantern Festival that neither of them has ever missed.');
    if (s.flags.wanyin_friend) out.push('Lady Wanyin, her old rival, became her fiercest ally. They still compete at everything, including who can be nicer to the other.');
    if (s.friends.prince >= 40 && !s.flags.prince_route) out.push('Sometimes a poem arrives from the palace, unsigned. She always knows who sent it.');
    return out.join(' ');
  };

  // ---------------------------------------------------------------- her letter
  E.letter = function (s, career, star) {
    const P = M.addr(s);
    const v = M.voice(s);
    const lines = [];
    lines.push('Dear ' + P + ',');
    const opener = {
      sunny: 'I tried to write this four times and every time I started crying and laughing at the same time, so here is attempt number five.',
      soft: 'I\'m not good at saying things out loud, so I\'m writing them down instead.',
      sassy: 'Don\'t make that face. Yes, I\'m writing you a letter. Yes, it\'s sentimental. Deal with it.',
      dreamy: 'The Silver River is very bright tonight, and it made me want to tell you everything.',
      earnest: 'There are some things I want to say properly, so I am writing them down.',
    }[v];
    lines.push(opener);
    lines.push(s.startAge <= 11 ? 'I still remember the night I fell into your courtyard. I was so scared, and you just sat down in the grass next to me and didn\'t say anything until I stopped shaking.' : 'I still remember the night I fell into your courtyard. I didn\'t know who I was. You told me it didn\'t matter, because you knew who I was going to be: yours.');
    const good = M.recall(s, (m) => m.val > 0 && m.letter);
    if (good) lines.push(good.letter);
    const bad = M.recall(s, (m) => m.val < 0 && m.letter);
    if (bad && s.bond >= 30) lines.push(bad.letter);
    const style = M.style(s).id;
    lines.push({
      lantern: 'You were strict sometimes, and I hated it sometimes. But I always knew you were on my side. I always knew where home was.',
      sky: 'You let me choose, even when I chose badly. Especially then. I think that\'s why I learned to choose well.',
      willow: 'You were so patient with me. I don\'t think I ever said thank you for that. Thank you.',
      gate: 'You pushed me so hard. I understand now that you were scared for me. I wish you had told me that back then.',
      mountain: 'I know you were busy. I know you did your best. I learned to stand on my own, and some of that is thanks to you.',
      river: 'We figured each other out slowly, didn\'t we? I\'m glad we did.',
    }[style]);
    const dreamCareer = s.dream && G.D.DREAMS[s.dream] ? G.D.DREAMS[s.dream].career : null;
    if (star) lines.push('I have to go home now, to the river of stars. Please don\'t be sad for too long. Look up on Qixi. I\'ll be the one waving.');
    else if (career && dreamCareer === career.id) lines.push('I did it, ' + P + '. The thing I told you about when I was little. I really did it.');
    else if (career && career.id !== 'quiet' && career.id !== 'wanderer') lines.push('It isn\'t what I dreamed of when I was small, but it\'s mine, and I love it.');
    lines.push(s.bond >= 50 ? 'Whatever star I came from, home is wherever you are.' : 'I\'m still working out what home means. But I think it starts with you.');
    lines.push({ sunny: 'Love you forever and ever (and ever)', soft: 'With all my love,', sassy: 'Fine. I love you. There. It\'s in writing now.', dreamy: 'Under the same stars,', earnest: 'With gratitude and love,' }[v]);
    lines.push(s.name);
    return lines;
  };
})();
