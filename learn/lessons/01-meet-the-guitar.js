// Lesson 1: Meet the Guitar. Parts, posture, hands, the six strings, frets, tuning.
(() => {
  // Inline SVG diagram of an acoustic guitar lying on its side (headstock on the left,
  // just like the on-screen fretboard used in later steps).
  const strings = [0, 1, 2, 3, 4, 5].map(i => {
    const y = 112 + i * 7, w = (0.8 + i * 0.35).toFixed(2);
    return `<line x1="70" y1="${y}" x2="610" y2="${y}" stroke="#e6e6e6" stroke-width="${w}"/>`;
  }).join('');
  const frets = Array.from({ length: 12 }, (_, i) => {
    const x = 150 + i * 22;
    return `<line x1="${x}" y1="106" x2="${x}" y2="154" stroke="#c9c9c9" stroke-width="2"/>`;
  }).join('');
  const pegs = [0, 1, 2].map(i => {
    const x = 40 + i * 30;
    return `<circle cx="${x}" cy="94" r="7" fill="#d9d9d9"/><circle cx="${x}" cy="166" r="7" fill="#d9d9d9"/>`;
  }).join('');
  const label = (x1, y1, x2, y2, text) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffd54a" stroke-width="1.5"/>` +
    `<circle cx="${x1}" cy="${y1}" r="3" fill="#ffd54a"/>` +
    `<text x="${x2}" y="${y2 + (y2 < y1 ? -6 : 16)}" fill="#fff" font-size="15" font-weight="600" text-anchor="middle">${text}</text>`;

  const DIAGRAM = `
  <div style="overflow-x:auto;margin:10px 0">
  <svg viewBox="0 0 760 295" width="100%" style="max-width:760px;min-width:520px;display:block"
       role="img" aria-label="Labelled diagram of a guitar">
    <!-- headstock -->
    <path d="M20 100 L130 106 L130 154 L20 160 Z" fill="#3b2412" stroke="#1d1209" stroke-width="2"/>
    ${pegs}
    <!-- neck -->
    <rect x="130" y="106" width="290" height="48" fill="#5a3a22" stroke="#2a1a0e" stroke-width="2"/>
    <rect x="128" y="104" width="6" height="52" fill="#eee"/>
    ${frets}
    <!-- body: two overlapping round shapes -->
    <ellipse cx="490" cy="130" rx="95" ry="85" fill="#c7843f" stroke="#5a3519" stroke-width="3"/>
    <ellipse cx="640" cy="130" rx="110" ry="105" fill="#c7843f" stroke="#5a3519" stroke-width="3"/>
    <ellipse cx="490" cy="130" rx="92" ry="82" fill="#c7843f"/>
    <!-- soundhole -->
    <circle cx="520" cy="130" r="32" fill="#1a0f07" stroke="#3b2412" stroke-width="4"/>
    <!-- bridge -->
    <rect x="602" y="104" width="16" height="52" rx="3" fill="#2a1a0e"/>
    ${strings}
    <!-- labels -->
    ${label(40, 94, 60, 40, 'Tuning pegs')}
    ${label(75, 150, 75, 230, 'Headstock')}
    ${label(230, 106, 230, 40, 'Frets (metal lines)')}
    ${label(330, 154, 330, 230, 'Neck')}
    ${label(560, 120, 470, 40, 'Strings (6)')}
    ${label(520, 150, 500, 245, 'Soundhole')}
    ${label(610, 156, 640, 260, 'Bridge')}
    ${label(700, 80, 700, 28, 'Body')}
  </svg></div>`;

  // Small helper: row of six tick boxes for the "pluck all strings" step.
  const tickRow = () => [5, 4, 3, 2, 1, 0].map(s =>
    `<span class="pill" data-s="${s}" style="cursor:default">${Engine.NAMES[s]} <small>(string ${s + 1})</small> <b class="tk">·</b></span>`
  ).join('');

  Lessons.register({
    id: 'meet-the-guitar',
    order: 1,
    title: 'Meet the Guitar',
    minutes: 6,
    steps: [
      {
        title: 'The parts of a guitar',
        html: `<p>Welcome! Before playing, let's learn the names of the parts. You'll hear these words in every lesson.</p>
          ${DIAGRAM}
          <ul>
            <li><b>Body</b>: the big hollow wooden box. It makes the sound louder, like the round part of a tanpura.</li>
            <li><b>Soundhole</b>: the round hole in the body. The sound comes out here.</li>
            <li><b>Bridge</b>: the strip on the body where the strings are tied down.</li>
            <li><b>Neck</b>: the long thin part. Your left hand lives here.</li>
            <li><b>Frets</b>: thin metal lines across the neck. More on these soon.</li>
            <li><b>Headstock</b>: the end of the neck, farthest from the body.</li>
            <li><b>Tuning pegs</b>: the knobs on the headstock. Turning them makes a string tighter or looser.</li>
            <li><b>Strings</b>: six metal wires. You make sound by plucking them.</li>
          </ul>
          <div class="tip">Don't worry about memorising all of this now. We'll repeat each word when we use it.</div>`,
      },
      {
        title: 'How to sit and hold it',
        html: `<p>Sit on a chair <b>without arms</b>. Keep your back straight and your feet flat on the floor.</p>
          <ul>
            <li>Rest the dip in the body (the "waist") on your <b>right leg</b>.</li>
            <li>The neck points to your <b>left</b>, tilted up a little.</li>
            <li>Let your right forearm rest on top of the body, so the guitar can't slide away.</li>
          </ul>
          <h3>Right hand: makes the sound</h3>
          <p>Your right hand <b>plucks</b> (pulls and lets go) or <b>strums</b> (brushes across all strings) near the soundhole.
          Use your thumb, or a <b>pick</b>: a small flat triangle of plastic held between thumb and the side of your index finger.</p>
          <h3>Left hand: chooses the notes</h3>
          <p>Your left hand presses strings on the neck. Guitarists number the fingers:</p>
          <p><span class="pill">Index = 1</span><span class="pill">Middle = 2</span><span class="pill">Ring = 3</span><span class="pill">Pinky = 4</span></p>
          <p>Your left <b>thumb</b> stays <b>behind the neck</b>, roughly behind your middle finger, like a gentle clamp. Don't squeeze hard.</p>
          <div class="tip">Left-handed? Many players simply flip everything: guitar on the left leg, right hand on the neck. Both are fine.</div>`,
      },
      {
        title: 'The six strings',
        html: `<p>The strings are different thicknesses. From the <b>thickest</b> to the <b>thinnest</b>, their names are:</p>
          <p style="font-size:22px;font-weight:700;letter-spacing:6px">E &nbsp;A &nbsp;D &nbsp;G &nbsp;B &nbsp;e</p>
          <p>Remember them with: <b>E</b>ddie <b>A</b>te <b>D</b>ynamite, <b>G</b>ood <b>B</b>ye <b>E</b>ddie.</p>
          <p>There are two E strings. We write the thick one as big <b>E</b> and the thin one as small <b>e</b>.</p>
          <h3>Which one is "string 1"?</h3>
          <p>Strings are also numbered, and the numbering starts from the <b>thin</b> one:</p>
          <ul>
            <li><b>String 1</b> = thin <b>e</b> (closest to the floor when you hold the guitar)</li>
            <li><b>String 6</b> = thick <b>E</b> (closest to your face)</li>
          </ul>
          <div class="tip">On the screen in these lessons, the thin <b>e</b> string is at the <b>top</b> and the thick <b>E</b> is at the bottom. That's how it looks if you tilt the guitar up and look down at the neck while you play, and it's the same way guitar tabs are written.</div>`,
      },
      {
        title: 'Pluck every string',
        html: `<p>Plucking a string without pressing anything is called playing it <b>open</b>.</p>
          <div class="task">Click the <b>left edge</b> (the name, next to the white bar) of each string to pluck all six open strings.</div>
          <div id="fb"></div>
          <div id="ticks" style="margin-top:8px"></div>`,
        mount(ctx) {
          const done = new Set();
          ctx.$('#ticks').innerHTML = tickRow();
          ctx.mountFretboard(ctx.$('#fb'), {
            frets: 5, labels: 'none',
            onPress({ s, f }) {
              if (f !== 0) { ctx.status('That one was pressed at a fret. Click the open string (the name on the left).'); return; }
              done.add(s);
              const pill = ctx.$(`[data-s="${s}"]`);
              pill.classList.add('on'); pill.querySelector('.tk').textContent = '✓';
              if (done.size === 6) {
                ctx.status('All six strings plucked! Notice how the sound changed from string to string.');
                ctx.complete();
              } else {
                ctx.status(`String ${s + 1} (${Engine.NAMES[s]}): ${done.size} of 6 done.`);
              }
            },
          });
        },
      },
      {
        title: 'Thick = low, thin = high',
        html: `<p>Did you hear it? The <b>thick</b> strings sound <b>low</b> (deep, like a big drum). The <b>thin</b> strings sound <b>high</b> (bright, like a bird).</p>
          <p><b>Why?</b> A heavy string vibrates (shakes back and forth) slowly. Slow shaking = a low sound. A light string shakes fast. Fast shaking = a high sound.</p>
          <p>This is just like singing: a low <b>Sa</b> versus a high <b>Sa'</b> (the Sa one octave up).</p>
          <div class="task">Try it: compare the lowest and highest string.</div>
          <p><button class="pill" id="low">Thick E (low)</button> <button class="pill" id="high">Thin e (high)</button></p>`,
        required: false,
        mount(ctx) {
          ctx.$('#low').onclick = () => Engine.playMidi(Engine.OPEN[5]);
          ctx.$('#high').onclick = () => Engine.playMidi(Engine.OPEN[0]);
          ctx.complete();
        },
      },
      {
        title: 'What is a fret?',
        html: `<p>A <b>fret</b> is one of the metal lines across the neck. The space between two frets is also called a fret: "fret 1" is the space nearest the headstock, then fret 2, and so on.</p>
          <p>When you press a string just <b>behind</b> a fret (on the headstock side of it), the string can only vibrate from that fret down to the bridge.
          A <b>shorter</b> vibrating string shakes faster, so the note goes <b>higher</b>. Each fret is one small step up, called a <b>semitone</b> (the smallest step in music, like Sa to re).</p>
          <div class="task">On the <b>G string</b> (string 3, gold), click fret 1, 2, 3, 4 and 5 one by one. Listen to the note rise.</div>
          <div id="fb"></div>`,
        mount(ctx) {
          const S = 2, played = new Set();
          let fb = null;
          fb = ctx.mountFretboard(ctx.$('#fb'), {
            frets: 7, labels: 'none',
            onPress({ s, f, midi }) {
              const name = `${Engine.pitchName(midi)} (${Engine.sargamOf(midi)} if Sa = C)`;
              if (s !== S) { ctx.status(`That was string ${s + 1}. Try the gold G string (string 3).`); return; }
              if (f === 0) { ctx.status(`Open G string: ${name}. Now press fret 1.`); return; }
              fb.mark(s, f, f);
              if (f <= 5) { played.add(f); fb.unhighlight(s, f); fb.highlight(s, f, 'green'); }
              const left = [1, 2, 3, 4, 5].filter(x => !played.has(x));
              if (!left.length) {
                ctx.status(`Fret ${f}: ${name}. You heard it: every fret makes the note a little higher!`);
                ctx.complete();
              } else {
                ctx.status(`Fret ${f}: ${name}. Still to try: fret ${left.join(', ')}.`);
              }
            },
          });
          for (let f = 0; f <= 5; f++) fb.highlight(S, f, 'gold');
        },
      },
      {
        title: 'Tuning (keeping strings in tune)',
        html: `<p><b>Tuning</b> means adjusting each string so it plays exactly the right note. You do it by turning the <b>tuning pegs</b>: tighter = higher, looser = lower.</p>
          <p><b>Why does a guitar go out of tune?</b> Strings slowly stretch, wood reacts to heat and humidity (moisture in the air), and new strings stretch a lot in their first days. So check your tuning every time you pick up the guitar.</p>
          <p><b>Standard tuning</b> is the normal setting, thickest to thinnest: <b>E A D G B e</b>, the same names you just learned.</p>
          <div class="tip">Get a free <b>tuner app</b> on your phone (search "guitar tuner" in your app store; GuitarTuna and Fender Tune are popular free ones). Pluck one string, and the app tells you whether to turn the peg tighter or looser. Turn slowly, a little at a time, so you don't snap a string.</div>
          <p>The sounds in these lessons are always perfectly in tune, so you can also use them to compare.</p>`,
      },
      {
        title: 'Quick check',
        html: `<p>Let's see what stuck. Answer all four to finish the lesson.</p><div id="quiz"></div>`,
        mount(ctx) {
          ctx.quiz(ctx.$('#quiz'), [
            {
              q: 'What are the string names, from thickest to thinnest?',
              options: ['E B G D A e', 'E A D G B e', 'A B C D E F'],
              answer: 1,
              explain: 'Eddie Ate Dynamite, Good Bye Eddie: E A D G B e.',
            },
            {
              q: 'Which string is called "string 1"?',
              options: ['The thick E string', 'The thin e string', 'The G string'],
              answer: 1,
              explain: 'Numbering starts from the thin e. The thick E is string 6.',
            },
            {
              q: 'What happens when you press a string behind a higher fret?',
              options: ['The note gets lower', 'The note stays the same', 'The note gets higher'],
              answer: 2,
              explain: 'The vibrating part of the string gets shorter, so it shakes faster and sounds higher.',
            },
            {
              q: 'Which left-hand finger is finger 3?',
              options: ['Index', 'Ring', 'Pinky'],
              answer: 1,
              explain: 'Index = 1, Middle = 2, Ring = 3, Pinky = 4. The thumb stays behind the neck.',
            },
          ]);
        },
      },
    ],
  });
})();
