// Lesson 3: Sa Re Ga Ma & the Major Scale
(() => {
  const E = Engine;
  const SWARAS = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', "Sa'"];
  const OFFS = [0, 2, 4, 5, 7, 9, 11, 12];
  const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
  const FULL = ['Shadja', 'Rishabh', 'Gandhar', 'Madhyam', 'Pancham', 'Dhaivat', 'Nishad'];
  const base = () => 60 + E.state.saPc;
  const pc = m => ((m % 12) + 12) % 12;
  const MAX_MIDI = 76;                              // highest note on a 12-fret fretboard (high e, fret 12)

  // Highlight a note on the fretboard; if it is above the fretboard's range, show its pitch class instead.
  const hlNote = (fb, midi, color) => {
    if (midi <= MAX_MIDI) fb.highlightMidi(midi, color); else fb.highlightPitchClass(pc(midi), color);
  };

  // Builds an 8-button scale pad (Sa..Sa') with keyboard keys A S D F G H J K.
  // onNote(index) is called after the note plays. Returns {buttons, flash(i)}.
  function scalePad(ctx, target, fb, onNote, opts = {}) {
    const wrap = document.createElement('div');
    wrap.style.margin = '10px 0';
    const buttons = SWARAS.map((name, i) => {
      const b = document.createElement('button');
      b.className = 'pill';
      b.style.minWidth = '64px';
      b.innerHTML = `<b>${name}</b><br><small>${E.pitchName(base() + OFFS[i])} · key ${KEYS[i].toUpperCase()}</small>`;
      b.onclick = () => hit(i);
      wrap.appendChild(b);
      return b;
    });
    target.appendChild(wrap);
    let timer = null;
    function hit(i) {
      const midi = base() + OFFS[i];
      E.playMidi(midi);
      if (fb) {
        fb.clearHighlights();
        if (opts.keepTarget) opts.keepTarget();
        hlNote(fb, midi, 'gold');
        clearTimeout(timer);
        timer = setTimeout(() => { fb.clearHighlights(); if (opts.keepTarget) opts.keepTarget(); }, 600);
      }
      buttons[i].style.outline = '2px solid #ffd54a';
      setTimeout(() => { buttons[i].style.outline = ''; }, 300);
      if (onNote) onNote(i);
    }
    ctx.keys(e => {
      const i = KEYS.indexOf(e.key.toLowerCase());
      if (i >= 0) { e.preventDefault(); hit(i); }
    });
    ctx.onCleanup(() => clearTimeout(timer));
    return { buttons, hit };
  }

  // A guided "play this sequence" task used for ascending and descending scales.
  function sequenceTask(ctx, order, doneMsg) {
    const prog = ctx.$('.seq');
    let pos = 0;
    const fb = ctx.mountFretboard(ctx.$('.fbwrap'), {
      labels: 'sargam',
      onPress: ({ midi }) => {                     // fretboard clicks count if the swara matches
        if (pos < order.length && pc(midi) === pc(base() + OFFS[order[pos]])) advance();
        else if (pos < order.length) ctx.status(`That was ${E.sargamOf(midi)}. Looking for ${SWARAS[order[pos]]}.`);
      },
    });
    const showTarget = () => {
      if (pos < order.length) hlNote(fb, base() + OFFS[order[pos]], 'blue');
    };
    const render = () => {
      prog.innerHTML = order.map((i, k) =>
        `<span class="pill${k < pos ? ' on' : ''}" style="cursor:default;${k === pos ? 'outline:2px solid #5aa0ff' : ''}">${SWARAS[i]}</span>`).join(' ');
      pad.buttons.forEach((b, i) => { b.style.boxShadow = pos < order.length && i === order[pos] ? '0 0 0 3px #5aa0ff' : ''; });
      fb.clearHighlights(); showTarget();
    };
    function advance() {
      pos++;
      render();
      if (pos === order.length) { ctx.status(doneMsg); ctx.complete(); }
      else ctx.status(`Nice! Next: ${SWARAS[order[pos]]}`);
    }
    const pad = scalePad(ctx, ctx.$('.padwrap'), fb, i => {
      if (pos >= order.length) return;
      if (i === order[pos]) advance();
      else ctx.status(`Oops, that was ${SWARAS[i]}. Try ${SWARAS[order[pos]]} (the blue one).`);
    }, { keepTarget: showTarget });
    render();
    ctx.status(`Start with ${SWARAS[order[0]]}.`);
  }

  Lessons.register({
    id: 'sargam-scale', order: 3, title: 'Sa Re Ga Ma & the Major Scale', minutes: 9,
    steps: [
      {
        title: 'Meet the seven swaras',
        html: `<p>Indian music has <b>seven swaras</b> (notes). You probably know them already:
          <b>Sa Re Ga Ma Pa Dha Ni</b>. After Ni comes Sa again, just higher. We write that higher Sa as <b>Sa'</b>.</p>
          <p>Western music uses letters for the same idea. If we put Sa on the note <b>C</b>, they line up like this:</p>
          <table style="border-collapse:collapse;margin:8px 0">
            <tr>${SWARAS.slice(0, 7).map(s => `<th style="padding:4px 12px;border-bottom:1px solid #555">${s}</th>`).join('')}</tr>
            <tr>${['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(s => `<td style="padding:4px 12px;text-align:center">${s}</td>`).join('')}</tr>
          </table>
          <p style="opacity:.8"><small>Full names: ${FULL.join(', ')}. "Sa" is short for Shadja, and so on.</small></p>
          <div class="task">Click every swara to hear it (Sa = C for now).</div><div class="row"></div>`,
        mount(ctx) {
          ctx.setSa(0);
          const heard = new Set();
          const row = ctx.$('.row');
          SWARAS.forEach((name, i) => {
            const b = document.createElement('button');
            b.className = 'pill';
            b.innerHTML = `${name} = ${E.pitchName(60 + OFFS[i])}`;
            b.onclick = () => {
              E.playMidi(60 + OFFS[i]);
              b.classList.add('on'); heard.add(i);
              ctx.status(`${name} is the note ${E.pitchName(60 + OFFS[i])}. ${heard.size}/8 heard.`);
              if (heard.size === 8) { ctx.status('You heard them all! Notice how each one climbs a little higher.'); ctx.complete(); }
            };
            row.appendChild(b);
          });
        },
      },
      {
        title: 'Sa is just "home"',
        html: `<p>Here is a big secret: <b>Sa is not a fixed note</b>. Sa is simply <b>home</b>, the note your song rests on.
          A singer picks a Sa that suits their voice. Western musicians call this the <b>key</b>.</p>
          <p>Once you pick Sa, every other swara moves with it. Pick a Sa below and watch the fretboard relabel itself.</p>
          <div class="tip">Many Indian songs on guitar use Sa = C, D or E. All of them are fine!</div>
          <div class="task">Choose a new Sa (anything other than C), then click any fret to hear it.</div>
          <div class="sa"></div><div class="lab"></div><div class="fbwrap"></div>`,
        mount(ctx) {
          let changed = false, clicked = false;
          const fb = ctx.mountFretboard(ctx.$('.fbwrap'), {
            labels: 'sargam',
            onPress: ({ midi }) => {
              clicked = true;
              ctx.status(`${E.noteName(midi)} is ${E.sargamOf(midi)} when Sa = ${E.NOTE[E.state.saPc]}.`);
              check();
            },
          });
          const check = () => { if (changed && clicked) ctx.complete(); };
          const saRow = ctx.$('.sa'), labRow = ctx.$('.lab');
          let mode = 'sargam';
          const labBtns = [['sargam', 'Show Sa Re Ga'], ['note', 'Show C D E']].map(([m, t]) => {
            const b = document.createElement('button'); b.className = 'pill'; b.textContent = t;
            b.onclick = () => { mode = m; fb.setLabels(m); labBtns.forEach(x => x.classList.toggle('on', x === b)); };
            labRow.appendChild(b); return b;
          });
          labBtns[0].classList.add('on');
          const saBtns = E.NOTE.map((n, p) => {
            const b = document.createElement('button'); b.className = 'pill'; b.textContent = 'Sa = ' + n;
            b.onclick = () => {
              ctx.setSa(p);
              saBtns.forEach(x => x.classList.toggle('on', x === b));
              fb.setLabels(mode);
              fb.clearHighlights(); fb.highlightPitchClass(p, 'gold');
              E.playMidi(60 + p);
              if (p !== 0) changed = true;
              ctx.status(`Sa is now ${n}. Every gold spot is a Sa. Re is ${E.NOTE[(p + 2) % 12]}, Pa is ${E.NOTE[(p + 7) % 12]}.`);
              check();
            };
            saRow.appendChild(b); return b;
          });
          saBtns[E.state.saPc].classList.add('on');
          fb.highlightPitchClass(E.state.saPc, 'gold');
        },
      },
      {
        title: 'The pattern: tone, tone, semitone...',
        html: `<p>Between any two neighbouring frets the distance is a <b>semitone</b> (a half step). Two frets is a <b>tone</b> (a whole step).</p>
          <p>The seven swaras are <b>not</b> evenly spaced. They follow this pattern, starting from Sa:</p>
          <p style="font-size:18px"><b>T T S T T T S</b> &nbsp; = tone, tone, semitone, tone, tone, tone, semitone</p>
          <p>These are the <b>Shuddha</b> (pure, natural) swaras. In Hindustani music this scale is called <b>Bilawal</b> thaat. In Western music it is the <b>major scale</b>. Same thing, two names!</p>
          <div class="task">Below are all 12 semitones from Sa to Sa'. Press "Play the pattern", then click any dot.</div>
          <div class="line" style="position:relative;height:110px;margin:14px 0;min-width:560px"></div>
          <button class="btn play">▶ Play the pattern</button>`,
        mount(ctx) {
          const line = ctx.$('.line'), W = 42, L = 20;
          const dots = [];
          line.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${L}px;top:50px;width:${12 * W}px;height:2px;background:#666"></div>`);
          for (let s = 0; s <= 12; s++) {
            const k = OFFS.indexOf(s), inScale = k >= 0;
            const d = document.createElement('div');
            Object.assign(d.style, {
              position: 'absolute', left: L + s * W - (inScale ? 13 : 5) + 'px', top: (inScale ? 38 : 46) + 'px',
              width: (inScale ? 26 : 10) + 'px', height: (inScale ? 26 : 10) + 'px', borderRadius: '50%',
              background: inScale ? '#d9822b' : '#555', cursor: 'pointer', fontSize: '10px', textAlign: 'center', lineHeight: '26px',
              transition: 'transform .15s',
            });
            if (inScale) d.textContent = SWARAS[k];
            d.title = E.sargamOf(base() + s) + ' (' + E.pitchName(base() + s) + ')';
            d.onclick = () => { E.playMidi(base() + s); ctx.status(`${inScale ? SWARAS[k] : 'Not in the scale: ' + E.sargamOf(base() + s)} = ${E.pitchName(base() + s)}, ${s} semitone${s === 1 ? '' : 's'} above Sa.`); };
            line.appendChild(d); dots[s] = d;
            line.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${L + s * W - 15}px;top:78px;width:30px;text-align:center;font-size:11px;opacity:.7">${E.pitchName(base() + s)}</div>`);
          }
          for (let k = 0; k < 7; k++) {
            const a = OFFS[k], b = OFFS[k + 1], tone = b - a === 2;
            line.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${L + a * W}px;top:6px;width:${(b - a) * W}px;text-align:center;font-weight:bold;color:${tone ? '#ffd54a' : '#7fd47f'}">${tone ? 'T' : 'S'}</div>`);
          }
          const timers = [];
          ctx.onCleanup(() => timers.forEach(clearTimeout));
          ctx.$('.play').onclick = () => {
            OFFS.forEach((s, k) => {
              E.playMidi(base() + s, k * 0.45);
              timers.push(setTimeout(() => {
                dots[s].style.transform = 'scale(1.4)';
                ctx.status(k === 0 ? 'Sa...' : `${SWARAS[k]}: ${OFFS[k] - OFFS[k - 1] === 2 ? 'a tone (2 frets) up' : 'a semitone (1 fret) up'}`);
                timers.push(setTimeout(() => { dots[s].style.transform = ''; }, 300));
              }, k * 450));
            });
            timers.push(setTimeout(() => { ctx.status('T T S T T T S. That is the major scale! Click any dot to explore.'); ctx.complete(); }, 8 * 450));
          };
        },
      },
      {
        title: 'Komal and tivra: all 12 swarasthanas',
        html: `<p>What about the grey dots in the gaps? Those are real notes too! Altogether there are <b>12 swarasthanas</b> (note positions) in one octave, one per fret.</p>
          <ul>
            <li><b>Komal</b> means soft or flat: one semitone <i>lower</i>. Re, Ga, Dha and Ni can be komal. We write them in small letters: <b>re, ga, dha, ni</b>.</li>
            <li><b>Tivra</b> means sharp: one semitone <i>higher</i>. Only Ma can be tivra. We write it <b>Ma'</b>.</li>
            <li><b>Sa and Pa never change.</b> They are <i>achal</i> (fixed). More on Pa next!</li>
          </ul>
          <div class="task">Click all 12 to hear them in order and see their names.</div>
          <div class="row"></div><div class="info" style="min-height:24px;margin-top:8px"></div>`,
        mount(ctx) {
          const DESC = {
            Sa: 'Sa, home. Fixed (achal).', re: 'komal Re (flat Re), just 1 semitone above Sa.', Re: 'shuddha Re.',
            ga: 'komal Ga (flat Ga). Sounds a bit sad, like a minor scale.', Ga: 'shuddha Ga.', Ma: 'shuddha Ma.',
            "Ma'": "tivra Ma (sharp Ma). Raag Yaman uses it!", Pa: 'Pa, the perfect fifth. Fixed (achal).',
            dha: 'komal Dha (flat Dha).', Dha: 'shuddha Dha.', ni: 'komal Ni (flat Ni). Common in folk and film songs.', Ni: 'shuddha Ni.',
          };
          const seen = new Set(), row = ctx.$('.row'), info = ctx.$('.info');
          E.SARGAM.forEach((name, s) => {
            const b = document.createElement('button');
            const natural = OFFS.includes(s);
            b.className = 'pill';
            b.style.minWidth = '52px';
            if (!natural) b.style.background = '#2a2030';
            b.innerHTML = `<b>${name}</b><br><small>${E.pitchName(base() + s)}</small>`;
            b.onclick = () => {
              E.playMidi(base() + s);
              b.classList.add('on'); seen.add(s);
              info.innerHTML = `<b>${name}</b> (${E.pitchName(base() + s)}): ${DESC[name]}`;
              ctx.status(`${seen.size}/12 swarasthanas heard.`);
              if (seen.size === 12) { ctx.status('All 12! 7 shuddha + 4 komal + 1 tivra = 12.'); ctx.complete(); }
            };
            row.appendChild(b);
          });
        },
      },
      {
        title: 'Pa: the perfect fifth',
        html: `<p><b>Pa</b> is 7 semitones above Sa. Western musicians call this distance a <b>perfect fifth</b> (Sa Re Ga Ma <b>Pa</b>: it is the 5th swara).</p>
          <p>Why does Sa + Pa sound so calm and stable? When Sa vibrates 2 times, Pa vibrates almost exactly 3 times. The waves line up very often, so our ears hear them as "fitting together". That is why the tanpura drones Sa and Pa, and why Pa never becomes komal or tivra.</p>
          <div class="task">Play each pair and compare. Which one feels most restful?</div>
          <div class="row"></div>`,
        mount(ctx) {
          const pairs = [['Sa + Pa', 7, 'Smooth and stable. This is the famous "power chord" sound on guitar too!'],
            ['Sa + Ma\'', 6, 'Tense and restless! Tivra Ma right next to Pa wants to move.'],
            ['Sa + re', 1, 'Very crunchy. Notes one fret apart clash.'],
            ['Sa + Sa\'', 12, 'The same note, an octave higher. Super stable, almost one sound.']];
          const tried = new Set(), row = ctx.$('.row');
          pairs.forEach(([label, iv, msg], i) => {
            const b = document.createElement('button'); b.className = 'pill'; b.textContent = label;
            b.onclick = () => {
              E.playMidi(base()); E.playMidi(base() + iv, 0.02);
              b.classList.add('on'); tried.add(i);
              ctx.status(msg);
              if (tried.has(0) && tried.size >= 2) ctx.complete();
            };
            row.appendChild(b);
          });
        },
      },
      {
        title: 'Play the scale on your keyboard',
        html: `<p>Now you play! Your computer keys <b>A S D F G H J K</b> are Sa Re Ga Ma Pa Dha Ni Sa'. You can also click the buttons.</p>
          <p>Each time you play a swara, every spot where that exact note lives on the guitar lights up in gold. See how the same note appears on more than one string?</p>
          <div class="task">Play all 8 notes at least once.</div>
          <div class="padwrap"></div><div class="fbwrap"></div>`,
        mount(ctx) {
          const fb = ctx.mountFretboard(ctx.$('.fbwrap'), { labels: 'sargam' });
          const seen = new Set();
          scalePad(ctx, ctx.$('.padwrap'), fb, i => {
            seen.add(i);
            ctx.status(`${SWARAS[i]} (${E.noteName(base() + OFFS[i])}). ${seen.size}/8 played.`);
            if (seen.size === 8) { ctx.status('All 8! Keep playing as long as you like.'); ctx.complete(); }
          });
        },
      },
      {
        title: 'Climb up: Sa Re Ga Ma Pa Dha Ni Sa\'',
        html: `<p>Let's walk up the scale in order. The next swara to play glows <b style="color:#5aa0ff">blue</b> on the buttons and on the fretboard.</p>
          <div class="task">Play Sa Re Ga Ma Pa Dha Ni Sa' in order (keys A to K, buttons, or the blue frets).</div>
          <div class="seq" style="margin:8px 0"></div><div class="padwrap"></div><div class="fbwrap"></div>`,
        mount(ctx) { sequenceTask(ctx, [0, 1, 2, 3, 4, 5, 6, 7], "Wonderful! You just played a full major scale, aaroh (going up)."); },
      },
      {
        title: 'Sing along: name that swara',
        html: `<p>Ear training time. The app plays <b>Sa</b> first (home), then a mystery swara. Sing it softly if you like, then pick its name.</p>
          <div class="tip">Tip: count up from Sa in your head, "Sa, Re, Ga..." until it matches.</div>
          <div class="task">Get 5 right to finish. Keys A to J work too.</div>
          <button class="btn again">▶ Play again</button> <span class="score" style="margin-left:10px"></span>
          <div class="row" style="margin-top:10px"></div>`,
        mount(ctx) {
          let target = -1, score = 0, locked = false;
          const scoreEl = ctx.$('.score'), row = ctx.$('.row');
          const timers = [];
          ctx.onCleanup(() => timers.forEach(clearTimeout));
          const play = () => { E.playMidi(base()); E.playMidi(base() + OFFS[target], 0.7); };
          const newRound = () => {
            let t; do { t = Math.floor(Math.random() * 7); } while (t === target);
            target = t; locked = false; play();
            scoreEl.textContent = `Score: ${score}/5`;
          };
          const btns = SWARAS.slice(0, 7).map((name, i) => {
            const b = document.createElement('button'); b.className = 'pill'; b.textContent = name;
            b.onclick = () => answer(i);
            row.appendChild(b); return b;
          });
          function answer(i) {
            if (locked || score >= 5 || target < 0) return;
            if (i === target) {
              score++; locked = true;
              btns[i].classList.add('on');
              timers.push(setTimeout(() => btns[i].classList.remove('on'), 700));
              scoreEl.textContent = `Score: ${score}/5`;
              if (score >= 5) { ctx.status('5 correct! Your ears are learning the swaras.'); ctx.complete(); return; }
              ctx.status(`Yes, ${SWARAS[i]}! Next one...`);
              timers.push(setTimeout(newRound, 1100));
            } else {
              E.playMidi(base() + OFFS[i]);
              ctx.status(`Not quite. That button was ${SWARAS[i]}. Listen again and compare.`);
            }
          }
          ctx.$('.again').onclick = () => { if (target < 0) newRound(); else play(); };
          ctx.keys(e => { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0 && i < 7) answer(i); });
          ctx.status('Press "Play again" to hear the first one.');
          ctx.$('.again').textContent = '▶ Start';
          const again = ctx.$('.again');
          again.addEventListener('click', () => { again.textContent = '▶ Play again'; }, { once: true });
        },
      },
      {
        title: 'Climb down: Sa\' Ni Dha Pa Ma Ga Re Sa',
        html: `<p>Going up is called <b>aaroh</b>. Coming down is <b>avroh</b>. Let's come back home, from high Sa' down to Sa.</p>
          <div class="task">Play Sa' Ni Dha Pa Ma Ga Re Sa in order. Follow the blue glow.</div>
          <div class="seq" style="margin:8px 0"></div><div class="padwrap"></div><div class="fbwrap"></div>`,
        mount(ctx) { sequenceTask(ctx, [7, 6, 5, 4, 3, 2, 1, 0], 'Back home on Sa. Feel how restful that last note is? That is what "home" means.'); },
      },
      {
        title: 'Quick quiz',
        html: `<p>Let's check what stuck. Answer all of these to finish the lesson.</p><div class="qz"></div>`,
        mount(ctx) {
          ctx.quiz(ctx.$('.qz'), [
            { q: 'If Sa = C, which note is Pa?', options: ['E', 'F', 'G', 'A'], answer: 2,
              explain: 'Sa Re Ga Ma Pa = C D E F G. Pa is G, 7 semitones up.' },
            { q: 'What is the pattern of the major scale (Bilawal)?', options: ['T T T S T T S', 'T T S T T T S', 'T S T T S T T', 'S T T S T T T'], answer: 1,
              explain: 'Tone, tone, semitone, tone, tone, tone, semitone.' },
            { q: 'Which two swaras are always fixed (never komal or tivra)?', options: ['Re and Ga', 'Ma and Ni', 'Sa and Pa', 'Ga and Dha'], answer: 2,
              explain: 'Sa and Pa are achal, they never change.' },
            { q: 'What does "komal" mean?', options: ['One semitone lower (flat)', 'One semitone higher (sharp)', 'One octave higher', 'Louder'], answer: 0,
              explain: 'Komal = soft/flat. Re, Ga, Dha and Ni can be komal.' },
            { q: 'Which swara can be tivra?', options: ['Sa', 'Ma', 'Pa', 'Ni'], answer: 1,
              explain: "Only Ma can be tivra (Ma'), one semitone higher." },
            { q: 'Can a singer choose D as their Sa?', options: ['No, Sa is always C', 'Yes, Sa is just "home" and can be any note'], answer: 1,
              explain: 'Sa is movable. Pick whatever suits your voice or song.' },
          ]);
        },
      },
    ],
  });
})();
