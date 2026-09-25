// Headless playthroughs of the game logic (no DOM). Usage: node tools/simulate.js [games] [length] [policy]
// Catches script errors and prints the spread of endings. Policies: random | focus | caring | harsh
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..', 'src', 'js');
const files = ['core.js', 'data.js', 'npcs.js', 'mind.js', 'sim.js', 'endings.js', 'events.js', 'events2.js', 'town.js', 'talk.js'];
const sandbox = { window: {}, console, setTimeout, clearTimeout, Math, JSON, Date, CSS: { escape: (x) => x } };
sandbox.window = sandbox;
vm.createContext(sandbox);
files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }));
const G = sandbox.SilverRiver;
const { U, D, M, Sim, Talk: T, Endings: E } = { U: G.U, D: G.D, M: G.Mind, Sim: G.Sim, Talk: G.Talk, Endings: G.Endings };
G.LLM = { ready: () => false };

const N = +(process.argv[2] || 200);
const LEN = process.argv[3] || 'standard';
const POLICY = process.argv[4] || 'random';

function stubIO(policy) {
  return {
    say: async () => {},
    choose: async (opts) => {
      const ok = opts.map((o, i) => [o, i]).filter(([o]) => !o.disabled);
      if (policy === 'caring') return ok[0][1];
      if (policy === 'harsh') return ok[ok.length - 1][1];
      return ok[Math.floor(Math.random() * ok.length)][1];
    },
    input: async (l, d) => d,
    freeText: async () => '',
    scene: async () => {},
    minigame: async () => ({ win: Math.random() < 0.5, score: 1 }),
    wait: async () => {},
  };
}

function planFor(s, policy) {
  const avail = Sim.available(s).filter((id) => id !== 'free');
  const affordable = (id) => Sim.cost(s, id) <= s.gold;
  const plan = [];
  if (policy === 'focus') {
    const fav = ['academy', 'observatory', 'guqin'].filter((x) => avail.includes(x));
    for (let i = 0; i < 3; i++) plan.push(s.stress > 60 ? 'rest' : i === 2 && s.gold < 60 ? 'silk' : fav[i % fav.length] || 'academy');
  } else if (policy === 'caring') {
    for (let i = 0; i < 3; i++) {
      if (s.stress > 55 && !plan.includes('rest')) plan.push('rest');
      else if (s.wish && !plan.includes(s.wish.id) && avail.includes(s.wish.id)) plan.push(s.wish.id);
      else {
        const liked = avail.filter((id) => s.aff[id] > 0.3 && affordable(id));
        plan.push(liked.length ? liked[Math.floor(Math.random() * liked.length)] : 'rest');
      }
    }
  } else if (policy === 'harsh') {
    for (let i = 0; i < 3; i++) plan.push(['etiquette', 'academy', 'martial'][i]);
  } else {
    for (let i = 0; i < 3; i++) plan.push(avail[Math.floor(Math.random() * avail.length)]);
  }
  if (s.flags.autonomy || s.age >= 17) plan[2] = 'free';
  // keep within budget: swap expensive lessons for work
  while (Sim.shortfall(s, plan) > 0) {
    const i = plan.findIndex((id) => Sim.cost(s, id) > 0);
    if (i < 0) break;
    plan[i] = 'tea';
  }
  return plan;
}

