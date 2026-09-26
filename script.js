
(() => {
  'use strict';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  let actx = null, sfxOn = false;
  const sfxBtn = $('#sfxBtn');
  function blip(freq = 620, dur = 0.06, type = 'square', vol = 0.05) {
    if (!sfxOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g).connect(actx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.stop(actx.currentTime + dur + 0.02);
    } catch (e) { /* sin audio */ }
  }
  sfxBtn?.addEventListener('click', () => {
    sfxOn = !sfxOn;
    sfxBtn.setAttribute('aria-pressed', String(sfxOn));
    sfxBtn.textContent = sfxOn ? 'SFX ON' : 'SFX OFF';
    blip(880, 0.09);
  });
  document.addEventListener('pointerover', e => {
    if (e.target.closest('.btn, .filter__btn, .hud__nav a, .row__buy, .top')) blip(420, 0.03, 'square', 0.03);
  });
  const boot = $('#boot'), bootLog = $('#bootLog'), bootBar = $('#bootBar'), bootHint = $('#bootHint');
  const LINES = [
    'EDU-OS v1.0  (c) Edu Torregrosa',
    'Comprobando cartucho ............ OK',
    'Cargando sprites de montaña ..... OK',
    'Montando motor de físicas ....... OK',
    'Conectando con APIs de IA ....... OK',
    'Sincronizando wallet ............ OK',
    'PLAYER 1 LISTO.'
  ];
  function finishBoot() {
    boot?.classList.add('gone');
    document.body.classList.remove('is-booting');
    setTimeout(() => boot?.remove(), 600);
    startReveals();
  }
  function runBoot() {
    if (!boot) { startReveals(); return; }
    if (REDUCED) { finishBoot(); return; }
    let i = 0;
    const step = () => {
      if (i < LINES.length) {
        bootLog.textContent += LINES[i] + '\n';
        i++;
        bootBar.style.width = (i / LINES.length) * 100 + '%';
        blip(300 + i * 60, 0.03, 'square', 0.02);
        setTimeout(step, 170 + Math.random() * 120);
      } else {
        bootHint.textContent = 'PULSA PARA CONTINUAR';
        setTimeout(finishBoot, 420);
      }
    };
    setTimeout(step, 200);
  }
  document.addEventListener('keydown', e => { if (document.body.classList.contains('is-booting')) finishBoot(); });
  boot?.addEventListener('click', finishBoot);
  function startReveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], .xp, .dialog').forEach(el => io.observe(el));
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        scramble(en.target);
        io2.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    $$('[data-scramble]').forEach(el => io2.observe(el));
    const io3 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        countUp(en.target);
        io3.unobserve(en.target);
      });
    }, { threshold: 0.8 });
    $$('[data-count]').forEach(el => io3.observe(el));
    const io4 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        typeIt(en.target);
        io4.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    $$('[data-typewriter]').forEach(el => io4.observe(el));
  }
  const GLYPHS = '▓▒░#@$%&*+=<>/\\|01ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  function scramble(el) {
    const final = el.textContent;
    if (REDUCED) return;
    let frame = 0;
    const total = final.length;
    const id = setInterval(() => {
      frame++;
      const done = Math.floor(frame / 2.2);
      let out = '';
      for (let i = 0; i < total; i++) {
        const ch = final[i];
        if (ch === ' ') { out += ' '; continue; }
        out += i < done ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (done >= total) { clearInterval(id); el.textContent = final; blip(760, 0.07); }
    }, 34);
  }
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (REDUCED) { el.textContent = target; return; }
    const dur = 1100, t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function typeIt(el) {
    const txt = el.dataset.typewriter || '';
    if (REDUCED) { el.textContent = txt; return; }
    let i = 0;
    const id = setInterval(() => {
      el.textContent = txt.slice(0, ++i);
      if (i % 9 === 0) blip(300 + (i % 3) * 40, 0.012, 'square', 0.012);
      if (i >= txt.length) { clearInterval(id); el.dataset.done = '1'; }
    }, 13);
  }
  const hudCoins = $('#hudCoins'), hudHp = $('#hudHp');
  let coins = 0;
  function pad(n) { return String(n).padStart(3, '0'); }
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    const c = Math.round(p * 120);
    if (c > coins) { coins = c; hudCoins.textContent = pad(coins); }
    if (hudHp) hudHp.style.width = (30 + p * 70) + '%';
    $('#topBtn')?.classList.toggle('show', scrollY > 700);
    parallax(p);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('a,button')) {
      coins = Math.min(999, coins + 3);
      if (hudCoins) hudCoins.textContent = pad(coins);
    }
  });
  const layers = $$('.range__layer');
  let mx = 0, my = 0;
  function parallax(p) {
    if (REDUCED) return;
    layers.forEach(l => {
      const d = parseFloat(l.dataset.depth) || 8;
      l.style.transform = `translate3d(${mx * d}px, ${p * d * 2.2 + my * d * 0.4}px, 0)`;
    });
  }
  if (!REDUCED) {
    addEventListener('pointermove', e => {
      mx = (e.clientX / innerWidth - 0.5) * -1;
      my = (e.clientY / innerHeight - 0.5) * -1;
      parallax(Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    }, { passive: true });
  }
  const links = $$('.nav-link');
  const ioNav = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'sobre-mi', 'quests', 'inventario', 'freelance', 'contacto']
    .forEach(id => { const s = document.getElementById(id); if (s) ioNav.observe(s); });
  const qBtns = $$('.filter__btn'), quests = $$('.quest'), qCount = $('#questCount');
  qBtns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    qBtns.forEach(b => b.classList.toggle('is-on', b === btn));
    let visible = 0;
    quests.forEach(q => {
      const ok = f === 'all' || (q.dataset.cat || '').split(' ').includes(f);
      q.classList.toggle('is-hidden', !ok);
      q.classList.remove('is-enter');
      if (ok) { visible++; void q.offsetWidth; q.classList.add('is-enter'); }
    });
    if (qCount) qCount.textContent = visible;
    blip(f === 'all' ? 520 : 690, 0.06);
  }));
  const form = $('#mailForm'), status = $('#formStatus');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fName').value.trim(), m = $('#fMail').value.trim(), t = $('#fMsg').value.trim();
    if (!n || !m || !t || !/^\S+@\S+\.\S+$/.test(m)) {
      status.textContent = '✖ Faltan campos o el correo no es válido.';
      status.classList.add('err');
      blip(160, 0.14, 'sawtooth');
      return;
    }
    status.classList.remove('err');
    status.textContent = '✔ Abriendo tu gestor de correo…';
    const body = `Hola Edu,%0D%0A%0D%0A${encodeURIComponent(t)}%0D%0A%0D%0A— ${n} (${m})`;
    location.href = `mailto:hello@edutorregrosa.dev?subject=Misi%C3%B3n%20para%20Edu%20(${encodeURIComponent(n)})&body=${body}`;
    blip(880, 0.1);
  });
  $('#topBtn')?.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });
  const CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let seq = [];
  const toast = $('#toast');
  addEventListener('keydown', e => {
    seq.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (seq.length > CODE.length) seq.shift();
    if (CODE.every((k, i) => seq[i] === k)) {
      document.body.classList.add('konami');
      toast.textContent = '★ CHEAT ACTIVADO · MODO ARCADE ★';
      toast.classList.add('show');
      [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => blip(f, 0.12), i * 110));
      setTimeout(() => { toast.classList.remove('show'); document.body.classList.remove('konami'); }, 6000);
      seq = [];
    }
  });
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  addEventListener('DOMContentLoaded', runBoot);
  if (document.readyState !== 'loading') runBoot();
})();
