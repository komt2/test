/* Silver River — festival mini-games: lantern riddles, guqin recital, rival duel, dragon boat race.
   Each returns a promise of { win, score, skipped }. They draw into an overlay element. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const U = G.U;
  const MG = (G.Minigames = {});

  const RIDDLES = [
    { q: 'The more you take, the more you leave behind.', a: 'Footsteps', w: ['Coins', 'Rice'] },
    { q: 'It sleeps in winter, wears pink in spring, and falls like snow without being cold.', a: 'Peach blossoms', w: ['Plum wine', 'Lanterns'] },
    { q: 'Round as the moon, sweet as honey, shared when families gather in autumn.', a: 'A mooncake', w: ['A drum', 'A coin'] },
    { q: 'I have a waist but no legs, a mouth but no teeth, and immortals carry me on their belts.', a: 'A gourd', w: ['A kettle', 'A sword'] },
    { q: 'Black when you buy it, red when you use it, grey when you throw it away.', a: 'Charcoal', w: ['Ink', 'Tea'] },
    { q: 'I have teeth but never bite. I tame tangles every night.', a: 'A comb', w: ['A saw', 'A dragon'] },
    { q: 'Dressed in white, I wait for the brush. Write one wrong word and I will never forget.', a: 'Paper', w: ['Snow', 'Rice'] },
    { q: 'The more of me there is, the less you see.', a: 'Darkness', w: ['Fog', 'Silk'] },
    { q: 'What goes up when the rain comes down?', a: 'An umbrella', w: ['A kite', 'A bridge'] },
    { q: 'I fly without wings and cry without eyes. Wherever I go, darkness follows me.', a: 'A cloud', w: ['A crow', 'A lantern'] },
    { q: 'A bridge of birds, one night a year, lets two lovers meet. What night is it?', a: 'Qixi', w: ['New Year', 'Qingming'] },
    { q: 'Always in front of you, never where you can see it.', a: 'The future', w: ['Your nose', 'The wind'] },
    { q: 'I have a thousand needles but cannot sew.', a: 'A pine tree', w: ['A hedgehog', 'A tailor'] },
    { q: 'I speak every language but I have no mouth. You hear me only after you call.', a: 'An echo', w: ['A parrot', 'A bell'] },
  ];

  function frame(root, title, sub) {
    root.innerHTML = `<div class="mg"><div class="mg-head"><h3>${U.esc(title)}</h3><p>${U.esc(sub || '')}</p></div><div class="mg-body"></div><div class="mg-foot"><button class="btn btn-ghost mg-skip" type="button">Skip</button></div></div>`;
    root.hidden = false;
    return root.querySelector('.mg-body');
  }
  function done(root, res, resolve) {
    setTimeout(() => {
      root.hidden = true;
      root.innerHTML = '';
      resolve(res);
    }, res.skipped ? 0 : 900);
  }

  // ---------------------------------------------------------------- lantern riddles
  MG.riddles = function (root, opts = {}) {
    return new Promise((resolve) => {
      const body = frame(root, 'Lantern Riddles', 'Pick the answer. Three lanterns, three riddles.');
      const list = U.shuffle(RIDDLES).slice(0, opts.n || 3);
      let i = 0, score = 0;
      root.querySelector('.mg-skip').onclick = () => done(root, { skipped: true }, resolve);
      const show = () => {
        if (i >= list.length) {
          body.innerHTML = `<p class="mg-result">${score} of ${list.length} solved!</p>`;
          G.Audio && G.Audio.sfx(score >= 2 ? 'confirm' : 'tap');
          return done(root, { win: score >= 2, score }, resolve);
        }
        const r = list[i];
        const answers = U.shuffle([r.a].concat(r.w));
        body.innerHTML = `<div class="riddle"><div class="lantern-ico" aria-hidden="true"></div><p class="riddle-q">“${U.esc(r.q)}”</p><div class="riddle-a">${answers.map((a) => `<button class="btn" type="button" data-a="${U.esc(a)}">${U.esc(a)}</button>`).join('')}</div></div>`;
        body.querySelectorAll('[data-a]').forEach((b) =>
          b.addEventListener('click', () => {
            const ok = b.dataset.a === r.a;
            if (ok) score++;
            b.classList.add(ok ? 'right' : 'wrong');
            G.Audio && G.Audio.sfx(ok ? 'up' : 'down');
            body.querySelectorAll('[data-a]').forEach((x) => (x.disabled = true));
            if (!ok) body.querySelector(`[data-a="${CSS.escape(r.a)}"]`).classList.add('right');
            i++;
            setTimeout(show, 900);
          })
        );
      };
      show();
    });
  };

  // ---------------------------------------------------------------- guqin recital (memory)
  const NOTES = [
    { zh: '宮', en: 'gong', midi: 62 },
    { zh: '商', en: 'shang', midi: 64 },
    { zh: '角', en: 'jue', midi: 66 },
    { zh: '徵', en: 'zhi', midi: 69 },
    { zh: '羽', en: 'yu', midi: 71 },
  ];
  MG.recital = function (root, opts = {}) {
    return new Promise((resolve) => {
      const target = U.clamp(opts.level || 4, 3, 7);
      const body = frame(root, 'Guqin Recital', `Listen, then play the melody back. Reach ${target} notes to win.`);
      root.querySelector('.mg-skip').onclick = () => done(root, { skipped: true }, resolve);
      body.innerHTML = `<div class="qin"><p class="qin-msg">Listen...</p><div class="qin-strings">${NOTES.map((n, i) => `<button class="qin-str" type="button" data-i="${i}" aria-label="${n.en}"><span>${n.zh}</span><small>${n.en}</small></button>`).join('')}</div></div>`;
      const btns = [...body.querySelectorAll('.qin-str')];
      const msg = body.querySelector('.qin-msg');
      const seq = [U.randInt(0, 4), U.randInt(0, 4)];
      let pos = 0, listening = false;
      const play = (i) => {
        btns[i].classList.add('on');
        G.Audio && G.Audio.note && G.Audio.note(NOTES[i].midi);
        setTimeout(() => btns[i].classList.remove('on'), 320);
      };
      const round = () => {
        listening = false;
        msg.textContent = 'Listen...';
        seq.forEach((n, k) => setTimeout(() => play(n), 500 + k * 520));
        setTimeout(() => {
          listening = true;
          pos = 0;
          msg.textContent = `Your turn (${seq.length} notes)`;
        }, 500 + seq.length * 520);
      };
      btns.forEach((b) =>
        b.addEventListener('click', () => {
          if (!listening) return;
          const i = +b.dataset.i;
          play(i);
          if (i !== seq[pos]) {
            listening = false;
            msg.textContent = `A wrong note! You reached ${seq.length - 1}.`;
            return done(root, { win: seq.length - 1 >= target, score: seq.length - 1 }, resolve);
          }
          pos++;
          if (pos === seq.length) {
            listening = false;
            if (seq.length >= target) {
              msg.textContent = 'Beautiful! The audience is on its feet.';
              G.Audio && G.Audio.sfx('confirm');
              return done(root, { win: true, score: seq.length }, resolve);
            }
            seq.push(U.randInt(0, 4));
            msg.textContent = 'Lovely! One more note...';
            setTimeout(round, 700);
          }
        })
      );
      round();
    });
  };

  // ---------------------------------------------------------------- the duel (strike / guard / feint)
  MG.duel = function (root, opts = {}) {
    return new Promise((resolve) => {
      const skill = opts.skill || 40;
      const body = frame(root, 'The Duel', 'Strike beats Feint. Feint beats Guard. Guard beats Strike. Best of three.');
      root.querySelector('.mg-skip').onclick = () => done(root, { skipped: true }, resolve);
      const MOVES = ['Strike', 'Guard', 'Feint'];
      const beats = { Strike: 'Feint', Feint: 'Guard', Guard: 'Strike' };
      const tells = { Strike: 'shifts her weight onto her front foot', Guard: 'draws her sword close to her body', Feint: 'glances at your left shoulder' };
      let me = 0, her = 0, round = 1;
      const draw = () => {
        const next = U.pick(MOVES);
        const honest = U.rand() < U.clamp(0.45 + skill / 180, 0.45, 0.9);
        const shown = honest ? next : U.pick(MOVES.filter((m) => m !== next));
        body.innerHTML = `<div class="duel"><p class="duel-score">Round ${round} · You ${me} – ${her} Wanyin</p><p class="duel-tell">Wanyin ${tells[shown]}...</p><div class="duel-moves">${MOVES.map((m) => `<button class="btn" type="button" data-m="${m}">${m}</button>`).join('')}</div><p class="duel-out" aria-live="polite"></p></div>`;
        body.querySelectorAll('[data-m]').forEach((b) =>
          b.addEventListener('click', () => {
            const mine = b.dataset.m;
            body.querySelectorAll('[data-m]').forEach((x) => (x.disabled = true));
            let out;
            if (mine === next) out = 'You both ' + mine.toLowerCase() + '. A draw!';
            else if (beats[mine] === next) { me++; out = 'Your ' + mine.toLowerCase() + ' beats her ' + next.toLowerCase() + '!'; G.Audio && G.Audio.sfx('up'); }
            else { her++; out = 'Her ' + next.toLowerCase() + ' beats your ' + mine.toLowerCase() + '.'; G.Audio && G.Audio.sfx('down'); }
            body.querySelector('.duel-out').textContent = out;
            round++;
            setTimeout(() => {
              if (me >= 2 || her >= 2 || round > 5) {
                body.innerHTML = `<p class="mg-result">${me > her ? 'Victory!' : me === her ? 'A draw. The judges favour Wanyin.' : 'Defeat.'}</p>`;
                return done(root, { win: me > her, score: me }, resolve);
              }
              draw();
            }, 1000);
          })
        );
      };
      draw();
    });
  };

  // ---------------------------------------------------------------- dragon boat (timing)
  MG.boat = function (root, opts = {}) {
    return new Promise((resolve) => {
      const zone = U.clamp(0.14 + (opts.vigor || 30) / 500, 0.14, 0.3);
      const body = frame(root, 'Dragon Boat Race', 'Tap "Row!" when the drum marker is in the gold zone. Ten strokes.');
      root.querySelector('.mg-skip').onclick = () => {
        stop = true;
        done(root, { skipped: true }, resolve);
      };
      body.innerHTML = `<div class="boat"><div class="boat-track"><div class="boat-zone" style="left:${50 - zone * 50}%;width:${zone * 100}%"></div><div class="boat-mark"></div></div><p class="boat-count">Strokes: 0 / 10 · Good: 0</p><button class="btn btn-big boat-row" type="button">Row!</button></div>`;
      const mark = body.querySelector('.boat-mark');
      const count = body.querySelector('.boat-count');
      let t = 0, strokes = 0, good = 0, stop = false, last = performance.now();
      const speed = 1.1;
      const tick = (now) => {
        if (stop) return;
        t += ((now - last) / 1000) * speed;
        last = now;
        const u = (Math.sin(t * Math.PI) + 1) / 2;
        mark.style.left = u * 100 + '%';
        mark.dataset.u = u;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      body.querySelector('.boat-row').addEventListener('click', () => {
        if (stop) return;
        const u = +mark.dataset.u;
        const hit = Math.abs(u - 0.5) <= zone / 2;
        strokes++;
        if (hit) good++;
        G.Audio && G.Audio.sfx(hit ? 'tap' : 'down');
        mark.classList.toggle('hit', hit);
        count.textContent = `Strokes: ${strokes} / 10 · Good: ${good}`;
        if (strokes >= 10) {
          stop = true;
          const win = good >= 6;
          body.innerHTML = `<p class="mg-result">${good} good strokes! ${win ? 'First across the line!' : 'A splashing, glorious fourth place.'}</p>`;
          done(root, { win, score: good }, resolve);
        }
      });
    });
  };
})();
