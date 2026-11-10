# Learn Guitar tutorial: lesson authoring API

Plain HTML/JS, no build, no libraries. Shared files (`engine.js`, `app.js`, `style.css`, `index.html`) are
owned by the shell: **do not edit them**. Each lesson is ONE file in `lessons/` that calls `Lessons.register`.

```js
Lessons.register({
  id: 'meet-the-guitar', order: 1, title: 'Meet the Guitar', minutes: 5,
  steps: [
    { title: 'Read-only step', html: '<p>Text. Can use <div class="tip">…</div> and <div class="task">…</div></p>' },
    { title: 'Interactive step', html: '<p>…</p><div id="fb"></div>',
      mount(ctx) { /* build UI inside ctx.el; call ctx.complete() when done; may return a cleanup fn */ } },
  ],
});
```
- A step **without** `mount` is auto-complete. A step **with** `mount` keeps "Next" disabled until `ctx.complete()`
  is called (set `required: false` on the step to not gate). `html` is inserted into `ctx.el` before `mount` runs.
- Wrap the file in an IIFE or block scope; don't leak globals other than the `Lessons.register` call.

## ctx (passed to mount)
- `ctx.el`, `ctx.$(sel)`, `ctx.$$(sel)`: step container + scoped queries.
- `ctx.complete()`, `ctx.isComplete`
- `ctx.status(text)`: green feedback line at the bottom of the step.
- `ctx.mountFretboard(targetEl, opts)` → `fb` (auto-destroyed). Pass `targetEl` (or omit to append to `ctx.el`).
- `ctx.metronome(bpm, onBeat(beatInBar, totalBeat), beatsPerBar=4)` → `{start, stop, setBpm, running}`; auto-stopped on leaving the step.
- `ctx.keys(e => …)`: keydown listener (ignores repeats), auto-removed on leaving.
- `ctx.onCleanup(fn)`, `ctx.setSa(pitchClass 0-11)` (0 = C, default).
- `ctx.quiz(targetEl, [{q, options:[html…], answer:index, explain}], {complete:true})`: completes the step when all are answered correctly.
- `ctx.engine` = `Engine`, `ctx.CHORDS`.

## Engine (global `Engine`)
`Engine.playMidi(midi, whenSeconds=0)`, `Engine.sargamOf(midi)` (relative to current Sa), `Engine.noteName(midi)` ("E4"),
`Engine.pitchName(midi)` ("E"), `Engine.midiOf(stringIdx, fret)`, `Engine.OPEN` (string 0 = high e … 5 = low E, MIDI 64,59,55,50,45,40),
`Engine.NAMES` (`['e','B','G','D','A','E']`), `Engine.NOTE`, `Engine.SARGAM`, `Engine.state.saPc`.
Middle-register sargam for lessons: MIDI `60 + saPc + semitoneOffset` (major scale offsets 0,2,4,5,7,9,11,12 = Sa Re Ga Ma Pa Dha Ni Sa').
Sargam names: Sa re Re ga Ga Ma Ma' Pa dha Dha ni Ni (lowercase = komal, Ma' = tivra).

## Fretboard (`ctx.mountFretboard`) → fb
Strings are indexed 0 = high e … 5 = low E; fret 0 = open string.
`fb.setLabels('none'|'note'|'sargam'|'fret')`, `fb.press(s,f)`, `fb.pluck(s,f,when)`, `fb.flashString(s)`,
`fb.highlight(s,f,'gold'|'green'|'blue'|'red')`, `fb.unhighlight(s,f)`, `fb.highlightMidi(midi,color)`, `fb.highlightPitchClass(pc,color)`,
`fb.clearHighlights()`, `fb.mark(s,f,text)`, `fb.clearMarks()`,
`fb.showChord(arr)` / `fb.strumChord(arr, down=true)` where `arr` is 6 frets **low E → high e**, -1 = muted (see `CHORDS`).
Options: `{frets:12, labels:'none', sound:true, onPress({s,f,midi})}`. Clicking a cell already plays the note when `sound:true`.

## Style helpers (style.css)
`.tip`, `.task`, `.pill` / `.pill.on` buttons, `.btn`, `.status`, `.beats` (+ `<i>` children, add `.on`), headings are fine in `html`.

## Quality bar
Beginner voice: short sentences, define every term the first time, one idea per step, 6-10 steps per lesson, mix reading with
something to do (click, play, quiz) every 1-2 steps. Explain *why*, not only *what*. Assume the learner is an Indian beginner
who may know Sa Re Ga Ma better than C D E, so always connect the two. Verify with `node --check <file>`.
