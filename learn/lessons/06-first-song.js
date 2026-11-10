// Lesson 6: Play Your First Song (capstone). "Twinkle Twinkle Little Star" (traditional, public domain).
(() => {
  const E = Engine;

  // ---- Song data: [swara offset in semitones from Sa, beats] ----
  const L1 = [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2]];   // Sa Sa Pa Pa Dha Dha Pa
  const L2 = [[5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]];   // Ma Ma Ga Ga Re Re Sa
  const L3 = [[7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2]];   // Pa Pa Ma Ma Ga Ga Re
  const LINES = [L1, L2, L3, L3, L1, L2];
  const SONG = [];
  { let beat = 0; LINES.forEach((ln, li) => ln.forEach(([off, beats]) => { SONG.push({ off, beats, line: li, beat }); beat += beats; })); }
  const SONG_BEATS = SONG.reduce((a, n) => a + n.beats, 0);          // 48 beats = 12 bars of 4
  const startsAt = {}; SONG.forEach((n, i) => { startsAt[n.beat] = i; });

  const SW = { 0: 'Sa', 2: 'Re', 4: 'Ga', 5: 'Ma', 7: 'Pa', 9: 'Dha', 11: 'Ni', 12: "Sa'" };
  const KEYMAP = { KeyA: 0, KeyS: 2, KeyD: 4, KeyF: 5, KeyG: 7, KeyH: 9, KeyJ: 11, KeyK: 12 };
  const KEYOF = { 0: 'A', 2: 'S', 4: 'D', 5: 'F', 7: 'G', 9: 'H', 11: 'J', 12: 'K' };

  const midiOf = off => 60 + E.state.saPc + off;
  const sameNote = (a, b) => (((a - b) % 12) + 12) % 12 === 0;
  // A comfortable mid-neck spot for a note: fret 4-12, closest to fret 7.
  function pos(midi) {
    let best = null;
    for (let s = 5; s >= 0; s--) {
      const f = midi - E.OPEN[s];
      if (f < 4 || f > 12) continue;
      const d = Math.abs(f - 7);
      if (!best || d < best.d) best = { s, f, d };
    }
    if (!best) for (let s = 5; s >= 0; s--) { const f = midi - E.OPEN[s]; if (f >= 0 && f <= 12) { best = { s, f }; break; } }
    return best;
  }

  const CSS = `<style>
    .fs-song{margin:12px 0;line-height:2.1}
    .fs-line{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:2px 0}
    .fs-line small{width:56px;opacity:.6}
    .fs-syl{display:inline-block;min-width:44px;text-align:center;padding:2px 6px;border-radius:6px;background:#3a2a1c;transition:all .12s}
    .fs-syl em{display:block;font-style:normal;font-size:11px;opacity:.6;line-height:1.1}
    .fs-syl.hold{min-width:70px}
    .fs-syl.cur{background:#7ddc7d;color:#111;font-weight:700;transform:scale(1.18)}
    .fs-syl.done{opacity:.45}
    .fs-syl.miss{background:#5a2a2a}
    .fs-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
    .fs-big{font-size:26px;font-weight:700;margin:8px 0}
    .fs-check label{display:block;margin:6px 0;cursor:pointer}
  </style>`;
  const KEYS_HELP = '<div class="tip">Keyboard: <b>A</b>=Sa <b>S</b>=Re <b>D</b>=Ga <b>F</b>=Ma <b>G</b>=Pa <b>H</b>=Dha <b>J</b>=Ni <b>K</b>=Sa\'. Or click the green spot on the fretboard.</div>';

  // Sargam "sheet" with the current note emphasised.
  function songView(target) {
    const box = document.createElement('div'); box.className = 'fs-song';
    const spans = [];
    LINES.forEach((ln, li) => {
      const row = document.createElement('div'); row.className = 'fs-line';
      row.innerHTML = `<small>Line ${li + 1}</small>`;
      box.appendChild(row);
      SONG.forEach((n, i) => {
        if (n.line !== li) return;
        const sp = document.createElement('span');
        sp.className = 'fs-syl' + (n.beats > 1 ? ' hold' : '');
        sp.innerHTML = SW[n.off] + (n.beats > 1 ? ' –' : '') + `<em>${E.pitchName(midiOf(n.off))}</em>`;
        row.appendChild(sp); spans[i] = sp;
      });
    });
    target.appendChild(box);
    return {
      setCur(i) { spans.forEach((s, k) => s.classList.toggle('cur', k === i)); },
      done(i) { spans[i] && spans[i].classList.add('done'); },
      miss(i) { spans[i] && spans[i].classList.add('miss'); },
      reset() { spans.forEach(s => s.classList.remove('cur', 'done', 'miss')); },
    };
  }

  function timers() {
    let ids = [];
    return { add(fn, ms) { ids.push(setTimeout(fn, ms)); }, clear() { ids.forEach(clearTimeout); ids = []; } };
  }

  // Strum-along chords: one chord per 2 beats, written for Sa = C.
  const CH_SEQ = ['C', 'C', 'Am', 'C', 'G', 'C', 'G', 'C', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'C', 'Am', 'C', 'G', 'C', 'G', 'C'];

  Lessons.register({
    id: 'first-song', order: 6, title: 'Play Your First Song', minutes: 10,
    steps: [
      {
        title: 'Your first song: Twinkle Twinkle Little Star',
        html: `<p>You made it to the last lesson! Now we put everything together and play a real song.</p>
          <p>We'll play <b>"Twinkle Twinkle Little Star"</b>. It's a very old folk tune. Nobody owns it any more
          (we say it's in the <b>public domain</b>), so anyone can play it freely.</p>
          <p>A <b>melody</b> is the tune you could sing or hum: one note at a time. Here is the melody in sargam:</p>
          <div class="task">
          <b>Line 1:</b> Sa Sa Pa Pa Dha Dha Pa –<br>
          <b>Line 2:</b> Ma Ma Ga Ga Re Re Sa –<br>
          <b>Line 3:</b> Pa Pa Ma Ma Ga Ga Re –<br>
          <b>Line 4:</b> Pa Pa Ma Ma Ga Ga Re –<br>
          <b>Line 5:</b> (same as line 1)<br>
          <b>Line 6:</b> (same as line 2)</div>
          <p>The dash "–" means <b>hold</b> that note a little longer (2 beats instead of 1).</p>
          <div class="tip">Only six swaras: Sa Re Ga Ma Pa Dha. With Sa = C these are C D E F G A. Try singing it in your head:
          "Twin-kle twin-kle lit-tle star" = Sa Sa Pa Pa Dha Dha Pa.</div>
          <button class="btn" id="hear">▶ Hear it once</button>`,
        mount(ctx) {
          const t = timers(); ctx.onCleanup(t.clear);
          ctx.$('#hear').onclick = () => {
            t.clear();
            const spb = 60 / 90; let at = 0;
            SONG.forEach(n => { E.playMidi(midiOf(n.off), at); at += n.beats * spb; });
            ctx.status('Listen: notice how lines 1 and 5 sound the same, and the song ends on Sa (home).');
          };
          ctx.complete();
        },
      },
      {
        title: 'Find the six notes',
        html: `${CSS}<p>Before playing the song, let's find its notes. We'll play in the <b>middle of the neck</b>
          (around frets 5 to 10). Why there? The notes sit close together, so your hand barely has to move.</p>
          <p>The <b>green spots</b> are the six notes of the song. The fretboard is labelled in sargam.</p>
          <div class="task">Play each note once: click its green spot, or press its key. Each one lights up below when found.</div>
          <div class="fs-row" id="found"></div>
          ${KEYS_HELP}<div id="fb"></div>`,
        mount(ctx) {
          const offs = [0, 2, 4, 5, 7, 9], got = new Set();
          const found = ctx.$('#found');
          offs.forEach(o => { found.insertAdjacentHTML('beforeend', `<span class="pill" data-o="${o}">${SW[o]} (${E.pitchName(midiOf(o))}) · key ${KEYOF[o]}</span>`); });
          const fb = ctx.mountFretboard(ctx.$('#fb'), { labels: 'sargam', onPress: ({ midi }) => hit(midi) });
          offs.forEach(o => { const p = pos(midiOf(o)); fb.highlight(p.s, p.f, 'green'); });
          function hit(midi) {
            const o = offs.find(x => sameNote(midiOf(x), midi));
            if (o === undefined) { ctx.status(`That's ${E.sargamOf(midi)}. This song doesn't use it. Try a green spot.`); return; }
            got.add(o);
            found.querySelector(`[data-o="${o}"]`).classList.add('on');
            if (got.size === offs.length) { ctx.status('All six found! Sa Re Ga Ma Pa Dha: that is all you need.'); ctx.complete(); }
            else ctx.status(`${SW[o]} found. ${offs.length - got.size} to go.`);
          }
          ctx.keys(e => {
            if (!(e.code in KEYMAP)) return;
            const p = pos(midiOf(KEYMAP[e.code])); fb.press(p.s, p.f);
          });
        },
      },
      {
        title: 'Play it, one note at a time',
        html: `${CSS}<p>This is <b>wait mode</b>. There is no clock and no rush. The app waits for you to play the right note.</p>
          <p>The next note glows <b>green</b> on the fretboard and in the sargam below. Play it, and the next one lights up.</p>
          <div class="task">Play the whole song from start to finish. Wrong note? No problem, you'll get a hint and can try again.</div>
          <div class="fs-row"><button class="btn" id="listen">▶ Listen slowly</button><button class="btn ghost" id="restart">↺ Start over</button></div>
          <div id="song"></div>${KEYS_HELP}<div id="fb"></div>`,
        mount(ctx) {
          const view = songView(ctx.$('#song'));
          const t = timers(); ctx.onCleanup(t.clear);
          let i = 0, listening = false, finished = false;
          const fb = ctx.mountFretboard(ctx.$('#fb'), { labels: 'sargam', onPress: ({ s, f, midi }) => input(s, f, midi) });

          function showTarget() {
            fb.clearHighlights();
            if (i >= SONG.length) { view.setCur(-1); return; }
            const p = pos(midiOf(SONG[i].off));
            fb.highlight(p.s, p.f, 'green'); view.setCur(i);
          }
          function input(s, f, midi) {
            if (listening || i >= SONG.length) return;
            const n = SONG[i];
            if (sameNote(midi, midiOf(n.off))) {
              view.done(i); i++;
              if (i >= SONG.length) {
                showTarget();
                ctx.status('🎉 You played the whole song! Twinkle Twinkle Little Star, by you.');
                if (!finished) { finished = true; ctx.complete(); }
                return;
              }
              const nx = SONG[i];
              if (nx.line !== n.line) ctx.status(`Line ${n.line + 1} done! On to line ${nx.line + 1}.`);
              else ctx.status(`Good! Next: ${SW[nx.off]}.`);
              showTarget();
            } else {
              ctx.status(`That was ${E.sargamOf(midi)}. We need ${SW[n.off]}: press ${KEYOF[n.off]} or click the green spot.`);
              fb.highlight(s, f, 'blue');
              t.add(() => { fb.unhighlight(s, f); showTarget(); }, 450);
            }
          }
          ctx.keys(e => {
            if (!(e.code in KEYMAP)) return;
            const p = pos(midiOf(KEYMAP[e.code])); fb.press(p.s, p.f);
          });
          ctx.$('#restart').onclick = () => { t.clear(); listening = false; i = 0; view.reset(); showTarget(); ctx.status('From the top! Start with Sa.'); };
          ctx.$('#listen').onclick = () => {
            t.clear(); listening = true;
            const spb = 60 / 66; let at = 0.1;
            ctx.status('Listening… follow the moving highlight.');
            SONG.forEach((n, k) => {
              const m = midiOf(n.off), p = pos(m);
              E.playMidi(m, at);
              t.add(() => { fb.clearHighlights(); fb.highlight(p.s, p.f, 'gold'); fb.flashString(p.s); view.setCur(k); }, at * 1000);
              at += n.beats * spb;
            });
            t.add(() => { listening = false; showTarget(); ctx.status(i ? 'Your turn again: carry on from where you were.' : 'Your turn! Start with Sa.'); }, at * 1000 + 200);
          };
          showTarget();
          ctx.status('Start with Sa (key A).');
        },
      },
      {
        title: 'Adding rhythm',
        html: `<p>So far you played the right notes at <i>your</i> speed. Real songs also have <b>rhythm</b>: each note
          happens at a certain moment.</p>
          <p>Remember the <b>beat</b> from lesson 4? It's the steady pulse you tap your foot to. The <b>metronome</b> clicks on every beat.
          <b>BPM</b> means beats per minute: 60 BPM is one click every second.</p>
          <p>In this song:</p>
          <ul><li>Most notes last <b>1 beat</b>: play one note on each click.</li>
          <li>The last note of every line ("Pa –", "Sa –", "Re –") lasts <b>2 beats</b>: play it, then let it ring through the next click.</li></ul>
          <p>So every line is exactly 8 beats long, two bars of 4. That regular shape is why the song feels so easy to sing.</p>
          <div class="tip">You'll hear 4 clicks first: a <b>count-in</b>. Count "1, 2, 3, 4" in your head, then start on the next click.</div>`,
      },
      {
        title: 'Rhythm mode: play with the metronome',
        html: `${CSS}<p>Now play the song <b>in time</b>. Each note is due on a click. Don't worry about being perfect:
          a note counts if it's roughly on time and the right swara.</p>
          <div class="task">Score <b>60% or more</b> to pass (or just give it 3 tries). Start slow!</div>
          <div class="fs-row">Speed: <input type="range" id="bpm" min="50" max="100" value="60"> <b id="bpmv">60</b> BPM
          <label><input type="checkbox" id="guide"> play the tune with me</label></div>
          <div class="fs-row"><button class="btn" id="go">▶ Start</button><span id="info"></span></div>
          <div class="beats"><i>1</i><i>2</i><i>3</i><i>4</i></div>
          <div class="fs-big" id="score"></div>
          <div id="song"></div>${KEYS_HELP}<div id="fb"></div>`,
        mount(ctx) {
          const view = songView(ctx.$('#song'));
          const bpmIn = ctx.$('#bpm'), go = ctx.$('#go'), info = ctx.$('#info'), score = ctx.$('#score'), dots = ctx.$$('.beats i');
          const COUNT = 4;
          let bpm = 60, tries = 0, running = false, t0 = 0, spb = 1, judged = [], hits = 0;
          bpmIn.oninput = () => { bpm = +bpmIn.value; ctx.$('#bpmv').textContent = bpm; };
          const fb = ctx.mountFretboard(ctx.$('#fb'), { labels: 'sargam', onPress: ({ midi }) => input(midi) });
          const due = i => t0 + (COUNT + SONG[i].beat) * spb;
          const met = ctx.metronome(bpm, onBeat);

          function onBeat(b, total) {
            if (!running) return;
            dots.forEach((d, k) => d.classList.toggle('on', k === b));
            if (total < COUNT) { info.textContent = 'Count-in: ' + (total + 1); fb.clearHighlights(); return; }
            const beat = total - COUNT;
            if (beat >= SONG_BEATS + 1) { finish(); return; }
            info.textContent = 'Play!';
            if (beat in startsAt) {
              const k = startsAt[beat], p = pos(midiOf(SONG[k].off));
              fb.clearHighlights(); fb.highlight(p.s, p.f, 'green'); view.setCur(k);
              if (ctx.$('#guide').checked) E.playMidi(midiOf(SONG[k].off));
              // anything more than a window behind is now a miss
              for (let j = 0; j < k; j++) if (!judged[j] && E.ac.currentTime - due(j) > win()) { judged[j] = 'miss'; view.miss(j); }
            }
          }
          const win = () => Math.max(0.2, spb * 0.4);
          function input(midi) {
            if (!running) return;
            const now = E.ac.currentTime;
            let best = -1, bd = Infinity;
            SONG.forEach((n, k) => { if (judged[k]) return; const d = Math.abs(now - due(k)); if (d < bd) { bd = d; best = k; } });
            if (best < 0 || bd > win()) { info.textContent = now < (best >= 0 ? due(best) : 0) ? 'A little early…' : 'A little late…'; return; }
            if (sameNote(midi, midiOf(SONG[best].off))) {
              judged[best] = 'hit'; hits++; view.done(best); info.textContent = 'Nice!';
            } else info.textContent = `Oops, that was ${E.sargamOf(midi)}. Need ${SW[SONG[best].off]}.`;
          }
          function finish() {
            running = false; met.stop(); tries++;
            dots.forEach(d => d.classList.remove('on')); fb.clearHighlights(); view.setCur(-1);
            const pct = Math.round((hits / SONG.length) * 100);
            score.textContent = `Accuracy: ${pct}%  (${hits} of ${SONG.length} notes)`;
            go.textContent = '▶ Try again'; bpmIn.disabled = false; info.textContent = `Try ${tries}`;
            if (pct >= 60) { ctx.status(`🎉 ${pct}%! You played a song in time. That's real music.`); ctx.complete(); }
            else if (tries >= 3) { ctx.status(`${pct}%. Good effort! Rhythm takes practice, so you can move on and come back any time.`); ctx.complete(); }
            else ctx.status(`${pct}%. Try a slower speed, or tick "play the tune with me". ${3 - tries} more tries to unlock Next.`);
          }
          go.onclick = () => {
            if (running) { running = false; met.stop(); go.textContent = '▶ Start'; bpmIn.disabled = false; info.textContent = 'Stopped.'; return; }
            spb = 60 / bpm; judged = []; hits = 0; view.reset(); score.textContent = '';
            met.setBpm(bpm); bpmIn.disabled = true; go.textContent = '■ Stop'; running = true;
            t0 = E.ac.currentTime + 0.1;          // the metronome's first click lands here
            met.start();
          };
          ctx.keys(e => {
            if (!(e.code in KEYMAP)) return;
            const p = pos(midiOf(KEYMAP[e.code])); fb.press(p.s, p.f);
          });
          ctx.onCleanup(() => { running = false; });
        },
      },
      {
        title: 'Strum along (bonus)',
        required: false,
        html: `${CSS}<p>Guitarists often play <b>chords</b> while someone sings the melody. That's called <b>accompaniment</b>.</p>
          <p>Here the app plays the tune and you <b>strum the chords</b> you learned in lesson 5. We play in Sa = C here so the chords fit.
          The song uses just three: <b>C</b>, <b>G</b> and <b>Am</b>. Each chord lasts 2 beats.</p>
          <div class="task">Press <b>Space</b> to strum one down-strum on each click. Watch the chord name: it changes as the song goes.
          This step is optional, so have fun with it.</div>
          <div class="fs-row"><button class="btn" id="go">▶ Start (60 BPM)</button>
          <label><input type="checkbox" id="app" checked> app strums too</label><span id="info"></span></div>
          <div class="beats"><i>1</i><i>2</i><i>3</i><i>4</i></div>
          <div class="fs-big">Chord: <span id="ch">C</span> <small id="nx" style="opacity:.6;font-size:15px"></small></div>
          <div id="fb"></div>`,
        mount(ctx) {
          const go = ctx.$('#go'), info = ctx.$('#info'), chEl = ctx.$('#ch'), nxEl = ctx.$('#nx'), dots = ctx.$$('.beats i');
          const fb = ctx.mountFretboard(ctx.$('#fb'), { sound: true });
          const COUNT = 4, spb = 1;
          let running = false, t0 = 0, cur = 'C', onBeatStrums = 0, strums = 0;
          fb.showChord(ctx.CHORDS.C);
          const met = ctx.metronome(60, (b, total) => {
            if (!running) return;
            dots.forEach((d, k) => d.classList.toggle('on', k === b));
            const beat = total - COUNT;
            if (beat < 0) { info.textContent = 'Count-in: ' + (total + 1); return; }
            if (beat >= SONG_BEATS) { stop(true); return; }
            const ch = CH_SEQ[Math.floor(beat / 2)], nx = CH_SEQ[Math.floor(beat / 2) + 1];
            if (ch !== cur || beat === 0) { cur = ch; fb.showChord(ctx.CHORDS[ch]); }
            chEl.textContent = ch; nxEl.textContent = nx && nx !== ch ? `next: ${nx}` : '';
            info.textContent = 'Strum!';
            if (ctx.$('#app').checked) fb.strumChord(ctx.CHORDS[ch]);
            if (beat in startsAt) E.playMidi(60 + SONG[startsAt[beat]].off);   // melody in C
          });
          function stop(done) {
            running = false; met.stop(); go.textContent = '▶ Start (60 BPM)'; dots.forEach(d => d.classList.remove('on'));
            if (done) {
              info.textContent = '';
              ctx.status(`Song over! ${onBeatStrums} of your ${strums} strums were on the beat. Try unticking "app strums too" and lead it yourself.`);
              ctx.complete();
            } else info.textContent = 'Stopped.';
          }
          go.onclick = () => {
            if (running) { stop(false); return; }
            onBeatStrums = 0; strums = 0; cur = 'C'; fb.showChord(ctx.CHORDS.C); chEl.textContent = 'C';
            running = true; go.textContent = '■ Stop'; t0 = E.ac.currentTime + 0.1; met.start();
          };
          ctx.keys(e => {
            if (e.code !== 'Space') return;
            e.preventDefault();
            fb.strumChord(ctx.CHORDS[cur]);
            if (!running) return;
            strums++;
            const rel = (E.ac.currentTime - t0) / spb, off = Math.abs(rel - Math.round(rel));
            if (off < 0.25) onBeatStrums++;
          });
          ctx.onCleanup(() => { running = false; });
        },
      },
      {
        title: 'Look how far you have come',
        html: `${CSS}<p>Six lessons ago you might not have known which string was which. Tick off everything you can now do:</p>
          <div class="fs-check task">
          <label><input type="checkbox"> <b>Lesson 1:</b> name the parts of the guitar and the 6 strings, thick to thin: E A D G B e</label>
          <label><input type="checkbox"> <b>Lesson 2:</b> understand frets: each fret raises a note by one semitone (one small step)</label>
          <label><input type="checkbox"> <b>Lesson 3:</b> play Sa Re Ga Ma Pa Dha Ni Sa', and connect it to C D E F G A B C</label>
          <label><input type="checkbox"> <b>Lesson 4:</b> keep a steady beat with the metronome and strum in rhythm</label>
          <label><input type="checkbox"> <b>Lesson 5:</b> play your first chords: Em, Am, C, G and D</label>
          <label><input type="checkbox"> <b>Lesson 6:</b> play a complete song, slowly, in time, and with chords</label>
          </div>
          <p id="all" style="display:none">✅ Every box ticked. You're officially a guitar player!</p>`,
        mount(ctx) {
          const boxes = ctx.$$('input[type=checkbox]');
          boxes.forEach(b => { b.onchange = () => { ctx.$('#all').style.display = boxes.every(x => x.checked) ? 'block' : 'none'; }; });
        },
        required: false,
      },
      {
        title: 'Congratulations! 🎉',
        html: `<p><b>You did it.</b> You went from zero to playing a real song on the guitar. Be proud of that!</p>
          <p>The free-play guitar is now yours: play any note, any chord, as long as you like.</p>
          <p><a class="btn" href="../index.html">🎸 Open the free-play Guitar →</a></p>
          <h3>What next?</h3>
          <ul>
            <li><b>Learn more chords:</b> Dm, E and A are already waiting in the chord list. More chords = more songs.</li>
            <li><b>The F chord:</b> it's a <b>barre chord</b>, where one finger presses several strings at once. It's hard at first for everyone; practise a little each day.</li>
            <li><b>New scales:</b> try <b>Bhairavi</b> (Sa re ga Ma Pa dha ni Sa', all komal swaras). It gives a soft, emotional mood.</li>
            <li><b>Practise 10 minutes a day:</b> a little every day beats one long session a week. Your fingers get stronger quickly.</li>
            <li><b>Use a tuner</b> before you play a real guitar, so the notes match what you learned here.</li>
            <li><b>Play songs you love:</b> work out their sargam by ear, one note at a time, just like you did with Twinkle.</li>
          </ul>
          <div class="tip">Press <b>Finish lesson ✓</b> below to mark the course complete.</div>`,
      },
    ],
  });
})();
