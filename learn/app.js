// Tutorial shell: sidebar, lesson/step runner, progress (localStorage), gating.
(() => {
  const KEY = 'guitarLearn.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = () => localStorage.setItem(KEY, JSON.stringify(P));
  const P = Object.assign({ done: {}, unlocked: false, cur: null }, load());
  const lessons = () => Lessons.list.slice().sort((a, b) => a.order - b.order);
  const isOpen = (l, i, all) => P.unlocked || i === 0 || P.done[all[i - 1].id];

  const side = document.getElementById('side'), main = document.getElementById('main');
  let cleanups = [], lesson = null, stepIdx = 0, stepDone = false;

  function runCleanups() { cleanups.forEach(f => { try { f(); } catch (e) { console.error(e); } }); cleanups = []; }

  function renderSide() {
    const all = lessons(), n = all.filter(l => P.done[l.id]).length;
    side.innerHTML = `<h2>🎸 Learn Guitar</h2><div>${n} / ${all.length} lessons</div>
      <div class="bar"><i style="width:${all.length ? (n / all.length) * 100 : 0}%"></i></div>`;
    all.forEach((l, i) => {
      const b = document.createElement('button');
      const open = isOpen(l, i, all);
      b.className = 'lesson-item' + (lesson && lesson.id === l.id ? ' cur' : '') + (P.done[l.id] ? ' done' : '') + (open ? '' : ' locked');
      b.innerHTML = `${l.order}. ${l.title}<small>${open ? (l.minutes || 5) + ' min' : '🔒 finish the previous lesson'}</small>`;
      b.onclick = () => open && openLesson(l.id);
      side.appendChild(b);
    });
    const done = all.length && n === all.length;
    const t = document.createElement('div'); t.className = 'tiny';
    t.innerHTML = (done ? '🎉 <a href="../index.html">Open the free-play Guitar →</a><br><br>' : '') +
      (P.unlocked ? '' : 'Already know this? <button id="unlock">Unlock all lessons</button>');
    side.appendChild(t);
    const u = t.querySelector('#unlock'); if (u) u.onclick = () => { P.unlocked = true; save(); renderSide(); };
  }

  function home() {
    runCleanups(); lesson = null;
    const all = lessons();
    const nextL = all.find(l => !P.done[l.id]);
    main.innerHTML = `<h1>Welcome 👋</h1>
      <div id="stage"><h2>Learn guitar from zero</h2>
      <p>No experience needed. You'll learn how the guitar works, the notes (including <b>Sa Re Ga Ma</b>), rhythm, your first chords, and then play a real song, all with sound you can try right here.</p>
      <p>${all.length} short lessons, about ${all.reduce((a, l) => a + (l.minutes || 5), 0)} minutes in total. Use headphones or speakers.</p>
      ${nextL ? `<button class="btn" id="go">${Object.keys(P.done).length ? 'Continue' : 'Start'}: ${nextL.title}</button>`
              : `<p>🎉 You finished everything! <a href="../index.html">Open the free-play Guitar →</a></p>`}</div>`;
    const g = main.querySelector('#go'); if (g) g.onclick = () => openLesson(nextL.id);
    renderSide();
  }

  function openLesson(id, step = 0) {
    lesson = lessons().find(l => l.id === id); stepIdx = step; P.cur = id; save();
    renderSide(); renderStep();
  }

  function renderStep() {
    runCleanups();
    const st = lesson.steps[stepIdx], last = stepIdx === lesson.steps.length - 1;
    const needsTask = typeof st.mount === 'function' && st.required !== false;
    stepDone = !needsTask;
    main.innerHTML = `<div class="crumb">Lesson ${lesson.order} · ${lesson.title} · step ${stepIdx + 1}/${lesson.steps.length}</div>
      <div class="stepbar">${lesson.steps.map((_, i) => `<i class="${i < stepIdx ? 'done' : i === stepIdx ? 'on' : ''}"></i>`).join('')}</div>
      <div id="stage"><h2>${st.title || ''}</h2><div id="body">${st.html || ''}</div></div>
      <div id="nav"><button class="btn ghost" id="prev" ${stepIdx === 0 ? 'disabled' : ''}>← Back</button>
      <button class="btn" id="next" ${stepDone ? '' : 'disabled'}>${last ? 'Finish lesson ✓' : 'Next →'}</button></div>`;
    const next = main.querySelector('#next');
    main.querySelector('#prev').onclick = () => { stepIdx--; renderStep(); };
    next.onclick = () => {
      if (!last) { stepIdx++; renderStep(); return; }
      P.done[lesson.id] = true; save();
      const all = lessons(), i = all.findIndex(l => l.id === lesson.id);
      all[i + 1] ? openLesson(all[i + 1].id) : home();
    };
    if (typeof st.mount === 'function') {
      const el = main.querySelector('#body');
      const ctx = {
        el, engine: Engine, CHORDS,
        $: sel => el.querySelector(sel), $$: sel => [...el.querySelectorAll(sel)],
        complete() { stepDone = true; next.disabled = false; },
        get isComplete() { return stepDone; },
        mountFretboard: (target, opts) => { const fb = Fretboard.mount(target || el, opts); cleanups.push(() => fb.destroy()); return fb; },
        metronome: (bpm, onBeat, bpb) => { const m = Engine.metronome(bpm, onBeat, bpb); cleanups.push(() => m.stop()); return m; },
        onCleanup: fn => cleanups.push(fn),
        keys: handler => { const h = e => { if (!e.repeat && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) handler(e); };
          addEventListener('keydown', h); cleanups.push(() => removeEventListener('keydown', h)); },
        setSa: pc => { Engine.state.saPc = pc; },
        quiz(target, questions, { complete = true } = {}) {
          let right = 0;
          questions.forEach(q => {
            const d = document.createElement('div'); d.className = 'q';
            d.innerHTML = `<b>${q.q}</b>`;
            let answered = false;
            q.options.forEach((txt, i) => {
              const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = txt;
              b.onclick = () => {
                if (answered) return;
                if (i === q.answer) { answered = true; b.classList.add('ok'); right++;
                  if (q.explain) d.insertAdjacentHTML('beforeend', `<div class="why">${q.explain}</div>`);
                  if (complete && right === questions.length) ctx.complete(); }
                else { b.classList.add('bad'); }
              };
              d.appendChild(b);
            });
            (target || el).appendChild(d);
          });
        },
        status: (text) => { let s = el.querySelector('.status'); if (!s) { s = document.createElement('div'); s.className = 'status'; el.appendChild(s); } s.textContent = text; },
      };
      try { const r = st.mount(ctx); if (typeof r === 'function') cleanups.push(r); }
      catch (e) { console.error(e); ctx.complete(); }
    }
    scrollTo(0, 0);
  }

  document.getElementById('home-link')?.addEventListener('click', home);
  home();
})();
