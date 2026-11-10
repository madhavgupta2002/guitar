// Lesson 4: Rhythm & Strumming. Beat, tempo, bar, taal analogy, metronome tap-along, down/up strums, patterns.
(() => {
  const COUNT8 = ['1', '&', '2', '&', '3', '&', '4', '&'];
  // Up strums mostly hit the thin strings on a real guitar, so we play only the top four.
  const EM_UP = [-1, -1, 2, 0, 0, 0];

  const now = () => performance.now();
  const blurFocus = () => { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); };

  // Slider row: returns {input, value()}; blurs after use so keys keep working.
  function bpmSlider(host, initial, onChange) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label>Tempo: <b class="bpmv">${initial}</b> BPM
      <input type="range" min="50" max="140" step="1" value="${initial}" style="vertical-align:middle;width:220px"></label>`;
    host.appendChild(wrap);
    const input = wrap.querySelector('input'), lab = wrap.querySelector('.bpmv');
    input.addEventListener('input', () => { lab.textContent = input.value; onChange(+input.value); });
    input.addEventListener('change', () => input.blur());
    input.addEventListener('pointerup', () => input.blur());
    return { input, value: () => +input.value };
  }

  function dots(host, n, labels) {
    const d = document.createElement('div'); d.className = 'beats';
    d.innerHTML = Array.from({ length: n }, (_, i) => `<i>${labels ? labels[i] : i + 1}</i>`).join('');
    host.appendChild(d);
    return [...d.children];
  }

  function flash(el, color) {
    el.style.boxShadow = `0 0 0 4px ${color}`;
    setTimeout(() => { el.style.boxShadow = ''; }, 220);
  }

  // Reusable "strum along with a pattern" trainer. getPattern() returns 8 slots of 'D' | 'U' | ''.
  function patternTrainer(ctx, host, getPattern, { bpm = 60, onSlots = null, canComplete = () => true } = {}) {
    const CH = ctx.CHORDS.Em;
    const ui = document.createElement('div'); host.appendChild(ui);
    const arrowWrap = document.createElement('div'); ui.appendChild(arrowWrap);
    const arrowEls = dots(arrowWrap, 8, getPattern().map(sym));
    const countEls = dots(arrowWrap, 8, COUNT8);
    countEls.forEach(c => { c.style.background = 'transparent'; c.style.color = '#aaa'; c.style.height = '20px'; });
    countEls[0].parentElement.style.marginTop = '-6px';
    if (onSlots) onSlots(arrowEls);

    const ctrl = document.createElement('div'); ui.appendChild(ctrl);
    const slider = bpmSlider(ctrl, bpm, v => met.setBpm(v * 2));
    const go = document.createElement('button'); go.className = 'btn'; go.textContent = '▶ Start';
    const bD = document.createElement('button'); bD.className = 'pill'; bD.textContent = '↓ Down (ArrowDown)';
    const bU = document.createElement('button'); bU.className = 'pill'; bU.textContent = '↑ Up (ArrowUp)';
    const score = document.createElement('div'); score.style.margin = '8px 0'; score.style.fontWeight = '600';
    ctrl.append(go, ' ', bD, bU, score);

    const fbHost = document.createElement('div'); ui.appendChild(fbHost);
    const fb = ctx.mountFretboard(fbHost, { frets: 5, labels: 'none' });
    fb.showChord(CH);

    let lastTick = null, lastTime = 0, hits = 0, expected = 0, recent = [];
    const slots = {};            // totalTick -> {dir, hit, judged}
    const slotMs = () => 60000 / (slider.value() * 2);
    const win = () => Math.min(150, slotMs() * 0.45);
    const slotFor = t => { if (!slots[t]) slots[t] = { dir: getPattern()[t % 8], hit: false, judged: false }; return slots[t]; };

    const report = () => {
      const r = recent.slice(-12), rate = r.length ? r.filter(Boolean).length / r.length : 0;
      score.textContent = expected ? `Hits: ${hits} / ${expected} strums · recent accuracy ${Math.round(rate * 100)}%` : '';
      return { rate, n: r.length };
    };
    const judge = t => {
      const s = slots[t]; if (!s || s.judged) return;
      s.judged = true;
      if (!s.dir) return;
      expected++; recent.push(s.hit);
      if (!s.hit) flash(arrowEls[t % 8], '#e05555');
      const { rate, n } = report();
      if (!ctx.isComplete && n >= 8 && rate >= 0.6 && canComplete()) {
        ctx.complete(); ctx.status('Nice groove! 60%+ of your strums landed on time. Press Next when ready, or keep jamming.');
      }
    };

    const met = ctx.metronome(slider.value() * 2, (slot, total) => {
      lastTick = total; lastTime = now();
      arrowEls.forEach((e, i) => e.classList.toggle('on', i === slot));
      countEls.forEach((e, i) => { e.style.color = i === slot ? '#ffd54a' : '#aaa'; });
      slotFor(total);
      // Judge slots whose timing window has fully passed.
      setTimeout(() => judge(total), win() + 10);
    }, 8);

    go.onclick = () => {
      blurFocus();
      if (met.running) { met.stop(); go.textContent = '▶ Start'; arrowEls.forEach(e => e.classList.remove('on')); return; }
      Object.keys(slots).forEach(k => delete slots[k]); lastTick = null; recent = [];
      arrowEls.forEach((e, i) => { e.textContent = sym(getPattern()[i]); });
      met.start(); go.textContent = '■ Stop';
      ctx.status('Counting 1 & 2 & 3 & 4 &… strum when the gold circle reaches an arrow.');
    };

    function strum(down) {
      fb.strumChord(down ? CH : EM_UP, down);
      if (!met.running || lastTick === null) return;
      const t = now(), dir = down ? 'D' : 'U';
      const cands = [[lastTick, t - lastTime], [lastTick + 1, t - (lastTime + slotMs())]];
      const best = cands.filter(([k]) => { const s = slotFor(k); return s.dir && !s.hit && !s.judged; })
        .sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0];
      if (!best || Math.abs(best[1]) > win()) { score.textContent = 'Extra strum: there is a rest there. Let your hand swing without touching the strings.'; return; }
      const s = slotFor(best[0]), el = arrowEls[best[0] % 8];
      if (s.dir !== dir) { flash(el, '#e0a030'); score.textContent = `Right time, wrong direction: that one is ${s.dir === 'D' ? 'down ↓' : 'up ↑'}.`; return; }
      s.hit = true; hits++; flash(el, '#55c060');
      const ms = Math.round(best[1]);
      score.textContent = Math.abs(ms) < 35 ? 'On time!' : ms < 0 ? `A little early (${-ms} ms)` : `A little late (${ms} ms)`;
    }
    bD.onclick = () => { blurFocus(); strum(true); };
    bU.onclick = () => { blurFocus(); strum(false); };
    ctx.keys(e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); strum(true); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); strum(false); }
    });
    return { arrowEls, refresh: () => arrowEls.forEach((e, i) => { e.textContent = sym(getPattern()[i]); }) };
  }

  const sym = d => (d === 'D' ? '↓' : d === 'U' ? '↑' : '·');

  Lessons.register({
    id: 'rhythm-strumming', order: 4, title: 'Rhythm & Strumming', minutes: 8,
    steps: [
      {
        title: 'Beat, tempo and bar',
        html: `<p>Music has a steady pulse, like a heartbeat. Each pulse is called a <b>beat</b>. When you tap your foot to a song, you are tapping the beat.</p>
          <p><b>Tempo</b> is how fast the beats go. We measure it in <b>BPM</b> (beats per minute). 60 BPM = one beat every second. 120 BPM = two beats every second.</p>
          <p>Beats come in groups. One group is called a <b>bar</b> (or measure). Most songs use bars of <b>4 beats</b>: count <b>1 2 3 4, 1 2 3 4</b>. Beat 1 is the strongest.</p>
          <div class="tip"><b>If you know taal:</b> a bar is like one cycle (avartan) of a taal, and beat 1 is like <b>sam</b>.
          Keherwa has 8 matras, so it fits in two bars of 4. Teen taal has 16 matras in 4 vibhags of 4, so it is like four bars of 4.
          Just an analogy: Western bars don't have taali/khali, but the idea of counting a repeating cycle is the same.</div>`,
      },
      {
        title: 'Tap along with the metronome',
        html: `<p>A <b>metronome</b> is a clicker that plays a perfectly steady beat. The higher click is beat 1.</p>
          <div class="task">Press Start. Then tap the <b>Spacebar</b> (or the Tap button) exactly on each click. Land 8 taps on time to continue.</div>
          <div id="m"></div>`,
        mount(ctx) {
          const host = ctx.$('#m');
          const d = dots(host, 4);
          const slider = bpmSlider(host, 70, v => met.setBpm(v));
          const go = document.createElement('button'); go.className = 'btn'; go.textContent = '▶ Start';
          const tap = document.createElement('button'); tap.className = 'pill'; tap.textContent = 'Tap (Space)';
          const info = document.createElement('div'); info.style.margin = '8px 0'; info.style.fontWeight = '600';
          host.append(go, ' ', tap, info);
          let lastTime = null, good = 0;
          const usedBeats = new Set();
          let lastTotal = 0;
          const met = ctx.metronome(slider.value(), (b, total) => {
            lastTime = now(); lastTotal = total;
            d.forEach((e, i) => e.classList.toggle('on', i === b));
          });
          go.onclick = () => {
            blurFocus();
            if (met.running) { met.stop(); go.textContent = '▶ Start'; d.forEach(e => e.classList.remove('on')); lastTime = null; return; }
            met.start(); go.textContent = '■ Stop';
          };
          const onTap = () => {
            if (!met.running || lastTime === null) { info.textContent = 'Press Start first.'; return; }
            const iv = 60000 / slider.value(), t = now();
            const late = t - lastTime, early = t - (lastTime + iv);
            const [dt, beatId] = Math.abs(late) <= Math.abs(early) ? [late, lastTotal] : [early, lastTotal + 1];
            const ms = Math.round(dt);
            if (Math.abs(ms) <= 150 && !usedBeats.has(beatId)) {
              usedBeats.add(beatId); good++;
              info.textContent = (Math.abs(ms) < 35 ? '🎯 On the beat!' : ms < 0 ? `Early by ${-ms} ms` : `Late by ${ms} ms`) + ` · ${good}/8 good taps`;
            } else {
              info.textContent = (ms < 0 ? `Too early (${-ms} ms)` : `Too late (${ms} ms)`) + ' · listen and try again';
            }
            if (good >= 8 && !ctx.isComplete) { ctx.complete(); ctx.status('Great timing! Try a faster tempo for fun, then press Next.'); }
          };
          tap.onclick = () => { blurFocus(); onTap(); };
          ctx.keys(e => { if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); onTap(); } });
        },
      },
      {
        title: 'Down strums and up strums',
        html: `<p>To <b>strum</b> means to brush across all the strings at once with your picking hand (right hand for most people).</p>
          <p><b>Down strum ↓</b>: move from the thickest string (low E) toward the thinnest (high e). It sounds full and strong.</p>
          <p><b>Up strum ↑</b>: come back up from the thin strings. You usually hit only the top 3-4 strings, so it sounds lighter.</p>
          <div class="tip"><b>How to move:</b> keep your wrist loose, like you are <b>shaking water off your hand</b>. The motion comes mostly from the wrist, not the whole arm. Hold the pick gently: firm enough not to drop it, loose enough to let it flex.</div>
          <p>Why care? A stiff arm gets tired fast and sounds harsh. A loose wrist sounds smooth and can go fast.</p>`,
      },
      {
        title: 'Try it: strum an Em chord',
        html: `<p>Here is the <b>Em</b> (E minor) chord. ○ = open string, ● = press here. Don't worry about fingers yet, we just want the sound.</p>
          <div class="task">Press <b>ArrowDown</b> for a down strum and <b>ArrowUp</b> for an up strum (or use the buttons). Do 4 of each.</div>
          <div id="s"></div>`,
        mount(ctx) {
          const host = ctx.$('#s');
          const bD = document.createElement('button'); bD.className = 'pill'; bD.textContent = '↓ Down';
          const bU = document.createElement('button'); bU.className = 'pill'; bU.textContent = '↑ Up';
          host.append(bD, bU);
          const fb = ctx.mountFretboard(host, { frets: 5, labels: 'none' });
          fb.showChord(ctx.CHORDS.Em);
          let nd = 0, nu = 0;
          const strum = down => {
            fb.strumChord(down ? ctx.CHORDS.Em : EM_UP, down);
            down ? nd++ : nu++;
            ctx.status(`Down: ${Math.min(nd, 4)}/4 · Up: ${Math.min(nu, 4)}/4` + (nd >= 4 && nu >= 4 ? ' · Hear how the up strum is lighter? Press Next.' : ''));
            if (nd >= 4 && nu >= 4) ctx.complete();
          };
          bD.onclick = () => { blurFocus(); strum(true); };
          bU.onclick = () => { blurFocus(); strum(false); };
          ctx.keys(e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); strum(true); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); strum(false); }
          });
        },
      },
      {
        title: 'Reading rhythm: 1 & 2 & 3 & 4 &',
        html: `<p>To strum faster than the beat, we split each beat in two. Count <b>"1 & 2 & 3 & 4 &"</b> (say "one and two and…"). The numbers are the beats. The <b>&</b> ("and") sits halfway between them. These half-beats are called <b>eighth notes</b>.</p>
          <p>We write a strum pattern with arrows under the counting:</p>
          <pre style="font-size:18px;line-height:1.5">count:  1  &  2  &  3  &  4  &
strum:  ↓  ·  ↓  ↑  ·  ↑  ↓  ↑</pre>
          <p>↓ = <b>D</b> (down), ↑ = <b>U</b> (up), · = rest (no strum).</p>
          <div class="tip"><b>The golden rule:</b> your hand keeps swinging down on the numbers and up on the "&", like a pendulum, even when you skip a strum. On a rest, just miss the strings. This keeps your timing steady.</div>
          <p>In the next steps the metronome clicks on every number <i>and</i> every "&", so it ticks twice per beat.</p>`,
      },
      {
        title: 'Pattern 1: down on every beat',
        html: `<p>The simplest pattern: <b>D · D · D · D ·</b>. Strum down on 1, 2, 3, 4. On each "&" your hand comes back up without touching the strings.</p>
          <div class="task">Press Start and strum <b>ArrowDown</b> on each arrow. Get 60% of strums on time to continue. Start slow (60 BPM is fine).</div>
          <div id="p"></div>`,
        mount(ctx) { patternTrainer(ctx, ctx.$('#p'), () => ['D', '', 'D', '', 'D', '', 'D', ''], { bpm: 60 }); },
      },
      {
        title: 'Pattern 2: the folk strum',
        html: `<p>This is one of the most used patterns in pop, folk and Bollywood songs: <b>D · D U · U D U</b>. Many people say it as "down, down-up, up-down-up".</p>
          <p>Count it: <b>1</b> (D), &amp; (rest), <b>2</b> (D), &amp; (U), <b>3</b> (rest), &amp; (U), <b>4</b> (D), &amp; (U).</p>
          <div class="tip">The tricky part is beat 3: your hand goes down but misses the strings, then catches the up strum. Keep the pendulum going!</div>
          <div class="task">Strum along with ArrowDown / ArrowUp. Reach 60% to continue. Try 55-65 BPM first.</div>
          <div id="p"></div>`,
        mount(ctx) { patternTrainer(ctx, ctx.$('#p'), () => ['D', '', 'D', 'U', '', 'U', 'D', 'U'], { bpm: 55 }); },
      },
      {
        title: 'Pattern 3: make your own',
        html: `<p>Now you are the composer. Click the circles on the top row to change each slot: · → ↓ → ↑ → ·.</p>
          <div class="tip">Following the golden rule, downs feel natural on the numbers and ups on the "&". But you can try anything!</div>
          <div class="task">Make a pattern with at least 3 strums, press Start, and strum along. Reach 60% to finish this step.</div>
          <div id="p"></div>`,
        mount(ctx) {
          const pat = ['D', '', 'D', 'U', 'D', '', 'D', 'U'];
          const trainer = patternTrainer(ctx, ctx.$('#p'), () => pat, {
            bpm: 60,
            canComplete: () => pat.filter(Boolean).length >= 3,
            onSlots: els => els.forEach((el, i) => {
              el.style.cursor = 'pointer'; el.title = 'Click to change';
              el.onclick = () => {
                pat[i] = pat[i] === '' ? 'D' : pat[i] === 'D' ? 'U' : '';
                el.textContent = sym(pat[i]);
                const n = pat.filter(Boolean).length;
                ctx.status(n < 3 ? 'Add at least 3 strums.' : `Your pattern: ${pat.map(p => p || '·').join(' ')} (changes apply from the next bar).`);
              };
            }),
          });
          trainer.refresh();
        },
      },
      {
        title: 'Quick quiz',
        html: `<p>Let's check what you learned.</p><div id="q"></div>`,
        mount(ctx) {
          ctx.quiz(ctx.$('#q'), [
            { q: 'At 60 BPM, how often does a beat happen?', options: ['Twice a second', 'Once a second', 'Once a minute'], answer: 1,
              explain: 'BPM = beats per minute. 60 beats in 60 seconds = one per second.' },
            { q: 'In "1 & 2 & 3 & 4 &", where do up strums usually go?', options: ['On the numbers', 'On the "&"', 'Only on beat 1'], answer: 1,
              explain: 'Down on the numbers, up on the "&", like a pendulum.' },
            { q: 'How should your strumming wrist feel?', options: ['Stiff and locked', 'Loose, like shaking water off your hand', 'Still, move only the fingers'], answer: 1,
              explain: 'A loose wrist sounds smoother and does not get tired.' },
            { q: 'What do you do on a rest (·) in a strum pattern?', options: ['Stop your hand completely', 'Keep swinging but miss the strings', 'Strum extra hard'], answer: 1,
              explain: 'Keeping the hand moving keeps your timing steady.' },
            { q: 'Teen taal has 16 matras. In 4-beat bars, that is like…', options: ['One bar', 'Two bars', 'Four bars'], answer: 2,
              explain: '16 ÷ 4 = 4. Teen taal\'s 4 vibhags of 4 matras are like four bars of 4 beats.' },
          ]);
        },
      },
    ],
  });
})();
