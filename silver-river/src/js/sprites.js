/* Silver River — 16x32 world sprites (Stardew-sized), authored as text grids.
   Symmetric parts are written as left halves (8 columns) and mirrored; asymmetric details are patched on.
   Palette keys: o outline · H/h/L hair base/shade/light · S/s skin/shade · e eye dark · E eye colour · b blush
   m mouth · C/c jacket/shade · T collar trim · I inner collar · K/k skirt/shade · R ribbon · F shoes · Y gold
   P prop wood · p prop wood dark · W white · G steel · g steel dark · Q prop accent · q prop accent dark */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const SP = (G.Sprites = {});

  // mirror 8-column halves into 16-column rows
  const MIRROR = { '(': ')', ')': '(', '/': '\\', '\\': '/' };
  function sym(halves) {
    return halves.map((h) => {
      h = h.padEnd(8, '.').slice(0, 8);
      return h + h.split('').reverse().map((c) => MIRROR[c] || c).join('');
    });
  }
  // apply [x, y, 'chars'] patches onto a list of rows
  function patch(rows, patches) {
    const out = rows.map((r) => r.split(''));
    (patches || []).forEach(([x, y, str]) => {
      for (let i = 0; i < str.length; i++) {
        if (str[i] === ' ') continue;
        if (out[y] && x + i >= 0 && x + i < out[y].length) out[y][x + i] = str[i];
      }
    });
    return out.map((r) => r.join(''));
  }
  const join = (rows) => rows.join('\n');
  SP.sym = sym;
  SP.patch = patch;

  // ---------------------------------------------------------------- her: head (front, back, side)
  const HEAD_F = sym([
    '........',
    '......oo',
    '....ooHH',
    '...oHHHH',
    '..oHHHHH',
    '.oHHHHHH',
    '.oHHHHHH',
    'oHHHhHHH',
    'oHHhSHhS',
    'oHHSSSSS',
    'oHHSSSSS',
    'oHHSSeSS',
    'oHHSSESS',
    'oHHbSSSS',
    'oHHhSSSm',
    '.oHHoSSS',
  ]);
  const HEAD_F_PATCH = [
    [6, 0, 'oo'],
    [5, 1, 'oLo'],
    [5, 2, 'oLL'],
    [4, 3, 'oLL'],
    [4, 4, 'HL'],
    [11, 8, 'H'],
    [8, 8, 'h'],
  ];
  const headFront = (blink) => {
    let r = patch(HEAD_F, HEAD_F_PATCH);
    if (blink) r = patch(r, [[5, 11, 'S'], [10, 11, 'S'], [5, 12, 'e'], [10, 12, 'e']]);
    return r;
  };
  const HEAD_B = patch(
    sym([
      '........',
      '......oo',
      '....ooHH',
      '...oHHHH',
      '..oHHHHH',
      '.oHHHHHH',
      '.oHHHHHH',
      'oHHHhHHH',
      'oHHHHhHH',
      'oHHhHHHH',
      'oHHHHHhH',
      'oHHHhHHH',
      'oHHHHHHh',
      'oHHhHHHH',
      'oHHHHHhH',
      '.oHHHHHH',
    ]),
    [[6, 0, 'oo'], [5, 1, 'oLo'], [5, 2, 'oLL'], [6, 7, 'RR'], [8, 7, 'RR']]
  );
  // side view, facing left (flip for right)
  const HEAD_S = [
    '.......oo.......',
    '......oLo.......',
    '....ooLHHoo.....',
    '...oHLLHHHHo....',
    '..oHLHHHHHHHo...',
    '.oHHHHHHHHHHHo..',
    '.oHHHHHHHHHHHo..',
    'oHhHHHHhHHHHHHo.',
    'ohSHhSSHHHHhHHo.',
    'oSSSSSSHHHHHHHo.',
    'oSSSSSSHHHHHHHo.',
    'oSeSSSSHHHHHHHo.',
    'oSESSSSHHhHHHHo.',
    '.obSSSSHHHHHHHo.',
    '.oSmSSSHHHHhHHo.',
    '..oSSSoHHHHHHHo.',
  ];

  // ---------------------------------------------------------------- her: body (front, back, side)
  const BODY_F = sym([
    '.oHHoooS',
    'oHHoCCTI',
    'oHoCCCCT',
    'oHocCCCC',
    'oHocRRRR',
    'oHocKKKK',
    'oHocKKKK',
    '.oocKKKk',
    '..oSKKKK',
    '..ooKKKK',
    '...oKKKk',
    '...oKKKK',
    '...oKKKK',
    '..oKKKKk',
    '..oooooo',
    '....oFFo',
  ]);
  // cross collar: the band runs from her left shoulder down to her right side
  const BODY_F_PATCH = [[9, 1, 'TC'], [8, 2, 'T'], [7, 3, 'T'], [6, 3, 'T']];
  const BODY_B = sym([
    '.oHHHHHH',
    'oHHHHHHH',
    'oHoCHHHH',
    'oHocHHHH',
    'oHocRRHH',
    'oHocKHHH',
    'oHocKKHK',
    '.oocKKKK',
    '..oSKKKK',
    '..ooKKKK',
    '...oKKKk',
    '...oKKKK',
    '...oKKKK',
    '..oKKKKk',
    '..oooooo',
    '....oFFo',
  ]);
  const BODY_S = [
    '...ooSSooHHHo...',
    '..oCTTCCCoHHo...',
    '..oCCTCCCCoHo...',
    '..oCCCCCCCoHo...',
    '..oRRRRRRRoHo...',
    '..oKKKKKKKoo....',
    '..oKKKKKKKo.....',
    '..oKKcKKKKo.....',
    '..oKKcSKKKo.....',
    '..oKKKKKKKo.....',
    '..oKKKKKKKo.....',
    '..oKKKkKKKo.....',
    '..oKKKkKKKKo....',
    '.oKKKKkKKKKo....',
    '.ooooooooooo....',
    '..oFFo..........',
  ];

  // walking: feet and hem shift per frame
  function walkFront(rows, f, male) {
    const feet = [
      [[4, 31, '.oFFo...'], [8, 31, '........']],
      [[4, 31, '.oFFo...'], [8, 31, '...oFFo.']],
      [[4, 31, '........'], [8, 31, '...oFFo.']],
      [[4, 31, '.oFFo...'], [8, 31, '...oFFo.']],
    ][f];
    let r = patch(rows, feet);
    if (male) return r;
    if (f === 0) r = patch(r, [[2, 29, 'oKK'], [11, 29, 'Kk.']]);
    if (f === 2) r = patch(r, [[2, 29, '.oK'], [11, 29, 'Kko']]);
    return r;
  }
  function walkSide(rows, f) {
    const feet = [
      [[1, 31, '.oFFo.....']],
      [[1, 31, '..oFFo....']],
      [[1, 31, '...oFFoFFo']],
      [[1, 31, '..oFFo....']],
    ][f];
    return patch(rows, feet);
  }

  // ---------------------------------------------------------------- hairstyles and bodies
  // her body without long hair down the sides (for gathered styles)
  const BODY_F_SHORT = sym([
    '....oooS',
    '..ooCCTI',
    '.oCCCCCT',
    '.oCcCCCC',
    '.oCcRRRR',
    '.oCcKKKK',
    '.oCcKKKK',
    '..ocKKKk',
    '..oSKKKK',
    '..ooKKKK',
    '...oKKKk',
    '...oKKKK',
    '...oKKKK',
    '..oKKKKk',
    '..oooooo',
    '....oFFo',
  ]);
  const STYLE_HEAD = {
    buns: [[1, 0, ' oo'], [0, 1, 'oHHo'], [0, 2, 'oHLo'], [1, 3, 'oRo'], [12, 0, 'oo '], [12, 1, 'oHHo'], [12, 2, 'oLHo'], [12, 3, 'oRo']],
    updo: [[5, 0, 'oooooo'], [4, 1, 'oHHLLHHo'], [4, 2, 'oHHHHHH'], [11, 0, 'Y'], [12, 1, 'Y']],
    ponytail: [[12, 2, 'oR'], [13, 3, 'oHo'], [13, 4, 'oHHo'], [14, 5, 'oHo'], [14, 6, 'oHo']],
    braid: [],
  };
  const STYLE_BODY = {
    ponytail: [[13, 0, 'oHo'], [14, 1, 'oHo'], [14, 2, 'oHo'], [14, 3, 'oho'], [14, 4, 'oHo'], [14, 5, '.o.']],
    braid: [[0, 0, '.oH'], [0, 1, 'oHh'], [0, 2, 'ohH'], [0, 3, 'oHh'], [0, 4, 'ohH'], [0, 5, 'oRo'], [0, 6, '.H.'], [0, 7, '.o.']],
  };

  // male head and robe (for Tao, the prince, teachers and townsfolk)
  const HEAD_M = sym([
    '........',
    '.......o',
    '......oH',
    '.....ooH',
    '...ooHHH',
    '..oHHHHH',
    '..oHHHHH',
    '.oHHHhHH',
    '.oHhSSHh',
    '.oHSSSSS',
    '.oSSSeSS',
    '.oSSSESS',
    '.oSSSSSS',
    '..oSSSSm',
    '..oSSSSS',
    '...ooSSS',
  ]);
  const HEAD_M_BACK = sym([
    '........',
    '.......o',
    '......oH',
    '.....ooH',
    '...ooHHH',
    '..oHHHHH',
    '..oHHHHH',
    '.oHHHhHH',
    '.oHHHHHH',
    '.oHhHHHH',
    '.oHHHHhH',
    '.oHHHHHH',
    '.oHhHHHH',
    '..oHHHHH',
    '..oSSSSS',
    '...ooSSS',
  ]);
  const HEAD_M_SIDE = [
    '.......o........',
    '......oHo.......',
    '.....oHHo.......',
    '...ooHHHHoo.....',
    '..oHHHHHHHHo....',
    '.oHHHHHHHHHHo...',
    '.oHHhHHHHHHHo...',
    'oHhSSHHHHHHHHo..',
    'oSSSSSHHHHHHHo..',
    'oSSSSSSHHHHHo...',
    'oSeSSSSSHHHHo...',
    'oSESSSSSSHHo....',
    '.oSSSSSSSSo.....',
    '.oSmSSSSSSo.....',
    '..oSSSSSSo......',
    '...ooSSoo.......',
  ];
  const BODY_M = sym([
    '....ooSS',
    '..ooCCTI',
    '.oCCCCCT',
    '.oCcCCCC',
    '.oCcCCCC',
    '.oCcRRRR',
    '.oCcCCCC',
    '..oSCCCC',
    '..ooKKKK',
    '...oKKKK',
    '...oKKKK',
    '...oKKKk',
    '...oKKKK',
    '...oKKKK',
    '...ooooo',
    '....oFFo',
  ]);
  const BODY_M_SIDE = [
    '...ooSSoo.......',
    '..oCTTCCCo......',
    '..oCCTCCCCo.....',
    '..oCCCCCCCo.....',
    '..oCCCCCCCo.....',
    '..oRRRRRRRo.....',
    '..oCCCCCCCo.....',
    '..oCCcSCCCo.....',
    '..oKKKKKKKo.....',
    '..oKKKKKKKo.....',
    '..oKKKKKKKo.....',
    '..oKKKkKKKo.....',
    '..oKKKkKKKo.....',
    '..oKKKKKKKo.....',
    '..ooooooooo.....',
    '..oFFo..........',
  ];
  const BEARD = [[6, 13, 'HHHH'], [6, 14, 'HHHH'], [7, 15, 'HH']];

  function frontRows(cfg, blink) {
    if (cfg.male) {
      let h = patch(HEAD_M, [[7, 0, 'oo'], [6, 1, 'oHHo'], [6, 2, 'oYYo']]);
      if (blink) h = patch(h, [[5, 10, 'S'], [10, 10, 'S'], [5, 11, 'e'], [10, 11, 'e']]);
      if (cfg.beard) h = patch(h, BEARD);
      return h.concat(patch(BODY_M, BODY_F_PATCH));
    }
    let h = headFront(blink);
    if (STYLE_HEAD[cfg.style]) h = patch(h, STYLE_HEAD[cfg.style]);
    const long = !cfg.style || cfg.style === 'wavy' || cfg.style === 'straight' || cfg.style === 'buns';
    let b = patch(long ? BODY_F : BODY_F_SHORT, BODY_F_PATCH);
    if (STYLE_BODY[cfg.style]) b = patch(b, STYLE_BODY[cfg.style]);
    return h.concat(b);
  }
  function backRows(cfg) {
    if (cfg.male) return HEAD_M_BACK.concat(BODY_M);
    return HEAD_B.concat(BODY_B);
  }
  function sideRows(cfg) {
    if (cfg.male) return HEAD_M_SIDE.concat(BODY_M_SIDE);
    return HEAD_S.concat(BODY_S);
  }
  const bob = (rows, dy) => (dy > 0 ? ['.'.repeat(16)].concat(rows.slice(0, rows.length - 1)) : rows);

  // ---------------------------------------------------------------- props (small sprites, drawn over her)
  SP.PROPS = {
    scroll: ['.oooooooo.', 'oWWWWWWWWo', 'oPWxWxWWPo', 'oPWWxWxWPo', 'oWWWWWWWWo', '.oooooooo.'],
    sword1: ['.......oG', '......oGo', '.....oGo.', '....oGo..', '...oGo...', '.YoGo....', '..Yo.....', '.Y.Y.....'],
    sword2: ['Y.Y......', '.Yo......', 'YoGo.....', '..oGo....', '...oGo...', '....oGo..', '.....oGo.', '......oGo'],
    guqin: ['.oooooooooooooo.', 'oppppppppppppppo', 'oPWPWPWPWPWPWPPo', 'oPPPPPPPPPPPPPPo', '.opo........opo.'],
    wok: ['o........o', 'oggggggggo', '.oGGGGGGo.', '..oooooo..'],
    ladle1: ['..o', '.oP', 'oP.', 'P..'],
    ladle2: ['o..', 'Po.', '.Po', '..P'],
    ribbon1: ['QQ......', '..QQ....', '....Q...', '.....QQ.', '.......Q'],
    ribbon2: ['......QQ', '....QQ..', '...Q....', '.QQ.....', 'Q.......'],
    basket: ['.oooooo.', 'oPpPpPPo', 'oPPpPpPo', '.oooooo.'],
    tray: ['oooooooo', '.oWoWWo.', '..oooo..'],
    teapot: ['..oo..', '.oWWoo', 'oWWWWo', '.oooo.'],
    telescope: ['......oo', '....ooYo', '..ooYYo.', 'ooYYo...', 'oYo.....'],
    kite: ['...o...', '..oQo..', '.oQqQo.', 'oQqQqQo', '.oQqQo.', '..oQo..', '...o...'],
    incense: ['.Y.', '.p.', '.p.', 'ooo'],
    book: ['oooooo', 'oWWoWo', 'oWWoWo', 'oooooo'],
    loom: ['oooooooooooo', 'oPWWWWWWWWPo', 'oPWQWQWQWWPo', 'oPWWWWWWWWPo', 'oPPPPPPPPPPo', 'op........po'],
    herb: ['..Q.', '.QqQ', 'Qq..', '.p..'],
    lantern: ['.oo.', 'oQQo', 'oqQo', '.oo.', '.Y..'],
    zzz: ['ooo.....', '..o.....', '.o..oo..', 'ooo..o..', '....o...', '....oo..'],
    heart: ['.o.o.', 'oQoQo', 'oQQQo', '.oQo.', '..o..'],
    note: ['..oQ', '..oQ', '..o.', 'QQo.', 'QQ..'],
    drop: ['.o.', 'oWo', 'oWo', '.o.'],
    sparkle: ['..Y..', '.YWY.', 'YWWWY', '.YWY.', '..Y..'],
    anger: ['.q.q.', 'qq.qq', '.....', 'qq.qq', '.q.q.'],
    bang: ['.oo.', 'oQQo', 'oQQo', 'oQQo', '.oo.', '....', '.oo.', 'oQQo', '.oo.'],
    dots: ['.......', 'o.o.o..', '.......'],
  };
  // the family cat (side view, facing left)
  SP.CAT_PAL = { o: '#2d1824', C: '#e8a25a', c: '#c07a3a', W: '#fff4e8', p: '#f08a9a', e: '#2d1824' };
  const CAT = {
    idle: [
      ['.o..o.......', 'oCooCo......', 'oCCCCo......', 'oeCeCo....o.', 'oCpCCCooooCo', '.oWCCCCCCCo.', '..oCCCcCCCo.', '..oCo.oCoCo.', '..oo..oo.oo.'],
      ['.o..o.......', 'oCooCo......', 'oCCCCo.....o', 'oeCeCo....oC', 'oCpCCCooooCo', '.oWCCCCCCCo.', '..oCCCcCCCo.', '..oCo.oCoCo.', '..oo..oo.oo.'],
    ],
    walk: [
      ['.o..o.......', 'oCooCo......', 'oCCCCo......', 'oeCeCo....o.', 'oCpCCCooooCo', '.oWCCCCCCCo.', '..oCCCcCCCo.', '.oCo..oCo.o.', '.oo....oo...'],
      ['.o..o.......', 'oCooCo......', 'oCCCCo......', 'oeCeCo....o.', 'oCpCCCooooCo', '.oWCCCCCCCo.', '..oCCCcCCCo.', '...oCooCo...', '...oo.oo....'],
    ],
  };
  function catAnims() {
    const mk = (list) => list.map((rows) => ({ rows }));
    const w = mk(CAT.walk);
    return { idle: mk(CAT.idle), walk_side: w, walk_down: w, walk_up: w, love: mk(CAT.idle) };
  }
  SP.PROP_PAL = {
    o: '#2d1824', P: '#9a6a44', p: '#6b4029', W: '#fff7ec', x: '#6a5a5a', G: '#d8dde8', g: '#8a93a8', Y: '#f2c14e', Q: '#e0607e', q: '#b24462',
  };

  // ---------------------------------------------------------------- animations
  // Each animation is a list of frames; a frame is { rows, props: [{name, x, y}] , dy }
  function A(list) {
    return list.map((f) => (Array.isArray(f) ? { rows: f } : f));
  }
  const withArms = (rows, pose) => {
    // arms raised to the chest (holding something in front)
    if (pose === 'hold') return patch(rows, [[3, 22, 'cS'], [11, 22, 'Sc'], [3, 23, 'co'], [11, 23, 'oc']]);
    if (pose === 'up') return patch(rows, [[1, 14, 'oS'], [13, 14, 'So'], [1, 15, 'oC'], [13, 15, 'Co'], [2, 16, 'C'], [13, 16, 'C']]);
    if (pose === 'pray') return patch(rows, [[7, 21, 'SS'], [6, 22, 'oSSo'], [3, 23, 'o'], [12, 23, 'o']]);
    return rows;
  };
  const sitting = (rows) => {
    // fold the skirt: drop the legs, spread the hem
    const top = rows.slice(0, 26);
    const out = ['.'.repeat(16), '.'.repeat(16), '.'.repeat(16), '.'.repeat(16)].concat(top.slice(0, 22)).concat([
      '..oKKKKKKKKKKo..',
      '.oKKKkKKKKkKKKo.',
      'oKKKKKKKKKKKKKKo',
      'oooooooooooooooo',
    ].map((r) => r)).concat(['.'.repeat(16), '.'.repeat(16)]).slice(0, 32);
    out.sitting = true;
    return out;
  };

  // younger bodies: the same head over fewer torso and skirt rows, so she visibly grows up.
  // standing: kid 28 rows, teen 30, grown 32. Sitting frames keep a 4px drop below standing.
  const SHRINK = { kid: { stand: [19, 25, 26, 27], sit: [23, 27, 30, 31] }, teen: { stand: [26, 27], sit: [30, 31] } };
  function shrink(anims, band) {
    const S = SHRINK[band];
    Object.values(anims).forEach((frames) =>
      frames.forEach((f) => {
        const del = f.rows.sitting ? S.sit : S.stand;
        f.rows = f.rows.filter((_, i) => !del.includes(i));
        if (f.props) f.props = f.props.map((p) => Object.assign({}, p, { y: p.y - del.filter((d) => d < p.y).length }));
      })
    );
    return anims;
  }
  SP.bandFor = (age) => (age <= 12 ? 'kid' : age <= 15 ? 'teen' : undefined);
  // townsfolk: her friends grow up alongside her; the lane boy stays little
  const PEERS = ['mei', 'tao', 'wanyin', 'prince'];
  SP.npcCfg = function (id, n, herAge) {
    const cfg = { style: n.style, male: n.body === 'man' || n.body === 'boy', beard: n.beard };
    const band = id === 'kid' ? 'kid' : PEERS.includes(id) && herAge ? SP.bandFor(herAge) : undefined;
    if (band) cfg.band = band;
    return cfg;
  };

  const buildCache = new Map();
  SP.build = function (cfg = {}) {
    const key = JSON.stringify(cfg);
    if (buildCache.has(key)) return buildCache.get(key);
    if (cfg.cat) {
      const c = catAnims();
      buildCache.set(key, c);
      return c;
    }
    const F = frontRows(cfg, false), FB = frontRows(cfg, true);
    const BACK = () => backRows(cfg), SIDE = () => sideRows(cfg);
    const anims = {
      idle: A([{ rows: F }, { rows: F }, { rows: F, dy: 1 }, { rows: FB }]),
      walk_down: A([0, 1, 2, 3].map((i) => ({ rows: walkFront(F, i, cfg.male), dy: i % 2 }))),
      walk_up: A([0, 1, 2, 3].map((i) => ({ rows: walkFront(BACK(), i, cfg.male), dy: i % 2 }))),
      walk_side: A([0, 1, 2, 3].map((i) => ({ rows: walkSide(SIDE(), i), dy: i % 2 }))),
      stand_side: A([{ rows: SIDE() }]),
      stand_back: A([{ rows: BACK() }]),
      read: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'scroll', x: 3, y: 20 }] },
        { rows: withArms(FB, 'hold'), props: [{ name: 'scroll', x: 3, y: 20 }] },
        { rows: withArms(F, 'hold'), props: [{ name: 'scroll', x: 3, y: 20 }], dy: 1 },
      ]),
      sword: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'sword1', x: 9, y: 12 }] },
        { rows: withArms(F, 'hold'), props: [{ name: 'sword1', x: 9, y: 12 }], dy: 1 },
        { rows: withArms(F, 'hold'), props: [{ name: 'sword2', x: -1, y: 20 }] },
        { rows: withArms(F, 'hold'), props: [{ name: 'sword2', x: -1, y: 20 }] },
      ]),
      guqin: A([
        { rows: sitting(withArms(F, 'hold')), props: [{ name: 'guqin', x: 0, y: 25 }, { name: 'note', x: 13, y: 4 }] },
        { rows: sitting(withArms(FB, 'hold')), props: [{ name: 'guqin', x: 0, y: 25 }] },
        { rows: sitting(withArms(F, 'hold')), props: [{ name: 'guqin', x: 0, y: 25 }, { name: 'note', x: 12, y: 1 }], dy: 1 },
      ]),
      cook: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'wok', x: 3, y: 23 }, { name: 'ladle1', x: 9, y: 19 }] },
        { rows: withArms(F, 'hold'), props: [{ name: 'wok', x: 3, y: 23 }, { name: 'ladle2', x: 5, y: 19 }] },
      ]),
      dance: A([
        { rows: withArms(F, 'up'), props: [{ name: 'ribbon1', x: -6, y: 8 }, { name: 'ribbon2', x: 14, y: 8 }] },
        { rows: SIDE(), props: [{ name: 'ribbon2', x: -6, y: 12 }], dy: 1 },
        { rows: BACK(), props: [{ name: 'ribbon1', x: 12, y: 10 }] },
        { rows: SIDE(), flip: true, props: [{ name: 'ribbon1', x: 14, y: 12 }], dy: 1 },
      ]),
      pray: A([
        { rows: withArms(FB, 'pray'), props: [{ name: 'incense', x: 17, y: 26 }] },
        { rows: withArms(FB, 'pray'), props: [{ name: 'incense', x: 17, y: 26 }, { name: 'sparkle', x: 16, y: 18 }], dy: 1 },
      ]),
      sleep: A([
        { rows: sitting(FB), props: [{ name: 'zzz', x: 12, y: -2 }] },
        { rows: sitting(FB), props: [{ name: 'zzz', x: 12, y: -4 }], dy: 1 },
      ]),
      sit: A([{ rows: sitting(F) }, { rows: sitting(F) }, { rows: sitting(FB) }]),
      stars: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'telescope', x: 8, y: 14 }] },
        { rows: withArms(FB, 'hold'), props: [{ name: 'telescope', x: 8, y: 14 }, { name: 'sparkle', x: 16, y: 2 }] },
      ]),
      serve: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'tray', x: 4, y: 21 }, { name: 'teapot', x: 5, y: 17 }] },
        { rows: withArms(F, 'hold'), props: [{ name: 'tray', x: 4, y: 21 }, { name: 'teapot', x: 5, y: 17 }], dy: 1 },
      ]),
      pick: A([
        { rows: withArms(F, 'hold'), props: [{ name: 'basket', x: 4, y: 22 }] },
        { rows: withArms(FB, 'hold'), props: [{ name: 'basket', x: 4, y: 22 }, { name: 'herb', x: 11, y: 18 }], dy: 1 },
      ]),
      weave: A([
        { rows: sitting(withArms(F, 'hold')), props: [{ name: 'loom', x: 2, y: 24 }] },
        { rows: sitting(withArms(F, 'hold')), props: [{ name: 'loom', x: 2, y: 24 }], dy: 1 },
      ]),
      kite: A([
        { rows: withArms(F, 'up'), props: [{ name: 'kite', x: 18, y: -6 }] },
        { rows: withArms(F, 'up'), props: [{ name: 'kite', x: 19, y: -8 }], dy: 1 },
      ]),
      cheer: A([{ rows: withArms(F, 'up'), dy: 1 }, { rows: withArms(F, 'up'), props: [{ name: 'sparkle', x: 13, y: 0 }] }]),
      cry: A([{ rows: withArms(FB, 'pray'), props: [{ name: 'drop', x: 3, y: 12 }] }, { rows: withArms(FB, 'pray'), dy: 1, props: [{ name: 'drop', x: 3, y: 14 }] }]),
      love: A([{ rows: F, props: [{ name: 'heart', x: 12, y: -2 }] }, { rows: F, dy: 1, props: [{ name: 'heart', x: 12, y: -4 }] }]),
    };
    if (SHRINK[cfg.band]) shrink(anims, cfg.band);
    buildCache.set(key, anims);
    return anims;
  };

  // palette for her, from look + outfit
  SP.palette = function (look, outfit) {
    const P = G.Portrait;
    const U = G.U;
    const hair = P.HAIR[look.hair] || P.HAIR.gold;
    const skin = P.SKIN[look.skin] || P.SKIN.fair;
    const eye = P.EYES[look.eyes] || P.EYES.blossom;
    const O = outfit;
    return Object.assign({}, SP.PROP_PAL, {
      o: '#2d1824',
      H: hair[3], h: hair[2], L: hair[4],
      S: skin[4], s: skin[3], b: U.mix(skin[4], '#ff6f8a', 0.4), m: U.mix(skin[2], '#b0445a', 0.45),
      e: '#2d1824', E: eye[1],
      C: O.jacket, c: U.tone(O.jacket, -0.1, 0.04),
      T: O.collar, I: O.inner || '#fffaf7',
      K: O.skirt || O.jacket, k: U.tone(O.skirt || O.jacket, -0.1, 0.04),
      R: O.bow || O.collar, F: '#5a3a3a',
    });
  };

  SP.previewFrames = function () {
    const q = new URLSearchParams(location.search);
    const anims = SP.build({ style: q.get('style') || 'wavy', male: q.get('male') === '1', beard: q.get('beard') === '1' });
    const out = [];
    Object.entries(anims).forEach(([name, frames]) => {
      frames.forEach((fr, i) => {
        const rows = bob(fr.rows, fr.dy || 0);
        const props = (fr.props || []).map((p) => ({ src: SP.PROPS[p.name].join('\n'), x: p.x + 8, y: p.y + 8 }));
        const src = G.PX.compose(32, 44, [{ src: join(rows), x: 8, y: 8, flip: fr.flip }].concat(props));
        out.push([name + i, src]);
      });
    });
    return out;
  };
  SP.join = join;
  SP.bob = bob;
})();