async function game(policy) {
  const s = Sim.newGame({ role: Math.random() < 0.5 ? 'mom' : 'dad', background: U.pick(Object.keys(D.PARENTS)), length: LEN, look: { hair: 'gold', eyes: 'blossom', skin: 'fair', style: 'wavy' }, name: 'Xing' });
  s.diaryBook = [];
  const io = stubIO(policy);
  const ctx = (log) => Sim.ctx(s, io, { log });
  const run = async (e, log) => {
    s.seen[e.id] = true;
    await e.run(ctx(log));
  };
  await run(G.Events.find((e) => e.id === 'arrival'));
  while (s.turn < s.turns) {
    const sea = Sim.season(s);
    if (s.turn === 0) await run(G.Events.find((e) => e.id === 'first_morning'));
    else for (const e of Sim.pickEvents(s, 'start', 1)) if (e.priority || U.chance(0.55)) await run(e);
    s.wish = M.wish(s, Sim.available(s));
    // the town: news and visitors must always come out as clean text
    s.phase = 'plan';
    const news = G.Town.news(s);
    if (!news || /\{\w+\}/.test(news)) throw new Error('bad news: ' + news);
    const v = G.Town.pickVisitor(s);
    if (v) for (const [, t] of v.lines) if (!t || /\{\w+\}|undefined|\[object/.test(t)) throw new Error('bad visit line: ' + v.id + ' ' + t);
    if (v) visitors[v.id] = (visitors[v.id] || 0) + 1;
    s.phase = 'run';
    s.focus = policy === 'harsh' ? 'work' : policy === 'caring' ? 'family' : U.pick(['balanced', 'balanced', 'work', 'family']);
    const talks = s.focus === 'family' ? 2 : 1;
    for (let k = 0; k < talks; k++) if (Math.random() < (policy === 'harsh' ? 0.2 : 0.8)) await T.run(U.pick(T.topics(s)).id, ctx());
    if (s.focus !== 'work' && Math.random() < (policy === 'harsh' ? 0.1 : 0.7)) {
      const os = T.outings(s).filter((o) => o.cost <= s.gold);
      if (os.length) await T.outing(U.pick(os).id, ctx());
    }
    const acts = planFor(s, policy);
    const forced = [false, false, false];
    const log = { months: [], diary: [], forced: false, listened: false, outing: null, wishMet: false };
    const pr = M.protest(s, acts);
    if (pr) {
      const r = await T.protest(ctx(log), pr);
      if (r === 'forced') { forced[pr.slot] = true; log.forced = true; }
      else if (r === 'swap') { acts[pr.slot] = 'free'; log.listened = true; }
    }
    if (s.wish && acts.includes(s.wish.id)) log.wishMet = true;
    for (let i = 0; i < 3; i++) {
      const res = Sim.doMonth(s, acts[i], { forced: forced[i], chosen: acts[i] === 'free' });
      if (res.act === 'journey') log.diary.push(await T.journey(ctx(log)));
      log.months.push(res);
    }
    const mids = Sim.pickEvents(s, 'mid', 2);
    let ran = 0;
    for (const e of mids) {
      if (ran === 0 && (e.priority || U.chance(0.85))) { await run(e, log); ran++; }
      else if (ran === 1 && e.priority && e.priority >= 20) { await run(e, log); ran++; }
    }
    Sim.endSeason(s, log);
    if (!log.diaryText || !log.diaryText.length) throw new Error('empty diary');
    if (sea === 'summer' && !Sim.isLastSeason(s)) { await T.birthday(ctx()); s.age++; }
    s.turn++;
    s._stressSum = (s._stressSum || 0) + s.stress;
    s._hot = (s._hot || 0) + (s.stress >= 70 ? 1 : 0);
    s._bondMin = Math.min(s._bondMin == null ? 100 : s._bondMin, s.bond);
    // sanity checks
    for (const k of D.STAT_IDS) if (!(s.stats[k] >= 0 && s.stats[k] <= 100)) throw new Error('stat out of range ' + k + '=' + s.stats[k]);
    if (!(s.bond >= 0 && s.bond <= 100)) throw new Error('bond ' + s.bond);
    if (Number.isNaN(s.stress) || Number.isNaN(s.gold)) throw new Error('NaN');
    if (s.gold < 0) throw new Error('negative gold ' + s.gold);
  }
  await T.finale(ctx());
  const star = !s.finale.stays;
  const career = star ? (s.finale.bridge ? E.STAR_BRIDGE : E.STAR) : E.career(s);
  const letter = E.letter(s, career, star);
  if (!letter.length) throw new Error('no letter');
  return { s, career };
}

const visitors = {};
(async () => {
  const counts = {};
  let errors = 0;
  const agg = { bond: 0, gold: 0, stress: 0, top: 0, events: 0, mem: 0, album: 0, avgStress: 0, hot: 0, minBond: 0 };
  for (let i = 0; i < N; i++) {
    try {
      const { s, career } = await game(POLICY);
      counts[career.id] = (counts[career.id] || 0) + 1;
      agg.bond += s.bond; agg.gold += s.gold; agg.stress += s.stress; agg.top += Math.max(...Object.values(s.stats)); agg.events += Object.keys(s.seen).length; agg.mem += s.memories.length; agg.album += s.album.length; agg.avgStress += s._stressSum / s.turns; agg.hot += s._hot; agg.minBond += s._bondMin;
    } catch (e) {
      errors++;
      if (errors <= 5) console.error('GAME ERROR:', e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : e);
    }
  }
  const ok = N - errors;
  console.log(`${N} games · length=${LEN} · policy=${POLICY} · errors=${errors}`);
  console.log('avg bond', (agg.bond / ok).toFixed(1), '· gold', (agg.gold / ok).toFixed(0), '· stress', (agg.stress / ok).toFixed(1), '· best stat', (agg.top / ok).toFixed(1), '· events seen', (agg.events / ok).toFixed(1), '· memories', (agg.mem / ok).toFixed(1), '· photos', (agg.album / ok).toFixed(1));
  console.log('avg stress over seasons', (agg.avgStress / ok).toFixed(1), '· seasons at 70+ stress', (agg.hot / ok).toFixed(1), '· lowest bond', (agg.minBond / ok).toFixed(1));
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(4), k));
  console.log('courtyard visitors:', Object.entries(visitors).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
  if (errors) process.exitCode = 1;
})();
