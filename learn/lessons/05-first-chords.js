// Lesson 5: Your First Chords (Em, Am, C, G, D), major vs minor, changing chords, sargam link.
(() => {
  // Finger numbers per string, low E -> high e (0 = open or muted, no finger).
  const FINGERS = {
    Em: [0, 2, 3, 0, 0, 0],
    Am: [0, 0, 2, 3, 1, 0],
    C:  [0, 3, 2, 0, 1, 0],
    G:  [2, 1, 0, 0, 0, 3],
    D:  [0, 0, 0, 1, 3, 2],
  };
  const STR = ['low E (6th)', 'A (5th)', 'D (4th)', 'G (3rd)', 'B (2nd)', 'high e (1st)']; // index = chord array index
  const FNAME = { 1: 'index', 2: 'middle', 3: 'ring', 4: 'little' };

  // Helper: draw a chord shape and highlight its pressed cells in green.
  function drawChord(fb, chord) {
    fb.clearHighlights();
    fb.showChord(chord);
    chord.forEach((f, i) => { if (f > 0) fb.highlight(5 - i, f, 'green'); });
  }

  // Builds one interactive "learn this chord" step.
  function chordStep(name, title, intro, tips) {
    return {
      title,
      html: `${intro}
        <div class="fbwrap"></div>
        <p>
          <button class="btn" data-a="strum">▶ Strum ${name}</button>
          <button class="pill" data-a="reveal">Finger-by-finger</button>
          <button class="pill" data-a="slow">Pick strings one at a time</button>
        </p>
        <div class="fingerinfo"></div>
        <div class="tip"><b>Common mistakes:</b><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>
        <div class="task">Shape the chord on your guitar, strum it, and listen. Each string should ring clearly.
          Press <b>Strum</b> here at least once to compare your sound, then tick the box.</div>
        <p><button class="btn" data-a="ican" disabled>✓ I can play ${name}</button></p>`,
      mount(ctx) {
        const chord = ctx.CHORDS[name], fing = FINGERS[name];
        const fb = ctx.mountFretboard(ctx.$('.fbwrap'), { frets: 5 });
        drawChord(fb, chord);
        const info = ctx.$('.fingerinfo'), ican = ctx.$('[data-a="ican"]');
        const order = [];                               // chord-array indices of fretted strings, by finger number
        fing.forEach((n, i) => { if (n) order.push(i); });
        order.sort((a, b) => fing[a] - fing[b]);
        let revealed = 0;

        ctx.$('[data-a="strum"]').onclick = () => {
          fb.strumChord(chord);
          ican.disabled = false;
          ctx.status(`That's ${name}. Does yours sound the same? If a string buzzes or goes "thud", check the tips below.`);
        };
        ctx.$('[data-a="slow"]').onclick = () => {
          let t = 0;
          chord.forEach((f, i) => { if (f >= 0) { fb.pluck(5 - i, f, t); t += 0.45; } });
          ctx.status('Pluck each string on your guitar the same way. Find any string that sounds dead and fix that finger.');
        };
        ctx.$('[data-a="reveal"]').onclick = () => {
          if (revealed === 0) {                            // start fresh: keep only the ○ / ✕ marks
            fb.clearHighlights(); fb.clearMarks();
            chord.forEach((f, i) => { if (f <= 0) fb.mark(5 - i, 0, f < 0 ? '✕' : '○'); });
          }
          if (revealed >= order.length) {                // finished: show the whole chord again
            drawChord(fb, chord); revealed = 0;
            info.innerHTML = `<p>All ${order.length} fingers down. Now strum the whole chord!</p>`;
            fb.strumChord(chord);
            return;
          }
          const i = order[revealed], s = 5 - i, f = chord[i], n = fing[i];
          fb.highlight(s, f, 'green'); fb.mark(s, f, String(n)); fb.pluck(s, f);
          revealed++;
          info.innerHTML = `<p>Finger <b>${n}</b> (${FNAME[n]}) goes on the <b>${STR[i]}</b> string, fret <b>${f}</b>.
            ${revealed < order.length ? 'Click again for the next finger.' : 'Click once more to strum the full chord.'}</p>`;
        };
        ican.onclick = () => { ctx.complete(); ctx.status(`Great! ${name} is now in your pocket. 🎉 Press Next.`); };
      },
    };
  }

  const COMMON_TIPS = [
    '<b>Buzzing:</b> press just behind the fret wire (not on top of it, not in the middle of the box).',
    '<b>Muffled strings:</b> keep your fingertips <b>arched</b> like a tent so they don\'t touch the strings next door.',
    'Use the very <b>tip</b> of each finger, and keep your thumb relaxed behind the neck.',
  ];

  Lessons.register({
    id: 'first-chords', order: 5, title: 'Your First Chords', minutes: 9,
    steps: [
      // 1 ---------------------------------------------------------------
      {
        title: 'What is a chord?',
        required: false,
        html: `<p>So far you have played one note at a time. One note after another is called a <b>melody</b>.
          A song's tune, the part you sing, is the melody.</p>
          <p>A <b>chord</b> is <b>three or more notes played together</b>. Notes sounding together make <b>harmony</b>.
          Harmony is the backdrop that supports the melody.</p>
          <div class="tip">🪕 <b>Think of the tanpura.</b> Its drone of Sa and Pa sits behind the singer the whole time.
          A chord is similar: several swaras sounding together behind the tune. The difference is that guitar chords
          <b>change</b> as the song moves, so the backdrop changes colour too.</div>
          <p>Listen. First Sa, Ga, Pa one by one (melody), then all three together (harmony, a chord):</p>
          <p><button class="pill" data-a="mel">▶ Sa, Ga, Pa one by one</button>
             <button class="pill" data-a="har">▶ Sa + Ga + Pa together</button></p>`,
        mount(ctx) {
          ctx.setSa(0);
          const E = ctx.engine;
          ctx.$('[data-a="mel"]').onclick = () => { [60, 64, 67].forEach((m, i) => E.playMidi(m, i * 0.5)); ctx.status('Melody: one swara at a time.'); };
          ctx.$('[data-a="har"]').onclick = () => { [48, 60, 64, 67].forEach(m => E.playMidi(m, 0)); ctx.status('Harmony: Sa, Ga and Pa together. That is the C major chord!'); };
        },
      },
      // 2 ---------------------------------------------------------------
      {
        title: 'How to read a chord diagram',
        html: `<p>A <b>chord diagram</b> is a map that shows where your fingers go. Here is the <b>C</b> chord on our fretboard:</p>
          <div class="fbwrap"></div>
          <ul>
            <li>The <b>lines</b> are the strings. The top line is the thin <b>high e</b>, the bottom line is the thick <b>low E</b>
              (like looking down at the guitar on your lap).</li>
            <li>The <b>boxes</b> between the metal fret wires are the <b>frets</b>, numbered from the nut on the left: 1, 2, 3…</li>
            <li><b>●</b> = press here with a finger. <b>○</b> = play this string <b>open</b> (no finger). <b>✕</b> = <b>muted</b>, don't play this string.</li>
          </ul>
          <p><b>Finger numbers</b> on your fretting hand (the hand on the neck):
            <b>1</b> = index, <b>2</b> = middle, <b>3</b> = ring, <b>4</b> = little finger. The thumb is not numbered; it rests behind the neck.</p>
          <p><button class="pill" data-a="fing">Show finger numbers</button> <button class="pill" data-a="strum">▶ Strum C</button></p>
          <div class="qz"></div>`,
        mount(ctx) {
          const C = ctx.CHORDS.C, fb = ctx.mountFretboard(ctx.$('.fbwrap'), { frets: 5 });
          drawChord(fb, C);
          ctx.$('[data-a="fing"]').onclick = () => {
            drawChord(fb, C);
            C.forEach((f, i) => { if (f > 0) fb.mark(5 - i, f, String(FINGERS.C[i])); });
            ctx.status('Ring finger (3) on A, middle (2) on D, index (1) on B.');
          };
          ctx.$('[data-a="strum"]').onclick = () => fb.strumChord(C);
          ctx.quiz(ctx.$('.qz'), [
            { q: 'In this C diagram, the low E string has a ✕. What does that mean?',
              options: ['Press it at fret 1', 'Play it open', 'Don\'t play it (muted)'], answer: 2,
              explain: 'Right! ✕ means skip that string. Start your strum from the A string.' },
            { q: 'Which finger is number 3?', options: ['Index', 'Middle', 'Ring', 'Little'], answer: 2,
              explain: 'Yes: 1 index, 2 middle, 3 ring, 4 little.' },
          ]);
        },
      },
      // 3-7: the five chords -------------------------------------------
      chordStep('Em', 'Chord 1: E minor (Em), the easiest',
        `<p><b>Em</b> (say "E minor") needs only <b>two fingers</b>, and you strum <b>all six strings</b>. Perfect first chord.</p>
         <p>Middle finger (2) on the <b>A</b> string, fret 2. Ring finger (3) on the <b>D</b> string, fret 2. Everything else open.</p>`,
        [...COMMON_TIPS, 'Keep the two fingers side by side; they share fret 2.']),
      chordStep('Am', 'Chord 2: A minor (Am)',
        `<p><b>Am</b> uses three fingers. Notice it has the <b>same shape as Em</b>, just moved down one string, plus your index finger.</p>
         <p>Index (1) on <b>B</b> fret 1, middle (2) on <b>D</b> fret 2, ring (3) on <b>G</b> fret 2. Don't strum the low E (✕).</p>`,
        [...COMMON_TIPS, 'Start the strum from the A string. Hitting the low E makes Am sound muddy.']),
      chordStep('C', 'Chord 3: C major (C)',
        `<p><b>C</b> is the chord made of <b>Sa Ga Pa</b> when Sa = C. It feels like a stretch at first. That is normal.</p>
         <p>Ring (3) on <b>A</b> fret 3, middle (2) on <b>D</b> fret 2, index (1) on <b>B</b> fret 1. Skip the low E (✕).</p>
         <div class="tip">From Am to C, only your ring finger moves (G string → A string). Index and middle stay put!</div>`,
        [...COMMON_TIPS, 'The open G and high e are often muffled in C. Arch your fingers more so they don\'t lean on them.']),
      chordStep('G', 'Chord 4: G major (G)',
        `<p><b>G</b> is big and bright, with all six strings ringing.</p>
         <p>Middle (2) on <b>low E</b> fret 3, index (1) on <b>A</b> fret 2, ring (3) on <b>high e</b> fret 3.</p>`,
        [...COMMON_TIPS, 'Your middle finger on the low E must not touch the A string. Come at it from above, with a bent knuckle.']),
      chordStep('D', 'Chord 5: D major (D)',
        `<p><b>D</b> is a small triangle shape on the top three strings. Strum only the <b>top four</b> strings (D, G, B, e).</p>
         <p>Index (1) on <b>G</b> fret 2, ring (3) on <b>B</b> fret 3, middle (2) on <b>high e</b> fret 2.</p>`,
        [...COMMON_TIPS, 'Don\'t hit the low E and A strings (✕). Aim your strum at the D string.']),
      // 8 ---------------------------------------------------------------
      {
        title: 'Major vs minor: bright or sad?',
        html: `<p>Chords have a <b>mood</b>. <b>Major</b> chords (C, G, D) sound <b>bright and happy</b>.
          <b>Minor</b> chords (Em, Am, written with a small "m") sound <b>sad, soft or serious</b>.</p>
          <p>Why? It depends on the middle note. In C major the middle note is shuddh <b>Ga</b>.
          In a minor chord that middle note is a semitone lower, like <b>komal ga</b>. One small step changes the whole feeling,
          just like Bhairavi feels different from Bilawal.</p>
          <p>Listen first: <button class="pill" data-p="C">▶ C (major)</button><button class="pill" data-p="Am">▶ Am (minor)</button>
            <button class="pill" data-p="G">▶ G (major)</button><button class="pill" data-p="Em">▶ Em (minor)</button></p>
          <div class="task"><b>Ear game:</b> I'll strum a chord. Is it major (bright) or minor (sad)? Get <b>4 out of 5</b>.</div>
          <p><button class="btn" data-a="play">▶ Play a mystery chord</button>
             <button class="pill" data-g="major" disabled>☀️ Major</button><button class="pill" data-g="minor" disabled>🌧️ Minor</button></p>
          <p class="score"></p>
          <div class="fbwrap"></div>`,
        mount(ctx) {
          const CH = ctx.CHORDS, fb = ctx.mountFretboard(ctx.$('.fbwrap'), { frets: 5 });
          const pool = [['C', 'major'], ['G', 'major'], ['D', 'major'], ['Em', 'minor'], ['Am', 'minor']];
          const score = ctx.$('.score'), playBtn = ctx.$('[data-a="play"]'), guess = ctx.$$('[data-g]');
          let cur = null, round = 0, right = 0, last = null;
          const show = () => { score.textContent = `Round ${Math.min(round + 1, 5)} of 5 · correct: ${right}`; };
          ctx.$$('[data-p]').forEach(b => b.onclick = () => { const n = b.dataset.p; drawChord(fb, CH[n]); fb.strumChord(CH[n]); });
          playBtn.onclick = () => {
            if (round >= 5) { round = 0; right = 0; }
            if (!cur) {
              do { cur = pool[Math.floor(Math.random() * pool.length)]; } while (last && cur[0] === last[0]);
              fb.clearMarks(); fb.clearHighlights();
            }
            fb.strumChord(CH[cur[0]]);
            guess.forEach(g => (g.disabled = false));
            playBtn.textContent = '↻ Hear it again';
            show();
          };
          guess.forEach(g => g.onclick = () => {
            if (!cur) return;
            const ok = g.dataset.g === cur[1];
            if (ok) right++;
            drawChord(fb, CH[cur[0]]);
            ctx.status(ok ? `✓ Yes! That was ${cur[0]}, a ${cur[1]} chord.` : `Not quite. That was ${cur[0]}, a ${cur[1]} chord. Listen to how it feels.`);
            last = cur; cur = null; round++;
            guess.forEach(x => (x.disabled = true));
            playBtn.textContent = '▶ Play a mystery chord';
            if (round >= 5) {
              if (right >= 4) { ctx.complete(); score.textContent = `🎉 ${right} / 5. Your ears can hear major and minor!`; }
              else { score.textContent = `${right} / 5. Listen to the four examples again, then press Play to try a new round.`; }
            } else show();
          });
          show();
        },
      },
      // 9 ---------------------------------------------------------------
      {
        title: 'Changing chords in time',
        html: `<p>Songs move from chord to chord, so the real skill is <b>changing</b> smoothly. Let's practise
          <b>Em → Am → C → G</b> (and round again) with a slow click at <b>60 bpm</b>, one click per second.</p>
          <p>Each chord lasts <b>4 beats</b>. Strum on beat 1, hold, and use beats 3 and 4 to get ready for the next shape.</p>
          <div class="tip"><b>Tips:</b><ul>
            <li><b>Look at the next shape early.</b> While you hold one chord, picture the next one.</li>
            <li><b>Keep a pivot finger.</b> Am → C: index and middle stay, only the ring finger moves. Em → Am: keep the same 2-finger shape and just shift it down a string.</li>
            <li>Late is fine! It's better to keep the beat and land a little late than to stop.</li></ul></div>
          <p><button class="btn" data-a="go">▶ Start</button>
             <button class="pill on" data-a="snd">🔊 Play-along strum: on</button></p>
          <div class="beats"><i>1</i><i>2</i><i>3</i><i>4</i></div>
          <h3 class="now">Get ready…</h3>
          <div class="fb-now"></div>
          <p>Next up: <b class="nextname" style="background:#ffd54a;color:#222;padding:2px 10px;border-radius:6px">Em</b></p>
          <div class="fb-next" style="opacity:.75"></div>
          <p>Changes: <b class="cnt">0</b> / 8 &nbsp; <button class="btn" data-a="done" disabled>Done</button></p>`,
        mount(ctx) {
          const CH = ctx.CHORDS, SEQ = ['Em', 'Am', 'C', 'G'];
          const fbNow = ctx.mountFretboard(ctx.$('.fb-now'), { frets: 5 });
          const fbNext = ctx.mountFretboard(ctx.$('.fb-next'), { frets: 5, sound: false });
          drawChord(fbNext, CH.Em);
          const dots = ctx.$$('.beats i'), nowEl = ctx.$('.now'), nextEl = ctx.$('.nextname');
          const cntEl = ctx.$('.cnt'), go = ctx.$('[data-a="go"]'), done = ctx.$('[data-a="done"]'), snd = ctx.$('[data-a="snd"]');
          let sound = true, changes = 0;
          snd.onclick = () => { sound = !sound; snd.classList.toggle('on', sound); snd.textContent = `🔊 Play-along strum: ${sound ? 'on' : 'off'}`; };
          const met = ctx.metronome(60, (b, total) => {
            dots.forEach((d, i) => d.classList.toggle('on', i === b));
            if (total < 4) {                                // count-in bar
              nowEl.textContent = `Get ready… ${4 - total}`;
              return;
            }
            const k = Math.floor((total - 4) / 4), name = SEQ[k % 4], nxt = SEQ[(k + 1) % 4];
            if (b === 0) {
              changes = k; cntEl.textContent = Math.min(changes, 8);
              if (changes >= 8) done.disabled = false;
              drawChord(fbNow, CH[name]);
              if (sound) fbNow.strumChord(CH[name]);
              nextEl.textContent = nxt; drawChord(fbNext, CH[nxt]);
            }
            nowEl.textContent = b >= 2 ? `Now: ${name} · get ready for ${nxt}!` : `Now: ${name}`;
          });
          go.onclick = () => {
            if (met.running) { met.stop(); go.textContent = '▶ Start'; dots.forEach(d => d.classList.remove('on')); return; }
            changes = 0; cntEl.textContent = 0; nowEl.textContent = 'Get ready…';
            met.start(); go.textContent = '■ Stop';
          };
          done.onclick = () => {
            met.stop(); go.textContent = '▶ Start';
            ctx.complete();
            ctx.status('Wonderful! 8 changes done. Practise this a few minutes every day and it will soon feel easy.');
          };
        },
      },
      // 10 --------------------------------------------------------------
      {
        title: 'Chords in sargam + final quiz',
        html: `<p>Every chord is just a few swaras played together. With <b>Sa = C</b>:</p>
          <table style="border-collapse:collapse;margin:8px 0">
            <tr><th style="padding:4px 12px;text-align:left">Chord</th><th style="padding:4px 12px;text-align:left">Notes</th><th style="padding:4px 12px;text-align:left">Swaras</th><th></th></tr>
            <tr><td style="padding:4px 12px"><b>C</b></td><td style="padding:4px 12px">C E G</td><td style="padding:4px 12px">Sa Ga Pa</td><td><button class="pill" data-c="C">▶</button></td></tr>
            <tr><td style="padding:4px 12px"><b>G</b></td><td style="padding:4px 12px">G B D</td><td style="padding:4px 12px">Pa Ni Re'</td><td><button class="pill" data-c="G">▶</button></td></tr>
            <tr><td style="padding:4px 12px"><b>Em</b></td><td style="padding:4px 12px">E G B</td><td style="padding:4px 12px">Ga Pa Ni</td><td><button class="pill" data-c="Em">▶</button></td></tr>
            <tr><td style="padding:4px 12px"><b>Am</b></td><td style="padding:4px 12px">A C E</td><td style="padding:4px 12px">Dha Sa Ga</td><td><button class="pill" data-c="Am">▶</button></td></tr>
          </table>
          <p>(Re' means upper-octave Re.) Press ▶ to strum a chord and see its swaras lit up on the fretboard.
          Notice: some strings repeat the same swara in another octave. A chord can have 6 strings but only 3 different swaras.</p>
          <div class="fbwrap"></div>
          <h3>Quick quiz</h3><div class="qz"></div>`,
        mount(ctx) {
          ctx.setSa(0);
          const CH = ctx.CHORDS, fb = ctx.mountFretboard(ctx.$('.fbwrap'), { frets: 5, labels: 'sargam' });
          ctx.$$('[data-c]').forEach(b => b.onclick = () => {
            const n = b.dataset.c; drawChord(fb, CH[n]); fb.strumChord(CH[n]);
            ctx.status(`${n}: the lit-up cells are the swaras you hear.`);
          });
          ctx.quiz(ctx.$('.qz'), [
            { q: 'What is a chord?', options: ['One note played loudly', 'Three or more notes played together', 'A fast melody'], answer: 1,
              explain: 'Yes! Notes together = harmony. Notes one after another = melody.' },
            { q: 'Which chord is the easiest, with just 2 fingers?', options: ['C', 'G', 'Em', 'D'], answer: 2,
              explain: 'Em: fingers 2 and 3 on fret 2 of the A and D strings, all six strings strummed.' },
            { q: 'Am and Em usually sound…', options: ['Bright and happy (major)', 'Sad or soft (minor)'], answer: 1,
              explain: 'Right. The small "m" means minor, which has a softer, sadder colour.' },
            { q: 'With Sa = C, which swaras make the C chord?', options: ['Sa Re Ga', 'Sa Ga Pa', 'Pa Ni Re\'', 'Dha Sa Ga'], answer: 1,
              explain: 'C = C E G = Sa Ga Pa. Lovely, now you can see chords in sargam!' },
          ]);
        },
      },
    ],
  });
})();
