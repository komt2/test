/* Silver River — game data: stats, activities, parents, outfits, favourites, dreams, careers. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const D = (G.D = {});

  D.STATS = [
    { id: 'vigor', name: 'Vigor', glyph: '武', color: '#d9604c', desc: 'Strength, stamina and nerve.' },
    { id: 'wit', name: 'Wit', glyph: '文', color: '#3f7fb8', desc: 'Learning, cleverness and curiosity.' },
    { id: 'art', name: 'Art', glyph: '藝', color: '#9a62cc', desc: 'Music, dance, poetry and imagination.' },
    { id: 'grace', name: 'Grace', glyph: '禮', color: '#d9678f', desc: 'Poise, manners and charm.' },
    { id: 'heart', name: 'Heart', glyph: '仁', color: '#d99a2b', desc: 'Kindness, faith and empathy.' },
    { id: 'craft', name: 'Craft', glyph: '巧', color: '#4f9a6a', desc: 'Skilled hands: cooking, weaving, making.' },
  ];
  D.STAT_IDS = D.STATS.map((s) => s.id);
  D.RANKS = [[0, 'Untried'], [15, 'Beginner'], [30, 'Learning'], [45, 'Capable'], [60, 'Skilled'], [75, 'Gifted'], [90, 'Legendary']];
  D.rank = (v) => D.RANKS.filter((r) => v >= r[0]).pop()[1];

  D.TRAITS = [
    { id: 'bold', lo: 'Shy', hi: 'Bold' },
    { id: 'dreamy', lo: 'Practical', hi: 'Dreamy' },
    { id: 'fiery', lo: 'Gentle', hi: 'Fiery' },
    { id: 'diligent', lo: 'Free-spirited', hi: 'Diligent' },
    { id: 'playful', lo: 'Serious', hi: 'Playful' },
  ];
  D.NEEDS = [
    { id: 'rest', name: 'Rest' },
    { id: 'fun', name: 'Fun' },
    { id: 'love', name: 'Affection' },
    { id: 'freedom', name: 'Freedom' },
    { id: 'pride', name: 'Achievement' },
    { id: 'friends', name: 'Friendship' },
  ];

  D.SEASONS = ['autumn', 'winter', 'spring', 'summer'];
  D.SEASON_NAME = { autumn: 'Autumn', winter: 'Winter', spring: 'Spring', summer: 'Summer' };
  D.SEASON_ZH = { autumn: '秋', winter: '冬', spring: '春', summer: '夏' };
  D.MONTHS = {
    autumn: ['Early autumn', 'Mid-autumn', 'Late autumn'],
    winter: ['Early winter', 'Deep winter', 'Late winter'],
    spring: ['Early spring', 'Mid-spring', 'Late spring'],
    summer: ['Early summer', 'Midsummer', 'Late summer'],
  };

  D.LENGTHS = {
    short: { name: 'A short tale', years: 3, startAge: 15, minutes: 15, blurb: 'She arrives at fifteen. Three years, about 15 minutes.' },
    standard: { name: 'A full tale', years: 5, startAge: 13, minutes: 25, blurb: 'She arrives at thirteen. Five years, about 25 minutes.' },
    long: { name: 'A whole childhood', years: 8, startAge: 10, minutes: 45, blurb: 'She arrives at ten. Eight years, about 45 minutes.' },
  };

  D.PARENTS = {
    general: { name: 'Retired General', stat: 'vigor', gold: 220, income: 85, discount: ['martial'], item: 'your old sword', blurb: 'You held the northern pass for eleven winters. Now you mostly hold the chicken coop.', perk: 'Martial Hall lessons cost less.' },
    scholar: { name: 'Village Scholar', stat: 'wit', gold: 200, income: 80, discount: ['academy'], item: 'your ink stone', blurb: 'You passed the county exam, failed the imperial one twice, and now teach the village children their characters.', perk: 'Academy lessons cost less.' },
    merchant: { name: 'Silk Merchant', stat: 'grace', gold: 420, income: 120, payBonus: 0.25, item: 'your abacus', blurb: 'You know the price of every bolt of silk from here to the western deserts.', perk: 'More money, and her jobs pay more.' },
    physician: { name: 'Herbal Physician', stat: 'heart', gold: 190, income: 75, discount: ['medicine'], restBonus: 6, item: 'your medicine chest', blurb: 'Half the town owes you a favor and the other half owes you money.', perk: 'Rest heals more. Medicine lessons cost less.' },
    musician: { name: 'Former Court Musician', stat: 'art', gold: 180, income: 70, discount: ['guqin', 'dance'], item: 'your guqin', blurb: 'You once played the guqin for an empress. Now you play for the cat.', perk: 'Guqin and dance lessons cost less.' },
    tea: { name: 'Tea Farmer', stat: 'craft', gold: 170, income: 70, discount: ['kitchen'], payTea: 0.4, item: 'your tea bowl', blurb: 'Your terraces grow the best spring tea in the valley, and you tell everyone.', perk: 'Tea picking pays more. Kitchen lessons cost less.' },
  };
  D.ADDRESS = { mom: ['Mama', 'Niang', 'Mom', 'Mother'], dad: ['Baba', 'Papa', 'Dad', 'Father'] };

  // ---------------------------------------------------------------- activities
  // cost: gold per month (negative = she earns); gain: base stat gains per month; stress per month
  // aff: how her temperament bends her taste for it; anim: world sprite animation; who: the mentor
  D.ACTS = [
    { id: 'martial', name: 'Martial Hall', cat: 'study', icon: 'sword', scene: 'hall', anim: 'sword', cost: 40, gain: { vigor: 4, grace: 1 }, stress: 10, trait: { bold: 2 }, who: 'gao', aff: { bold: 0.5, fiery: 0.3, dreamy: -0.2 }, outfit: 'martial',
      lines: { great: ['She disarmed an older student with a move Master Gao hadn\'t taught yet.', 'Her stance was so steady that Master Gao balanced a teacup on her head.'], good: ['Horse stance, punch, horse stance, punch. Her legs shake, but they\'re getting strong.', 'She practiced forms until the lanterns were lit.'], poor: ['She spent most of the month face-down in the practice sand.', 'She tripped over her own sword. Twice. Master Gao sighed very loudly.'] } },
    { id: 'academy', name: 'Classics Academy', cat: 'study', icon: 'scroll', scene: 'academy', anim: 'read', cost: 40, gain: { wit: 4 }, stress: 9, trait: { diligent: 2 }, who: 'wen', aff: { diligent: 0.5, dreamy: 0.1, playful: -0.25 }, outfit: 'scholar',
      lines: { great: ['She recited a whole chapter from memory. Scholar Wen dropped his fan.', 'Her essay was pinned on the academy wall for everyone to see.'], good: ['Brush, ink, characters, repeat. Her calligraphy is getting neater.', 'She argued with Scholar Wen about a poem, and he admitted she had a point.'], poor: ['She fell asleep on her copybook and woke with ink on her cheek.', 'Her characters wobble like drunk ducks, says Scholar Wen.'] } },
    { id: 'guqin', name: 'Guqin Lessons', cat: 'study', icon: 'guqin', scene: 'teahouse', anim: 'guqin', cost: 45, gain: { art: 4, grace: 1 }, stress: 7, trait: { dreamy: 2 }, who: 'liu', aff: { dreamy: 0.5, playful: 0.1, fiery: -0.1 },
      lines: { great: ['She played "Flowing Water" and a stranger passing by stopped to cry.', 'Maestro Liu closed his eyes while she played and said nothing, which is his highest praise.'], good: ['Her fingertips are sore, but the notes ring clearer.', 'She practiced scales until the neighbors could hum them too.'], poor: ['A string snapped and hit her on the nose.', 'Maestro Liu says she plays like a cat on a roof. An enthusiastic cat.'] } },
    { id: 'etiquette', name: 'Court Etiquette', cat: 'study', icon: 'teacup', scene: 'palace', anim: 'serve', cost: 50, gain: { grace: 4 }, stress: 10, trait: { diligent: 1, fiery: -1 }, who: 'hua', aff: { diligent: 0.3, bold: -0.1, fiery: -0.4, playful: -0.3 },
      lines: { great: ['She poured tea so gracefully that Madam Hua asked who had taught her. (Madam Hua had.)', 'She crossed the whole hall with a bowl of water on her head. Not a drop spilled.'], good: ['Bow, sit, pour, bow. She now knows which cup goes to the guest of honor.', 'She learned the seventeen proper ways to say thank you.'], poor: ['She bowed so low she knocked over the tea tray.', 'She giggled during the ancestor ritual. Madam Hua is still recovering.'] } },
    { id: 'temple', name: 'Cloud Temple', cat: 'study', icon: 'lotus', scene: 'temple', anim: 'pray', cost: 25, gain: { heart: 4 }, stress: -1, trait: { fiery: -2 }, who: 'jingci', aff: { fiery: -0.5, dreamy: 0.2, bold: -0.1 },
      lines: { great: ['She sat through the whole dawn meditation without fidgeting once. The Abbess smiled.', 'She spent her free hours carrying water for the old nuns without being asked.'], good: ['She swept the temple steps and listened to the bells.', 'The Abbess taught her a sutra about kindness to all living things. She now apologizes to ants.'], poor: ['She fell asleep during chanting and snored in rhythm.', 'She fed the temple carp so much that one of them can no longer swim straight.'] } },
    { id: 'kitchen', name: 'Kitchen Lessons', cat: 'study', icon: 'dumpling', scene: 'kitchen', anim: 'cook', cost: 35, gain: { craft: 4, heart: 1 }, stress: 5, who: 'bao', aff: { playful: 0.3, dreamy: -0.2, diligent: 0.1 }, outfit: 'work',
      lines: { great: ['Her dumplings came out with eighteen perfect pleats. Auntie Bao called them "almost as good as mine".', 'She invented a new filling and the whole street lined up for it.'], good: ['She learned to fold dumplings that don\'t burst in the pot. Mostly.', 'She chops scallions so fast now that Auntie Bao told her to slow down.'], poor: ['She mixed up salt and sugar. The mooncakes were an experience.', 'Her steamer caught fire. Auntie Bao stayed calm. Suspiciously calm.'] } },
    { id: 'dance', name: 'Sleeve Dance', cat: 'study', icon: 'fan', scene: 'palace', anim: 'dance', minAge: 12, cost: 45, gain: { art: 2, grace: 2, vigor: 1 }, stress: 9, trait: { bold: 1 }, who: 'yue', aff: { bold: 0.3, playful: 0.2, dreamy: 0.2 }, outfit: 'dancer',
      lines: { great: ['Her long sleeves flew like cranes. Dancer Yue made the others stop and watch.', 'She spun thirty times and landed like a falling petal.'], good: ['She practiced turns until the room spun with her.', 'She learned to make her sleeves ripple like water.'], poor: ['She tangled herself in her own sleeves and had to be unwrapped.', 'She stepped on Dancer Yue\'s foot. Twice. A different foot each time.'] } },
    { id: 'observatory', name: 'Star Observatory', cat: 'study', icon: 'armillary', scene: 'observatory', anim: 'stars', minAge: 12, cost: 25, gain: { wit: 2, art: 1 }, star: 1, stress: 3, trait: { dreamy: 1 }, who: 'xing', aff: { dreamy: 0.6, bold: -0.1, diligent: 0.1 },
      lines: { great: ['She spotted a comet nobody had written down. Old Xing named it after her.', 'She charted the Weaver Star\'s whole constellation from memory.'], good: ['She learned the twenty-eight lunar mansions by heart.', 'She stayed up until dawn tracing the Silver River.'], poor: ['It was cloudy all month. She learned a great deal about clouds.', 'She fell asleep under the armillary sphere and woke up covered in dew.'] } },
    { id: 'medicine', name: 'Herbal Medicine', cat: 'study', icon: 'herb', scene: 'town', anim: 'pick', minAge: 12, cost: 40, gain: { heart: 2, wit: 2 }, stress: 7, trait: { diligent: 1 }, who: 'lu', aff: { fiery: -0.2, diligent: 0.3, dreamy: -0.1 },
      lines: { great: ['She identified a poisonous root that the physician himself had missed.', 'She set a farmer\'s broken arm without flinching.'], good: ['She learned forty herbs by smell. Some of them smell terrible.', 'She ground medicine all month. Her hands smell of ginseng.'], poor: ['She mixed up two jars and gave the cat a cough remedy. The cat is fine. Annoyed, but fine.', 'She fainted at the sight of a nosebleed. Her own.'] } },
    { id: 'cultivation', name: 'Mountain Cultivation', cat: 'study', icon: 'swirl', scene: 'mountain', anim: 'pray', minAge: 13, needFlag: 'immortal_met', reqText: 'Meet the wandering immortal first', cost: 60, gain: { wit: 2, art: 1, vigor: 1 }, star: 1, stress: 8, trait: { dreamy: 1 }, who: 'bai', aff: { dreamy: 0.5, bold: 0.2, diligent: 0.1 },
      lines: { great: ['She sat beneath the waterfall until the water seemed to part around her. Immortal Bai raised one eyebrow, which is a lot for him.', 'She made a falling leaf stop in midair. Only for a breath, but she did it.'], good: ['She breathed with the mountain wind until her mind went quiet and clear.', 'She practiced drawing qi into her palms. Her hands feel warm all the time now.'], poor: ['She tried to meditate and thought about dumplings the entire time.', 'She fell off the meditation rock. Twice.'] } },
    // work
    { id: 'teahouse', name: 'Teahouse Server', cat: 'work', icon: 'teapot', scene: 'teahouse', anim: 'serve', minAge: 13, cost: -45, gain: { grace: 1, heart: 1 }, stress: 10, trait: { bold: 1 }, aff: { bold: 0.4, playful: 0.3 }, outfit: 'teahouse',
      lines: { great: ['A traveling poet left her a poem instead of a tip. Then he left a tip too.', 'She remembered every regular\'s order without writing a single one down.'], good: ['She poured a thousand cups of tea and heard a thousand bits of gossip.', 'A merchant from the south taught her how to haggle.'], poor: ['She spilled chrysanthemum tea on a magistrate. He took it well, considering.', 'A rude customer made her cry in the storeroom.'] } },
    { id: 'stall', name: 'Dumpling Stall', cat: 'work', icon: 'steamer', scene: 'market', anim: 'cook', cost: -30, gain: { craft: 2, heart: 1 }, stress: 8, friend: 'tao', aff: { playful: 0.3, diligent: 0.2 }, outfit: 'work',
      lines: { great: ['She sold out before noon. Tao\'s family paid her extra, plus a bag of buns.', 'She talked a grumpy old man into buying forty dumplings.'], good: ['She folded dumplings beside Tao all month and laughed a lot.', 'Her feet hurt, but her pockets jingle.'], poor: ['She dropped a whole steamer basket in the mud.', 'She ate more dumplings than she sold.'] } },
    { id: 'tea', name: 'Tea Picking', cat: 'work', icon: 'sprout', scene: 'field', anim: 'pick', cost: -35, gain: { vigor: 2, craft: 1 }, stress: 9, aff: { dreamy: -0.2, diligent: 0.2, bold: 0.1 }, outfit: 'farmer',
      lines: { great: ['She picked more leaves than the grown women. They call her Little Tiger now.', 'She found a wild tea bush with the sweetest leaves anyone had tasted.'], good: ['Up and down the terraces all month. Her basket and her legs grew stronger.', 'She learned the song the tea pickers sing to keep time.'], poor: ['It rained all month and she slid down a terrace on her bottom.', 'She picked the wrong leaves. All of them.'] } },
    { id: 'silk', name: 'Silk Workshop', cat: 'work', icon: 'spool', scene: 'silk', anim: 'weave', cost: -35, gain: { craft: 2, art: 1 }, stress: 8, aff: { dreamy: 0.3, diligent: 0.3, bold: -0.2 },
      lines: { great: ['She wove a pattern of magpies so fine that a noble lady bought it on the spot.', 'Her embroidery was chosen for the temple\'s new banner.'], good: ['She worked the loom until its clack-clack followed her into her dreams.', 'She learned to split a single silk thread into sixteen.'], poor: ['She knotted a whole bolt of silk into something the owner called "a statement".', 'She pricked her fingers so often they look like pincushions.'] } },
    { id: 'escort', name: 'Escort Agency', cat: 'work', icon: 'banner', scene: 'mountain', anim: 'sword', minAge: 15, needStat: ['vigor', 35], reqText: 'Needs Vigor 35', cost: -60, gain: { vigor: 2, heart: 1 }, stress: 12, trait: { bold: 2 }, aff: { bold: 0.5, fiery: 0.3, dreamy: -0.1 }, outfit: 'martial',
      lines: { great: ['Bandits tried to rob the caravan. She sent them running. The merchants still talk about it.', 'She led the caravan through a mountain storm without losing a single mule.'], good: ['She guarded a tea caravan over the mountains and back.', 'She stood night watch and learned the stars\' names from the old guards.'], poor: ['She got lost and the caravan had to rescue her.', 'She fell asleep on watch and a goat ate her boots.'] } },
    { id: 'tutor', name: 'Tutoring Children', cat: 'work', icon: 'brush', scene: 'academy', anim: 'read', minAge: 15, needStat: ['wit', 35], reqText: 'Needs Wit 35', cost: -45, gain: { heart: 2, wit: 1 }, stress: 7, aff: { fiery: -0.3, playful: 0.2 },
      lines: { great: ['The worst-behaved boy in town wrote his very first poem for her.', 'Every one of her students passed their exams.'], good: ['She taught six small children their first hundred characters.', 'The children adore her and keep drawing her with enormous eyes.'], poor: ['The children tied her hair to her chair.', 'She lost her temper, then felt terrible about it all week.'] } },
    // leisure
    { id: 'rest', name: 'Rest at Home', cat: 'leisure', icon: 'moon', scene: 'home', anim: 'sleep', cost: 0, gain: {}, stress: -26, aff: {},
      lines: { great: ['She slept, ate, napped, ate again and read novels in the sun. Perfect.'], good: ['She spent the month resting at home.'], poor: ['She rested, but she seemed restless.'] } },
    { id: 'play', name: 'Play with Friends', cat: 'leisure', icon: 'kite', scene: 'garden', anim: 'kite', cost: 10, gain: { heart: 1 }, stress: -14, friend: 'mei', aff: { playful: 0.4, bold: 0.3 },
      lines: { great: ['She and Mei flew a kite so high it touched a cloud. (It did not. They insist it did.)'], good: ['Shuttlecock, hide-and-seek, climbing trees. A good month.'], poor: ['She and Mei had a fight and she spent the month sulking.'] } },
    { id: 'free', name: 'Her Choice', cat: 'leisure', icon: 'sparkle', scene: 'garden', anim: 'cheer', cost: 10, gain: {}, stress: -10, aff: {}, lines: { great: [], good: [], poor: [] } },
    { id: 'journey', name: 'Journey', cat: 'leisure', icon: 'mountain', scene: 'mountain', anim: 'idle', minAge: 13, cost: 25, gain: { vigor: 2 }, stress: 6, trait: { bold: 2 }, aff: { bold: 0.5, dreamy: 0.2 }, outfit: 'traveler', limit: 1,
      lines: { great: [], good: [], poor: [] } },
  ];
  D.ACT = {};
  D.ACTS.forEach((a) => (D.ACT[a.id] = a));

  // what she does when the month is hers
  D.HOBBIES = [
    { id: 'sketch', text: 'sketched every cat in town. There are forty-one drawings. Forty of them are the same cat.', gain: { art: 2 }, trait: 'dreamy' },
    { id: 'attic', text: 'read old novels in the attic until her eyes went square.', gain: { wit: 2 }, trait: 'dreamy' },
    { id: 'climb', text: 'climbed every tree on the hill and fell out of only two.', gain: { vigor: 2 }, trait: 'bold' },
    { id: 'bake', text: 'baked sesame cakes for the neighbors. Most of them were edible.', gain: { craft: 1, heart: 1 }, trait: 'playful' },
    { id: 'river', text: 'walked along the river collecting smooth stones, one for every day.', gain: { heart: 1, art: 1 }, trait: 'dreamy' },
    { id: 'garden', text: 'planted a little herb garden in the corner of the courtyard.', gain: { craft: 2 }, trait: 'diligent' },
    { id: 'songs', text: 'made up songs about everyone on the street. The butcher\'s song is very rude.', gain: { art: 1, grace: 1 }, trait: 'playful' },
    { id: 'practice', text: 'practiced on her own every single day. Nobody told her to.', gain: {}, trait: 'diligent', practice: true },
  ];

  // ---------------------------------------------------------------- outfits (pixel palettes)
  D.OUTFITS = {
    everyday: { name: 'Blossom ruqun', jacket: '#f7c6d4', collar: '#d85b82', inner: '#fffaf7', skirt: '#9fd6bf', bow: '#e0607e' },
    festival: { name: 'Festival silks', jacket: '#fff0d6', collar: '#d8434f', inner: '#fffaf2', skirt: '#e35d62', bow: '#f2c14e', cost: 80 },
    martial: { name: 'Martial wear', jacket: '#3d4a6b', collar: '#c9404c', inner: '#f4efe6', skirt: '#2e3752', bow: '#c9404c', cost: 50 },
    scholar: { name: 'Scholar robe', jacket: '#dbe8f4', collar: '#2f4166', inner: '#ffffff', skirt: '#b9cde3', bow: '#2f4166', cost: 60 },
    work: { name: 'Work clothes', jacket: '#d9c2a2', collar: '#8a6a4a', inner: '#fbf6ee', skirt: '#efe6d6', bow: '#c9594f' },
    dancer: { name: 'Dancer silks', jacket: '#ffd6e3', collar: '#d9577f', inner: '#ffffff', skirt: '#ff9fb9', bow: '#ffffff', cost: 90 },
    teahouse: { name: 'Teahouse apron', jacket: '#f6e3c5', collar: '#6f8f5b', inner: '#fffaf2', skirt: '#8fb37c', bow: '#6f8f5b' },
    farmer: { name: 'Tea picker', jacket: '#b9d3a8', collar: '#4e7a45', inner: '#fbf7ec', skirt: '#e9dcbf', bow: '#4e7a45' },
    traveler: { name: 'Road clothes', jacket: '#8a7a64', collar: '#4f5b6f', inner: '#f4efe6', skirt: '#6a5f52', bow: '#4f5b6f' },
    moon: { name: 'Moonlight gown', jacket: '#dfe6ff', collar: '#7d8fe0', inner: '#ffffff', skirt: '#b8c4f5', bow: '#f3d27a', cost: 160 },
    plum: { name: 'Plum blossom jacket', jacket: '#e9dcf7', collar: '#9a5ab8', inner: '#ffffff', skirt: '#c9a8e8', bow: '#9a5ab8', cost: 110 },
    // ending robes
    general: { name: 'General\'s armor', jacket: '#8a95ab', collar: '#b52a37', inner: '#f4efe6', skirt: '#7d1f2a', bow: '#e6b64d' },
    swordswoman: { name: 'Wanderer blacks', jacket: '#2a2730', collar: '#b52a37', inner: '#f4efe6', skirt: '#3a3540', bow: '#b52a37' },
    official: { name: 'Official robe', jacket: '#b3303d', collar: '#7d1d28', inner: '#fff7ea', skirt: '#8f2530', bow: '#e6b64d' },
    royal: { name: 'Crown princess robes', jacket: '#fff3e0', collar: '#c7364a', inner: '#fffdf7', skirt: '#d8434f', bow: '#e6b64d' },
    empress: { name: 'Empress regalia', jacket: '#c7263f', collar: '#e6b64d', inner: '#fff6e0', skirt: '#9e1c30', bow: '#e6b64d' },
    immortal: { name: 'Immortal robes', jacket: '#f4fbff', collar: '#9fd1ea', inner: '#ffffff', skirt: '#dff1fb', bow: '#9fd1ea' },
    physician: { name: 'Physician robe', jacket: '#e4efe3', collar: '#5f9072', inner: '#ffffff', skirt: '#cfe3d2', bow: '#5f9072' },
    musician: { name: 'Musician silks', jacket: '#e7dcf6', collar: '#7c5cb5', inner: '#ffffff', skirt: '#b9a2e6', bow: '#f3d27a' },
    astronomer: { name: 'Star-watcher robe', jacket: '#2b2f63', collar: '#e6c56a', inner: '#f4f0ff', skirt: '#23275a', bow: '#e6c56a' },
    chef: { name: 'Kitchen whites', jacket: '#fbf8f2', collar: '#c9594f', inner: '#ffffff', skirt: '#efe6d6', bow: '#c9594f' },
    merchant: { name: 'Merchant brocade', jacket: '#2c6a64', collar: '#e0b04a', inner: '#fff8ea', skirt: '#245550', bow: '#e0b04a' },
    priestess: { name: 'Temple vestments', jacket: '#f3f1ea', collar: '#3b4c7a', inner: '#ffffff', skirt: '#dcdfe8', bow: '#3b4c7a' },
    celestial: { name: 'Robes of the Silver River', jacket: '#fdfbff', collar: '#b9c6ff', inner: '#ffffff', skirt: '#cfd8ff', bow: '#f3d27a' },
  };

  // ---------------------------------------------------------------- her favourite things
  D.FAV = {
    food: ['osmanthus cakes', 'pork buns', 'tangyuan in ginger soup', 'candied hawthorn', 'scallion pancakes', 'lotus-paste mooncakes', 'peach blossom cakes', 'hot and sour noodles'],
    color: ['peach pink', 'jade green', 'sky blue', 'lotus white', 'plum purple', 'persimmon orange', 'moonlight silver'],
    animal: ['rabbits', 'cranes', 'red pandas', 'koi', 'foxes', 'cats', 'magpies'],
    flower: ['peach blossoms', 'lotus', 'chrysanthemums', 'plum blossoms', 'orchids', 'peonies'],
    fear: ['thunderstorms', 'the dark', 'deep water', 'being left alone', 'ghost stories', 'spiders'],
    quirk: ['hums when she concentrates', 'names every stray cat in town', 'collects smooth river stones', 'talks to the moon before bed', 'draws tiny stars on everything', 'sneaks extra sugar into her tea', 'reads by candlelight long after bedtime'],
  };

  // ---------------------------------------------------------------- dreams and careers
  D.DREAMS = {
    general: { career: 'general', say: 'I want to be a general. A real one, with a banner and an army and everything.' },
    swordswoman: { career: 'swordswoman', say: 'I want to be a wandering hero. Righting wrongs, sleeping under the stars.' },
    scholar: { career: 'scholar', say: 'I want to sit the imperial exam. And I want to come first.' },
    astronomer: { career: 'astronomer', say: 'I want to know where the stars come from. Where I come from.' },
    immortal: { career: 'immortal', say: 'I want to learn the ways of the immortals. Real magic, not tricks.' },
    physician: { career: 'physician', say: 'I want to heal people. When someone is hurting, I want to know what to do.' },
    musician: { career: 'musician', say: 'I want to play the guqin in front of a thousand people.' },
    dancer: { career: 'dancer', say: 'I want to dance in the Pear Garden in the capital.' },
    poet: { career: 'poet', say: 'I want to write poems people remember after I\'m gone.' },
    princess: { career: 'princess', say: 'Is it silly to want to be a princess?' },
    priestess: { career: 'priestess', say: 'I think I want to serve at the Cloud Temple.' },
    teacher: { career: 'teacher', say: 'I want to teach little kids to read, like somebody taught me.' },
    chef: { career: 'chef', say: 'I want a restaurant so famous people travel for days to eat there.' },
    merchant: { career: 'merchant', say: 'I want to run a trading house. Silk, tea, everything.' },
    teahouse: { career: 'teahouse', say: 'I want my own teahouse, where travelers tell stories.' },
    farmer: { career: 'farmer', say: 'I want tea terraces of my own, right up the mountain.' },
    weaver: { career: 'weaver', say: 'I want to weave silk so fine it looks like water.' },
  };
  D.ACT_DREAM = { martial: 'general', escort: 'swordswoman', journey: 'swordswoman', academy: 'scholar', observatory: 'astronomer', cultivation: 'immortal', medicine: 'physician', guqin: 'musician', dance: 'dancer', etiquette: 'princess', temple: 'priestess', tutor: 'teacher', kitchen: 'chef', stall: 'chef', teahouse: 'teahouse', tea: 'farmer', silk: 'weaver' };
})();
