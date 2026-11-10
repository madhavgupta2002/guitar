// Lesson 2: Notes, Semitones & the Fretboard
(() => {
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
  const SARGAM_C = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', "Ma'", 'Pa', 'dha', 'Dha', 'ni', 'Ni']; // with Sa = C
  const STR_LABEL = ['1 (high e)', '2 (B)', '3 (G)', '4 (D)', '5 (A)', '6 (low E)'];
  const pcOf = m => ((m % 12) + 12) % 12;

  // Small helper: a row of pill buttons. Returns the container.
  function pills(target, items, onClick) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:10px 0';
    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'pill'; b.innerHTML = it;
      b.onclick = () => onClick(i, b, row);
      row.appendChild(b);
    });
    target.appendChild(row);
    return row;
  }
  const setOn = (row, idx) => [...row.children].forEach((b, i) => b.classList.toggle('on', i === idx));

  Lessons.register({
    id: 'notes-and-frets', order: 2, title: 'Notes, Semitones & the Fretboard', minutes: 8,
    steps: [
      // 1 ─────────────────────────────────────────────
      {
        title: 'What is a note?',
        html: `<p>A <b>note</b> is one musical sound with a steady <b>pitch</b>.</p>
          <p><b>Pitch</b> means how <b>high</b> or <b>low</b> a sound is. A bird chirp is high. A drum or a lion's roar is low.
          On a guitar, thick strings sound low and thin strings sound high.</p>
          <p>You already know this idea from <b>Sa Re Ga Ma</b>: each sargam syllable is a note, and each one is a little higher than the last.</p>
          <div class="task">Click the two buttons. Hear the difference between a low note and a high note.</div>
          <div id="hl"></div>`,
        mount(ctx) {
          const heard = new Set();
          pills(ctx.$('#hl'), ['🔈 Low note (low E string)', '🔊 High note (high e string, fret 12)'], i => {
            ctx.engine.playMidi(i === 0 ? 40 : 76);
            heard.add(i);
            ctx.status(i === 0 ? 'That was low: a slow, deep vibration.' : 'That was high: a fast, bright vibration.');
            if (heard.size === 2) ctx.complete();
          });
        },
      },
      // 2 ─────────────────────────────────────────────
      {
        title: 'The 12 notes of music',
        html: `<p>Western music names notes with the letters <b>A B C D E F G</b>. This is called the <b>musical alphabet</b>.
          After G it starts again at A. Only 7 letters!</p>
          <p>Between most letters there is an extra "in-between" note. We call it a <b>sharp</b> (#, meaning a little higher)
          or a <b>flat</b> (b, meaning a little lower). So <b>C#</b> and <b>Db</b> are the <i>same</i> note with two names.</p>
          <p>Put together, starting from C, there are exactly <b>12 notes</b>:</p>
          <p style="font-size:1.1em"><b>C &nbsp;C# &nbsp;D &nbsp;D# &nbsp;E &nbsp;F &nbsp;F# &nbsp;G &nbsp;G# &nbsp;A &nbsp;A# &nbsp;B</b> &nbsp;… then C again</p>
          <div class="tip"><b>Why no sharp between E-F and B-C?</b> Those pairs are already as close as two notes can be.
          There is simply no room for a note in between. (Look at a piano: there is no black key there.)</div>
          <p>If Sa = C, these are exactly the 12 swaras: Sa re Re ga Ga Ma Ma' Pa dha Dha ni Ni.
          The komal and tivra swaras are the sharps/flats.</p>
          <div class="task">Click all 12 notes, from C upward. Listen how each one is a tiny step higher.</div>
          <div id="row"></div>`,
        mount(ctx) {
          const heard = new Set();
          const row = pills(ctx.$('#row'), NOTE.map((n, i) =>
            `${n}${FLAT[n] ? '/' + FLAT[n] : ''}<br><small>${SARGAM_C[i]}</small>`), (i, b) => {
            ctx.engine.playMidi(60 + i);
            heard.add(i); b.classList.add('on');
            ctx.status(`${NOTE[i]}${FLAT[NOTE[i]] ? ' (also called ' + FLAT[NOTE[i]] + ')' : ''} = ${SARGAM_C[i]} when Sa is C. ${heard.size}/12 heard.`);
            if (heard.size === 12) { ctx.status('All 12! That is every note there is. Music just repeats them higher and lower.'); ctx.complete(); }
          });
          row.style.gap = '4px';
        },
      },
      // 3 ─────────────────────────────────────────────
      {
        title: 'Semitone = one fret, tone = two frets',
        html: `<p>The smallest step between two of those 12 notes is called a <b>semitone</b> (or "half step").
          On the guitar, <b>one fret = one semitone</b>. Moving one fret toward the body makes the note one step higher.</p>
          <p>Two semitones together make a <b>tone</b> (or "whole step") = <b>two frets</b>.
          Sa to Re is a tone; Ga to Ma is only a semitone, just like E to F.</p>
          <div class="task">On the <b>low E string</b> (the thick one at the bottom), click the open string and frets 1 to 5, one by one.
          Read the note names: E, F, F#, G, G#, A.</div>
          <div id="fb"></div>`,
        mount(ctx) {
          const done = new Set();
          const fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 5, labels: 'note',
            onPress({ s, f, midi }) {
              if (s !== 5) { ctx.status('That is a different string. Try the thick low E string at the bottom.'); return; }
              done.add(f); fb.unhighlight(5, f); fb.highlight(5, f, 'green');
              const prev = f > 0 ? ` One fret up from ${NOTE[pcOf(midi - 1)]}, so a semitone higher.` : ' The open string.';
              ctx.status(`Fret ${f} = ${NOTE[pcOf(midi)]}.${prev} (${done.size}/6)`);
              if (done.size === 6) { ctx.status('Notice E to F was just one fret (no E#!). E to F# is two frets = one tone.'); ctx.complete(); }
            },
          });
          fb.highlight(5, 0, 'gold');
        },
      },
      // 4 ─────────────────────────────────────────────
      {
        title: 'The octave: 12 frets later, same note',
        html: `<p>After 12 semitones the note names start again. The note 12 frets up has the <b>same name</b>, just higher.
          This distance is called an <b>octave</b>. It is like going from Sa to the higher Sa' (taar Sa).</p>
          <p>That's why fret 12 has two dots: it marks the octave. Fret 12 on any string = the open string, one octave up.</p>
          <div class="task">On any string, play the <b>open</b> string, then <b>fret 12</b> of the same string. Hear how they sound "the same, but higher".</div>
          <div id="fb"></div>`,
        mount(ctx) {
          let lastOpen = -1;
          const fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 12, labels: 'note',
            onPress({ s, f }) {
              fb.clearHighlights();
              fb.highlight(s, 0, 'gold'); fb.highlight(s, 12, 'gold');
              if (f === 0) { lastOpen = s; ctx.status(`Open ${ctx.engine.NAMES[s]} string. Now play fret 12 on the same string.`); }
              else if (f === 12 && lastOpen === s) {
                fb.unhighlight(s, 12); fb.highlight(s, 12, 'green');
                ctx.status(`Both are ${NOTE[pcOf(ctx.engine.midiOf(s, 0))]}! Same name, one octave apart. 🎉`);
                ctx.complete();
              } else if (f === 12) ctx.status('Good, that is fret 12. Now play the open string first, then fret 12 again.');
              else ctx.status(`That's fret ${f}. Look for the open string (left) and fret 12 (two dots).`);
            },
          });
        },
      },
      // 5 ─────────────────────────────────────────────
      {
        title: 'The big secret: strings are 5 frets apart',
        html: `<p>Here is the key idea that makes the fretboard make sense.</p>
          <p>Each string is tuned so that <b>fret 5</b> of one string gives the <b>same note</b> as the next thinner string played open.
          Low E at fret 5 = A. And the next string <i>is</i> the A string!</p>
          <div class="tip"><b>One exception:</b> between the <b>G</b> and <b>B</b> strings it is <b>4 frets</b>, not 5.
          (Guitar makers chose this so chords are easier to hold.)</div>
          <p>This means the <b>same note can be played in several places</b>. That's normal and very useful.</p>
          <div class="task">Play <b>fret 5 on the low E string</b>, then the <b>open A string</b> just above it. Same note!</div>
          <div id="fb"></div>`,
        mount(ctx) {
          let step = 0;
          const fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 5, labels: 'note',
            onPress({ s, f }) {
              if (s === 5 && f === 5) { step = 1; fb.unhighlight(5, 5); fb.highlight(5, 5, 'green'); ctx.status('That is A. Now play the open A string (one string up).'); }
              else if (s === 4 && f === 0 && step === 1) {
                fb.unhighlight(4, 0); fb.highlight(4, 0, 'green');
                ctx.status('Exactly the same A! Strings are 5 frets apart (4 between G and B).'); ctx.complete();
              } else ctx.status('Try fret 5 on the low E string, then the open A string.');
            },
          });
          fb.highlight(5, 5, 'gold'); fb.highlight(4, 0, 'gold');
        },
      },
      // 6 ─────────────────────────────────────────────
      {
        title: 'One note, many places',
        html: `<p>Pick a note below and every place it lives on the fretboard lights up. See the diagonal patterns?
          That is the 5-fret rule (and the 4-fret G-B jump) at work.</p>
          <div id="sel"></div><div id="fb1"></div>
          <div class="task">Now a challenge on this smaller fretboard: <b>find all the A notes within the first 5 frets</b> (open string to fret 5).
          No labels this time, use the rule!</div>
          <div id="fb2"></div>`,
        mount(ctx) {
          const fb1 = ctx.mountFretboard(ctx.$('#fb1'), { frets: 12, labels: 'note' });
          const row = pills(ctx.$('#sel'), NOTE, i => {
            setOn(row, i); fb1.clearHighlights(); fb1.highlightPitchClass(i, 'gold');
            ctx.engine.playMidi(48 + i);
          });
          setOn(row, 9); fb1.highlightPitchClass(9, 'gold');

          const targets = [];
          for (let s = 0; s < 6; s++) for (let f = 0; f <= 5; f++) if (pcOf(ctx.engine.midiOf(s, f)) === 9) targets.push(s + ':' + f);
          const found = new Set();
          const fb2 = ctx.mountFretboard(ctx.$('#fb2'), {
            frets: 5, labels: 'none',
            onPress({ s, f, midi }) {
              const k = s + ':' + f;
              if (targets.includes(k)) {
                if (!found.has(k)) { found.add(k); fb2.highlight(s, f, 'green'); fb2.mark(s, f, 'A'); }
                ctx.status(`Yes, an A! ${found.size}/${targets.length} found.`);
                if (found.size === targets.length) { ctx.status(`All ${targets.length} A notes found in just 5 frets! 🎉`); ctx.complete(); }
              } else {
                fb2.highlight(s, f, 'red'); setTimeout(() => fb2.unhighlight(s, f), 500);
                ctx.status(`That's ${NOTE[pcOf(midi)]}, not A. Hint: open A string, and 5 frets up on the string below.`);
              }
            },
          });
        },
      },
      // 7 ─────────────────────────────────────────────
      {
        title: 'Memorise: natural notes on the E and A strings',
        html: `<p><b>Natural notes</b> are the ones without # or b: C D E F G A B (Sa Re Ga Ma Pa Dha Ni when Sa = C).</p>
          <p>Most beginner chords and songs start on the two thickest strings, so learn these first:</p>
          <p><b>Low E string:</b> E (open) · F (1) · G (3) · A (5) · B (7) · C (8) · D (10) · E (12)<br>
          <b>A string:</b> A (open) · B (2) · C (3) · D (5) · E (7) · F (8) · G (10) · A (12)</p>
          <div class="tip">Pattern: natural notes are 2 frets apart, except <b>E→F</b> and <b>B→C</b>, which are just 1 fret apart. Same rule as before!</div>
          <div class="task">Click every highlighted natural note on the low E string and the A string. They turn green as you go.</div>
          <div id="fb"></div>`,
        mount(ctx) {
          const nat = [0, 2, 4, 5, 7, 9, 11];
          const todo = new Set();
          const fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 12, labels: 'note',
            onPress({ s, f, midi }) {
              const k = s + ':' + f;
              if (todo.has(k)) {
                todo.delete(k); fb.unhighlight(s, f); fb.highlight(s, f, 'green');
                ctx.status(`${NOTE[pcOf(midi)]} on the ${s === 5 ? 'low E' : 'A'} string, fret ${f}. ${todo.size} left.`);
                if (!todo.size) { ctx.status('All natural notes played. Say them out loud next time you practise!'); ctx.complete(); }
              } else if (s === 4 || s === 5) ctx.status(`${NOTE[pcOf(midi)]} is a sharp/flat, not a natural note.`);
            },
          });
          [5, 4].forEach(s => { for (let f = 0; f <= 12; f++) if (nat.includes(pcOf(ctx.engine.midiOf(s, f)))) { todo.add(s + ':' + f); fb.highlight(s, f, s === 5 ? 'gold' : 'blue'); } });
        },
      },
      // 8 ─────────────────────────────────────────────
      {
        title: 'Game: find the note',
        html: `<p>Time to read the fretboard! I'll name a note and a string. Click where it is.
          Strings are numbered <b>1 (thin, high e)</b> to <b>6 (thick, low E)</b>.</p>
          <p>Labels help at first. Try switching them off once you feel confident.</p>
          <div id="lab"></div>
          <div class="task" id="ask">…</div>
          <div id="fb"></div>`,
        mount(ctx) {
          const NEED = 5;
          let score = 0, want = null;
          const fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 12, labels: 'note',
            onPress({ s, f, midi }) {
              if (!want) return;
              if (s === want.s && pcOf(midi) === want.pc) {
                score++; fb.highlight(s, f, 'green');
                if (score >= NEED && !ctx.isComplete) { ctx.complete(); }
                ctx.status(score >= NEED ? `Correct! ${score} right. You can keep playing or move on. 🎉` : `Correct! ${score}/${NEED}`);
                setTimeout(ask, 700);
              } else {
                fb.highlight(s, f, 'red'); setTimeout(() => fb.unhighlight(s, f), 500);
                ctx.status(s !== want.s ? `That's string ${s + 1}. Look for string ${STR_LABEL[want.s]}.`
                  : `That's ${NOTE[pcOf(midi)]}. Count the frets from the open string (${ctx.engine.NAMES[s]}).`);
              }
            },
          });
          const modes = ['none', 'note', 'fret'];
          const row = pills(ctx.$('#lab'), ['No labels', 'Note names', 'Fret numbers'], i => { setOn(row, i); fb.setLabels(modes[i]); });
          setOn(row, 1);
          function ask() {
            fb.clearHighlights();
            let n;
            do { n = { s: Math.floor(Math.random() * 6), pc: Math.floor(Math.random() * 12) }; }
            while (want && n.s === want.s && n.pc === want.pc);
            want = n;
            ctx.$('#ask').innerHTML = `Find <b>${NOTE[want.pc]}</b> on string <b>${STR_LABEL[want.s]}</b>`;
          }
          ask();
        },
      },
      // 9 ─────────────────────────────────────────────
      {
        title: 'Quick quiz',
        html: `<p>Let's check what stuck. Answer all of these to finish the lesson.</p><div id="quiz"></div>`,
        mount(ctx) {
          ctx.quiz(ctx.$('#quiz'), [
            { q: 'How many different notes are there in music?', options: ['7', '8', '12'], answer: 2,
              explain: '7 letters, plus 5 sharps/flats = 12 notes, then they repeat.' },
            { q: 'Moving up one fret changes the note by…', options: ['a semitone', 'a tone', 'an octave'], answer: 0,
              explain: 'One fret = one semitone. Two frets = one tone.' },
            { q: 'Which pair has NO sharp between them?', options: ['C and D', 'E and F', 'G and A'], answer: 1,
              explain: 'E-F and B-C are only one semitone apart, so there is no note in between.' },
            { q: 'Fret 12 on the A string plays…', options: ['B', 'A, one octave higher', 'E'], answer: 1,
              explain: '12 frets = 12 semitones = one octave. Same name, higher pitch, like Sa to taar Sa.' },
            { q: 'Fret 5 on the low E string is the same note as…', options: ['the open A string', 'the open D string', 'fret 5 on the A string'], answer: 0,
              explain: 'Neighbouring strings are 5 frets apart (except G to B, which is 4).' },
            { q: 'If Sa = C, which note is Pa?', options: ['F', 'G', 'A'], answer: 1,
              explain: 'Sa Re Ga Ma Pa = C D E F G.' },
          ]);
        },
      },
    ],
  });
})();
