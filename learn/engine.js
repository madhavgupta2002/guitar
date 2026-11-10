// Shared audio engine, fretboard component and lesson registry. No dependencies.
const Lessons = { list: [], register(l) { this.list.push(l); } };

const Engine = (() => {
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const OPEN = [64, 59, 55, 50, 45, 40];          // string 0 = high e ... string 5 = low E (MIDI)
  const NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SARGAM = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', "Ma'", 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
  const state = { saPc: 0 };                      // pitch class of Sa (0 = C)

  const input = ac.createGain();
  let tail = input;
  [[100, 5, 1.2], [230, 4, 1.5], [1100, -2, 1], [2800, 3, 1]].forEach(([f, gain, q]) => {
    const b = ac.createBiquadFilter(); b.type = 'peaking';
    b.frequency.value = f; b.gain.value = gain; b.Q.value = q;
    tail.connect(b); tail = b;
  });
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  tail.connect(comp); comp.connect(ac.destination);
  const verb = ac.createConvolver();
  {
    const len = ac.sampleRate * 1.8, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    verb.buffer = ir;
  }
  const wet = ac.createGain(); wet.gain.value = .22;
  tail.connect(verb); verb.connect(wet); wet.connect(ac.destination);

  function synth(freq, vel = 1) {                 // Karplus-Strong, fractional-delay tuned
    const sr = ac.sampleRate, dur = 4;
    const D = sr / freq - 0.5, N = Math.floor(D), fr = D - N, a = (1 - fr) / (1 + fr);
    const ring = new Float32Array(N), noise = new Float32Array(N);
    let sm = 0;
    for (let i = 0; i < N; i++) { sm += 0.55 * ((Math.random() * 2 - 1) - sm); noise[i] = sm; }
    const off = Math.max(1, Math.round(N * 0.17));
    for (let i = 0; i < N; i++) ring[i] = (noise[i] - noise[(i + off) % N]) * vel;
    const g = Math.pow(0.001, 1 / (freq * 3.2));
    const buf = ac.createBuffer(1, sr * dur, sr), out = buf.getChannelData(0);
    let p = 0, prev = 0, ax = 0, ay = 0;
    for (let i = 0; i < out.length; i++) {
      const s = ring[p], lp = 0.5 * (s + prev); prev = s;
      const y = a * lp + ax - a * ay; ax = lp; ay = y;
      ring[p] = y * g; p = (p + 1) % N; out[i] = y;
    }
    let peak = 0; for (let i = 0; i < 20000; i++) peak = Math.max(peak, Math.abs(out[i]));
    const k = 0.7 / (peak || 1);
    for (let i = 0; i < out.length; i++) out[i] *= k;
    return buf;
  }

  const sargamOf = m => SARGAM[(((m - state.saPc) % 12) + 12) % 12];
  const noteName = m => NOTE[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const pitchName = m => NOTE[((m % 12) + 12) % 12];
  const midiOf = (s, f) => OPEN[s] + f;

  function playMidi(midi, when = 0) {
    if (ac.state === 'suspended') ac.resume();
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const src = ac.createBufferSource(); src.buffer = synth(freq, 0.85 + Math.random() * 0.15);
    const env = ac.createGain(), t = ac.currentTime + when;
    env.gain.setValueAtTime(1, t); env.gain.setTargetAtTime(0.0001, t + 3, 0.4);
    src.connect(env).connect(input); src.start(t);
  }

  function click(accent, when) {                  // metronome tick
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(0.35, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    o.connect(g).connect(ac.destination); o.start(when); o.stop(when + 0.06);
  }

  // metronome(bpm, onBeat(beatInBar, totalBeat), beatsPerBar) -> {start, stop, setBpm, running}
  function metronome(bpm = 80, onBeat = null, bpb = 4) {
    let timer = null, beat = 0, next = 0;
    const sched = () => {
      while (next < ac.currentTime + 0.15) {
        const b = beat, at = next;
        click(b % bpb === 0, at);
        setTimeout(() => onBeat && onBeat(b % bpb, b), Math.max(0, (at - ac.currentTime) * 1000));
        next += 60 / bpm; beat++;
      }
    };
    return {
      start() { if (timer) return; ac.resume(); beat = 0; next = ac.currentTime + 0.1; timer = setInterval(sched, 25); },
      stop() { clearInterval(timer); timer = null; },
      setBpm(v) { bpm = v; },
      get running() { return !!timer; },
    };
  }

  return { ac, OPEN, NAMES, NOTE, SARGAM, state, playMidi, sargamOf, noteName, pitchName, midiOf, metronome, click };
})();

// Chord shapes, listed low E -> high e. -1 = muted string.
const CHORDS = {
  Em: [0, 2, 2, 0, 0, 0], Am: [-1, 0, 2, 2, 1, 0], C: [-1, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3],
  D: [-1, -1, 0, 2, 3, 2], E: [0, 2, 2, 1, 0, 0], A: [-1, 0, 2, 2, 2, 0], Dm: [-1, -1, 0, 2, 3, 1],
};

const Fretboard = {
  // mount(el, {frets=12, labels:'none'|'note'|'sargam'|'fret', sound=true, onPress({s,f,midi})}) -> fb
  mount(el, opts = {}) {
    const o = Object.assign({ frets: 12, labels: 'none', sound: true, onPress: null }, opts);
    const NUT = 64, FW = 62, SH = 38, E = Engine;
    const scroll = document.createElement('div'); scroll.className = 'fb-scroll';
    const root = document.createElement('div'); root.className = 'fb';
    root.style.width = NUT + o.frets * FW + 16 + 'px'; root.style.height = SH * 6 + 'px';
    scroll.appendChild(root); el.appendChild(scroll);
    const add = (cls, css) => { const d = document.createElement('div'); d.className = cls; Object.assign(d.style, css); root.appendChild(d); return d; };

    add('fb-nut', { left: NUT - 6 + 'px' });
    for (let f = 1; f <= o.frets; f++) add('fb-fret', { left: NUT + f * FW - 1 + 'px' });
    [3, 5, 7, 9, 12, 15].filter(f => f <= o.frets).forEach(f => {
      const x = NUT + (f - 0.5) * FW - 7;
      if (f === 12) { add('fb-dot', { left: x + 'px', top: SH * 1.5 - 7 + 'px' }); add('fb-dot', { left: x + 'px', top: SH * 4.5 - 7 + 'px' }); }
      else add('fb-dot', { left: x + 'px', top: SH * 3 - 7 + 'px' });
    });

    const cells = [], strEls = [], fb = {};
    for (let s = 0; s < 6; s++) {
      cells[s] = [];
      const line = add('fb-string', { top: s * SH + SH / 2 - (1 + s * 0.4) / 2 + 'px', height: 1 + s * 0.4 + 'px' });
      strEls[s] = line;
      for (let f = 0; f <= o.frets; f++) {
        const c = add('fb-cell' + (f === 0 ? ' open' : ''), {
          left: f === 0 ? '0px' : NUT + (f - 1) * FW + 'px', width: f === 0 ? NUT - 6 + 'px' : FW + 'px',
          top: s * SH + 'px', height: SH + 'px',
        });
        c.innerHTML = '<span class="lab"></span><span class="mk"></span>';
        c.addEventListener('pointerdown', ev => { ev.preventDefault(); fb.press(s, f); });
        cells[s][f] = c;
      }
    }

    fb.midi = (s, f) => E.midiOf(s, f);
    fb.setLabels = mode => {
      o.labels = mode;
      cells.forEach((row, s) => row.forEach((c, f) => {
        const m = E.midiOf(s, f);
        let t = '';
        if (mode === 'note') t = E.pitchName(m);
        else if (mode === 'sargam') t = E.sargamOf(m);
        else if (mode === 'fret') t = f === 0 ? E.NAMES[s] : f;
        else if (f === 0) t = E.NAMES[s];
        c.querySelector('.lab').textContent = t;
      }));
    };
    fb.flashString = s => { strEls[s].classList.add('on'); setTimeout(() => strEls[s].classList.remove('on'), 180); };
    fb.pluck = (s, f = 0, when = 0) => {
      E.playMidi(E.midiOf(s, f), when);
      setTimeout(() => fb.flashString(s), when * 1000);
    };
    fb.press = (s, f) => {
      if (o.sound) fb.pluck(s, f);
      if (o.onPress) o.onPress({ s, f, midi: E.midiOf(s, f) });
    };
    // highlight(s, f, color='gold'|'green'|'blue'|'red')
    fb.highlight = (s, f, color = 'gold') => { const c = cells[s]?.[f]; if (c) c.classList.add('hl', 'hl-' + color); };
    fb.unhighlight = (s, f) => { const c = cells[s]?.[f]; if (c) c.className = c.className.replace(/\bhl(-\w+)?\b/g, '').trim(); };
    fb.highlightMidi = (midi, color = 'gold') => { for (let s = 0; s < 6; s++) { const f = midi - E.OPEN[s]; if (f >= 0 && f <= o.frets) fb.highlight(s, f, color); } };
    fb.highlightPitchClass = (pc, color = 'gold') => { for (let s = 0; s < 6; s++) for (let f = 0; f <= o.frets; f++) if (((E.midiOf(s, f) % 12) + 12) % 12 === pc) fb.highlight(s, f, color); };
    fb.clearHighlights = () => cells.forEach(row => row.forEach(c => { c.className = c.className.replace(/\bhl(-\w+)?\b/g, '').trim(); }));
    fb.mark = (s, f, text = '●') => { const c = cells[s]?.[f]; if (c) c.querySelector('.mk').textContent = text; };
    fb.clearMarks = () => cells.forEach(row => row.forEach(c => { c.querySelector('.mk').textContent = ''; }));
    // chord: array of 6 frets, low E -> high e, -1 = muted
    fb.showChord = chord => {
      fb.clearMarks();
      chord.forEach((f, i) => { const s = 5 - i; if (f < 0) fb.mark(s, 0, '✕'); else if (f === 0) fb.mark(s, 0, '○'); else fb.mark(s, f, '●'); });
    };
    fb.strumChord = (chord, down = true, gap = 0.045) => {
      const order = down ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];     // indices into low E -> high e
      let t = 0;
      order.forEach(i => { if (chord[i] >= 0) { fb.pluck(5 - i, chord[i], t); t += gap; } });
    };
    fb.destroy = () => scroll.remove();
    fb.setLabels(o.labels);
    return fb;
  },
};
