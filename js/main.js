/* Coral Bank (fictional demo) - main.js */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => 'Rs ' + Math.round(n).toLocaleString('en-US');

  // Backend base URLs (Flask by default, PHP for contact fallback)
  const API = window.CORAL_API || 'http://127.0.0.1:5000/api';
  const PHP = window.CORAL_PHP || 'php/contact.php';

  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2800);
  };
  const api = async (path, opts) => {
    const ctl = new AbortController(); const id = setTimeout(() => ctl.abort(), 2500);
    try {
      const r = await fetch(API + path, { ...opts, signal: ctl.signal });
      if (!r.ok) throw new Error(r.status); return await r.json();
    } finally { clearTimeout(id); }
  };

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const s = localStorage.getItem('coral-theme'); if (s) root.dataset.theme = s; } catch (e) {}
  $('#themeToggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('coral-theme', root.dataset.theme); } catch (e) {}
  });

  /* ---------- header, progress, active nav ---------- */
  const header = $('#header'), prog = $('#progress');
  const onScroll = () => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    header.classList.toggle('scrolled', h.scrollTop > 10);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const links = $$('.nav a');
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secObs.observe(s));

  /* ---------- mobile drawer ---------- */
  const burger = $('#burger'), drawer = $('#drawer');
  const setDrawer = open => {
    burger.classList.toggle('open', open); drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open); drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));

  /* ---------- scroll reveal ---------- */
  const revObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => revObs.observe(el));

  /* ---------- counters ---------- */
  const animateNum = (el, to, suffix = '', dur = 1600) => {
    if (reduce) { el.textContent = to + suffix; return; }
    const t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { animateNum(e.target, +e.target.dataset.count, e.target.dataset.suffix || ''); cObs.unobserve(e.target); }
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cObs.observe(el));

  const bal = $('#balanceNum');
  if (bal) {
    const to = +bal.dataset.balance, t0 = performance.now() + 500;
    const tick = t => {
      const p = Math.max(0, Math.min((t - t0) / 1800, 1)), e = 1 - Math.pow(1 - p, 3);
      bal.textContent = 'Rs ' + (to * e).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (p < 1) requestAnimationFrame(tick);
    };
    reduce ? bal.textContent = 'Rs ' + to.toLocaleString('en-US', { minimumFractionDigits: 2 }) : requestAnimationFrame(tick);
  }

  /* ---------- rotating hero word ---------- */
  const words = ['made simple.', 'always safe.', 'in your pocket.', 'growing daily.'];
  const rot = $('#rotator'); let wi = 0;
  if (!reduce) setInterval(() => {
    wi = (wi + 1) % words.length;
    rot.innerHTML = '<span>' + words[wi] + '</span>';
  }, 2600);

  /* ---------- 3D tilt + magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
  }

  /* ---------- exchange-rate ticker ---------- */
  const fallbackRates = [
    { pair: 'USD/MUR', buy: 44.10, sell: 45.60 }, { pair: 'EUR/MUR', buy: 48.20, sell: 50.10 },
    { pair: 'GBP/MUR', buy: 56.00, sell: 58.40 }, { pair: 'ZAR/MUR', buy: 2.45, sell: 2.62 },
    { pair: 'INR/MUR', buy: 0.52, sell: 0.56 }, { pair: 'AUD/MUR', buy: 28.60, sell: 30.20 }
  ];
  const drawTicker = rates => {
    const html = rates.map(r => `<span>${r.pair} <b>${r.buy.toFixed(2)} / ${r.sell.toFixed(2)}</b></span>`).join('');
    $('#tickerTrack').innerHTML = html + html; // doubled for seamless loop
  };
  drawTicker(fallbackRates);
  api('/rates').then(d => d.rates && drawTicker(d.rates)).catch(() => {});

  /* ---------- tabs with sliding ink ---------- */
  const tabs = $$('.tab'), ink = $('#tabInk');
  const moveInk = t => { ink.style.left = t.offsetLeft + 'px'; ink.style.width = t.offsetWidth + 'px'; };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('active', x === t));
    $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
    moveInk(t);
  }));
  const initInk = () => moveInk($('.tab.active'));
  addEventListener('resize', initInk); document.fonts.ready.then(initInk); initInk();

  /* ---------- loan calculator (local + Flask API) ---------- */
  const amount = $('#amount'), years = $('#years'), type = $('#loanType');
  const donut = $('#donut'), C = 2 * Math.PI * 48;
  const calcLocal = (P, rate, yrs) => {
    const r = rate / 100 / 12, n = yrs * 12;
    const m = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return { monthly: m, total: m * n, interest: m * n - P };
  };
  let apiTimer;
  const render = (res, P, source) => {
    $('#monthly').textContent = fmt(res.monthly);
    $('#pOut').textContent = fmt(P); $('#iOut').textContent = fmt(res.interest); $('#tOut').textContent = fmt(res.total);
    donut.style.strokeDashoffset = C * (1 - P / res.total);
    $('#apiState').textContent = source === 'api' ? 'Calculated by the Python (Flask) API' : 'Using local calculation';
  };
  const update = () => {
    const P = +amount.value, yrs = +years.value, rate = +type.value;
    $('#amtOut').textContent = fmt(P); $('#yrOut').textContent = yrs + (yrs === 1 ? ' year' : ' years');
    render(calcLocal(P, rate, yrs), P, 'local');
    clearTimeout(apiTimer);
    apiTimer = setTimeout(() => {
      api(`/loan?amount=${P}&rate=${rate}&years=${yrs}`).then(d => d.monthly && render(d, P, 'api')).catch(() => {});
    }, 350);
  };
  [amount, years, type].forEach(el => el.addEventListener('input', update));
  update();

  /* ---------- mini chart in app section ---------- */
  const mc = $('#miniChart');
  if (mc) {
    const vals = [38, 55, 42, 70, 60, 88, 74];
    mc.innerHTML = vals.map(() => '<i></i>').join('');
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { $$('i', mc).forEach((b, i) => setTimeout(() => b.style.height = vals[i] + '%', i * 90)); o.disconnect(); }
    }), { threshold: .4 }).observe(mc);
  }

  /* ---------- knowledge hub (filterable) ---------- */
  const articles = [
    ['home', 'Renting vs. buying a home: which one is the smarter financial decision?'],
    ['lifestyle', 'How to pay with your phone using tap-to-pay'],
    ['security', 'Protected at every tap: how NFC keeps your payments safe'],
    ['lifestyle', 'The ultimate retirement planning checklist'],
    ['lifestyle', 'Managing finances as a couple: best practices'],
    ['lifestyle', 'How to teach kids about money: fun and easy lessons'],
    ['security', 'Identity theft prevention: 3 steps to keep your finances safe'],
    ['security', 'How to protect yourself from online banking fraud and scams'],
    ['home', 'Education loans explained: how to borrow for your education the smart way'],
    ['home', 'Car loans 101: what to know before buying a car']
  ];
  const grid = $('#hubGrid');
  const drawHub = f => {
    grid.innerHTML = articles.filter(a => f === 'all' || a[0] === f).map((a, i) =>
      `<article class="hub-item" style="animation-delay:${i * 50}ms"><small>${a[0]}</small><h4>${a[1]}</h4><span class="go">&rarr;</span></article>`).join('');
  };
  drawHub('all');
  $('#hubFilters').addEventListener('click', e => {
    const b = e.target.closest('.chipbtn'); if (!b) return;
    $$('.chipbtn').forEach(x => x.classList.toggle('active', x === b)); drawHub(b.dataset.f);
  });

  /* ---------- offices + stylised map ---------- */
  const offices = [
    { n: 'Port Louis Head Office', t: 'Port Louis', x: 150, y: 110 },
    { n: 'Curepipe Branch', t: 'Curepipe', x: 210, y: 175 },
    { n: 'Quatre Bornes Branch', t: 'Quatre Bornes', x: 180, y: 150 },
    { n: 'Grand Baie Branch', t: 'Grand Baie', x: 215, y: 70 },
    { n: 'Mahebourg Branch', t: 'Mahebourg', x: 270, y: 215 },
    { n: 'Flacq Branch', t: 'Flacq', x: 275, y: 130 }
  ];
  const list = $('#officeList'), pins = $('#pins');
  const drawOffices = q => {
    const rows = offices.filter(o => (o.n + o.t).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = rows.map(o => `<li data-t="${o.t}"><span>${o.n}</span><small class="muted">Open 9:00-15:30</small></li>`).join('') || '<li>No branch found</li>';
    pins.innerHTML = rows.map(o => `<g data-t="${o.t}"><circle class="pulse" cx="${o.x}" cy="${o.y}" r="8"/><circle class="pin" cx="${o.x}" cy="${o.y}" r="6"/></g>`).join('');
  };
  const focusOffice = t => {
    $$('#officeList li').forEach(l => l.classList.toggle('on', l.dataset.t === t));
    $$('#pins .pin').forEach(p => p.classList.toggle('on', p.parentNode.dataset.t === t));
  };
  drawOffices('');
  $('#officeSearch').addEventListener('input', e => drawOffices(e.target.value));
  list.addEventListener('mouseover', e => { const l = e.target.closest('li'); l && focusOffice(l.dataset.t); });
  pins.addEventListener('mouseover', e => { const g = e.target.closest('g'); g && focusOffice(g.dataset.t); });

  /* ---------- contact form: Flask first, PHP fallback ---------- */
  const form = $('#contactForm'), fm = $('#formMsg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || data.message.trim().length < 5) {
      fm.className = 'form-msg err'; fm.textContent = 'Please fill in your name, a valid email and a message.'; return;
    }
    fm.className = 'form-msg'; fm.textContent = 'Sending...';
    try {
      const d = await api('/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!d.ok) throw new Error('flask');
      fm.className = 'form-msg ok'; fm.textContent = 'Thank you. Your message was received (Flask).'; form.reset();
    } catch (_) {
      try {
        const r = await fetch(PHP, { method: 'POST', body: new URLSearchParams(data) });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || 'php');
        fm.className = 'form-msg ok'; fm.textContent = 'Thank you. Your message was received (PHP).'; form.reset();
      } catch (err) {
        fm.className = 'form-msg ok'; fm.textContent = 'Demo mode: no backend is running, so nothing was stored.'; form.reset();
      }
    }
  });

  /* ---------- demo login modal ---------- */
  const modal = $('#loginModal');
  const setModal = o => { modal.classList.toggle('open', o); modal.setAttribute('aria-hidden', !o); if (o) setTimeout(() => $('#lUser').focus(), 200); };
  $('#openLogin').addEventListener('click', () => setModal(true));
  $('#closeLogin').addEventListener('click', () => setModal(false));
  modal.addEventListener('click', e => e.target === modal && setModal(false));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setModal(false); setDrawer(false); } });
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#loginMsg'), u = $('#lUser').value.trim(), p = $('#lPass').value;
    let ok;
    try { ok = (await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) })).ok; }
    catch (_) { ok = u === 'demo' && p === 'coral123'; }
    if (ok) { msg.className = 'form-msg ok'; msg.textContent = 'Welcome back, demo user!'; setTimeout(() => { setModal(false); toast('Signed in to the demo dashboard'); }, 700); }
    else { msg.className = 'form-msg err'; msg.textContent = 'Wrong demo credentials.'; }
  });
})();
