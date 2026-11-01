/* Sohag Physics — front-end app (hash router, bilingual, student portal, admin panel) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => Store.db.settings;

  let lang = localStorage.getItem('sp_lang') || 'bn';
  const t = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const L = (o, f) => o[f + '_' + lang] || o[f + '_en'] || o[f + '_bn'] || '';
  const num = s => lang === 'bn' ? String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(s);
  const fmtDate = d => {
    if (!d) return '';
    const x = new Date(d); if (isNaN(x)) return d;
    return num(x.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  };
  const fmtDT = d => num(new Date(d).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB'));

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- static chrome ---------- */
  function applyI18n(root = document) {
    $$('[data-i18n]', root).forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.documentElement.lang = lang;
  }
  function chrome() {
    const s = S(), sess = Store.session();
    // portal dropdown depends on login state
    let items = '';
    if (!sess) items = `<a href="#/login">${t('login')}</a><a href="#/register">${t('register')}</a>`;
    else if (sess.role === 'admin') items = `<a href="#/admin">${t('admin_panel')}</a>`;
    else items = `<a href="#/dashboard">${t('dashboard')}</a>`;
    items += `<a href="#/programs">${t('programs')}</a><a href="#/exam">${t('exam')}</a><a href="#/privacy">${t('privacy')}</a>`;
    if (sess) items += `<a href="#/logout">${t('logout')}</a>`;
    $('#portalMenu').innerHTML = items;
    $('#footSocial').innerHTML =
      (s.youtube ? `<a href="${esc(s.youtube)}" target="_blank" rel="noopener">YouTube</a>` : '') +
      (s.facebook ? `<a href="${esc(s.facebook)}" target="_blank" rel="noopener">Facebook</a>` : '') +
      `<a href="https://api.whatsapp.com/send/?phone=${esc(s.whatsapp)}&text&type=phone_number&app_absent=0" target="_blank" rel="noopener">WhatsApp</a>`;
    $('#footContact').innerHTML = `<h4>${t('c_h')}</h4>
      <p class="muted">${esc(L({ a_en: 'Jaleshworitola Branch', a_bn: 'জলেশ্বরীতলা শাখা' }, 'a'))}<br>${esc(L({ a_en: 'Shibbati Branch, Bogura', a_bn: 'শিববাটি শাখা, বগুড়া' }, 'a'))}</p>
      <p>${s.phones.map(p => `<a href="tel:${esc(p.replace(/\s/g, ''))}">${esc(num(p))}</a>`).join('<br>')}</p>
      <p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>`;
    $('#waBtn').href = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(s.whatsapp)}&text&type=phone_number&app_absent=0`;
    $('#yr').textContent = num(new Date().getFullYear());
    $('#langBtn').textContent = lang === 'bn' ? 'EN' : 'বাংলা';
    applyI18n();
  }

  /* ---------- small view pieces ---------- */
  const head = (h, s) => `<section class="page-head"><div class="wrap"><h1>${h}</h1>${s ? `<p>${s}</p>` : ''}</div></section>`;
  const img = (src, alt = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  const empty = () => `<p class="muted center">${t('none')}</p>`;

  function courseCard(c) {
    return `<article class="card course reveal">
      <div class="card-img">${img(c.image, L(c, 'title'))}<span class="chip">${esc(c.level)}</span></div>
      <div class="card-b"><h3>${esc(L(c, 'title'))}</h3><p>${esc(L(c, 'desc'))}</p>
      <a class="btn sm" href="#/register">${t('enroll')}</a></div></article>`;
  }
  function blogCard(p) {
    return `<article class="card reveal">
      <div class="card-img">${img(p.image, L(p, 'title'))}</div>
      <div class="card-b"><small class="muted">${fmtDate(p.date)}</small><h3>${esc(L(p, 'title'))}</h3><p>${esc(L(p, 'desc'))}</p></div></article>`;
  }
  function hofCard(h) {
    return `<article class="card reveal"><div class="card-img wide">${img(h.image, L(h, 'title'))}</div>
      <div class="card-b"><h3>${esc(L(h, 'title'))}</h3><p>${esc(L(h, 'desc'))}</p></div></article>`;
  }
  const pub = col => Store.list(col).filter(x => x.published !== false);

  function scheduleTable() {
    const groups = {};
    Store.list('batches').slice().reverse().forEach(b => { (groups[L(b, 'branch')] ||= []).push(b); });
    return `<div class="grid-2">` + Object.entries(groups).map(([br, arr]) => `
      <div class="card reveal"><div class="card-b"><h3>${esc(br)}</h3>
      <table class="tbl"><thead><tr><th>#</th><th>${t('shift')}</th><th>${t('days')}</th></tr></thead><tbody>
      ${arr.map((b, i) => `<tr><td>${num(i + 1)}</td><td>${esc(L(b, 'time'))}</td><td>${esc(L(b, 'days'))}</td></tr>`).join('')}
      </tbody></table></div></div>`).join('') + `</div>`;
  }

  /* ---------- views ---------- */
  const V = {};

  V.home = () => {
    const s = S();
    return `
    <section class="hero"><div class="wrap hero-in">
      <div class="hero-t">
        <span class="badge">${t('hero_badge')}</span>
        <h1>${t('hero_h')}</h1>
        <p>${t('hero_p')}</p>
        <p class="offer">🎁 ${esc(lang === 'bn' ? s.offer_bn : s.offer_en)}</p>
        <div class="row"><a class="btn" href="#/register">${t('hero_cta1')}</a><a class="btn ghost" href="#/courses">${t('hero_cta2')}</a></div>
        <p class="muted small">${t('start_date')}: <b>${fmtDate(s.start)}</b></p>
      </div>
      <div class="hero-i"><img src="assets/poster-hsc28.png" alt="HSC-28 Physics batch poster" width="520" height="520"></div>
    </div></section>

    <section class="stats"><div class="wrap grid-4">
      <div><b data-count="13">0</b><span>${t('stat_years')}</span></div>
      <div><b data-count="${Math.max(1000, Store.db.students.length)}" data-plus>0</b><span>${t('stat_students')}</span></div>
      <div><b data-count="2">0</b><span>${t('stat_branches')}</span></div>
      <div><b data-count="5">0</b><span>${t('stat_exams')}</span></div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2 class="sec-h">${t('sec_feat')}</h2><p class="sec-s">${t('sec_feat_s')}</p>
      <div class="grid-3">
        ${[['f_theory', '📘'], ['f_math', '🧮'], ['f_adm', '📝'], ['f_exam', '⏱️'], ['f_double', '🎥']].map(([k, ic]) =>
          `<div class="feat reveal"><span class="ic">${ic}</span><h3>${t(k)}</h3><p>${t(k + '_d')}</p></div>`).join('')}
      </div>
    </div></section>

    <section class="sec alt"><div class="wrap">
      <h2 class="sec-h">${t('sec_courses')}</h2><p class="sec-s">${t('sec_courses_s')}</p>
      <div class="grid-3">${pub('courses').slice(0, 3).map(courseCard).join('')}</div>
      <p class="center"><a class="link" href="#/courses">${t('view_all')}</a></p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2 class="sec-h">${t('sec_sched')}</h2><p class="sec-s">${t('sec_sched_s')}</p>
      ${scheduleTable()}
    </div></section>

    <section class="sec alt"><div class="wrap">
      <h2 class="sec-h">${t('sec_hof')}</h2><p class="sec-s">${t('sec_hof_s')}</p>
      <div class="grid-3">${pub('hof').slice(0, 3).map(hofCard).join('') || empty()}</div>
      <p class="center"><a class="link" href="#/hall-of-fame">${t('view_all')}</a></p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2 class="sec-h">${t('sec_blog')}</h2>
      <div class="grid-3">${pub('blog').slice(0, 3).map(blogCard).join('') || empty()}</div>
      <p class="center"><a class="link" href="#/blog">${t('view_all')}</a></p>
    </div></section>

    <section class="cta"><div class="wrap center"><h2>${t('cta_h')}</h2><p>${t('cta_p')}</p>
      <a class="btn light" href="#/register">${t('hero_cta1')}</a></div></section>`;
  };

  V.courses = () => head(t('courses_h'), t('sec_courses_s')) +
    `<section class="sec"><div class="wrap grid-3">${pub('courses').map(courseCard).join('') || empty()}</div></section>`;
  V.blog = () => head(t('blog_h'), t('blog_s')) +
    `<section class="sec"><div class="wrap grid-3">${pub('blog').map(blogCard).join('') || empty()}</div></section>`;
  V['hall-of-fame'] = () => head(t('hof_h'), t('sec_hof_s')) +
    `<section class="sec"><div class="wrap grid-3">${pub('hof').map(hofCard).join('') || empty()}</div></section>`;

  V.about = () => {
    const T = Store.db.teacher;
    return head(t('about_h')) + `<section class="sec"><div class="wrap about">
      <div><p>${t('about_p1')}</p><p>${t('about_p2')}</p>
      <h3>${t('about_vals')}</h3><ul class="ticks"><li>${t('v1')}</li><li>${t('v2')}</li><li>${t('v3')}</li><li>${t('v4')}</li></ul></div>
      <div class="card teacher reveal"><div class="card-b center">
        <img class="avatar" src="${esc(T.photo)}" alt="${esc(L(T, 'name'))}" width="140" height="140">
        <small class="muted">${t('about_teacher')}</small>
        <h3>${esc(L(T, 'name'))}</h3><p class="muted">${esc(L(T, 'role'))}</p><p>${esc(L(T, 'bio'))}</p></div></div>
    </div></section>
    <section class="sec alt"><div class="wrap"><h2 class="sec-h">${t('sec_sched')}</h2>${scheduleTable()}</div></section>`;
  };

  const classOpts = (sel = '') => `<option value="">${t('select')}</option>` +
    [['9', 'cls_9'], ['10', 'cls_10'], ['SSC', 'cls_ssc'], ['11', 'cls_11'], ['12', 'cls_12'], ['HSC', 'cls_hsc'], ['Admission', 'cls_adm']]
      .map(([v, k]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${t(k)}</option>`).join('');
  const clsLabel = v => ({ '9': 'cls_9', '10': 'cls_10', SSC: 'cls_ssc', '11': 'cls_11', '12': 'cls_12', HSC: 'cls_hsc', Admission: 'cls_adm' }[v] ? t({ '9': 'cls_9', '10': 'cls_10', SSC: 'cls_ssc', '11': 'cls_11', '12': 'cls_12', HSC: 'cls_hsc', Admission: 'cls_adm' }[v]) : v || '');

  V.contact = () => {
    const s = S();
    return head(t('c_h'), t('c_s')) + `<section class="sec"><div class="wrap grid-2 top">
      <div class="card"><div class="card-b">
        <h3>${t('our_loc')}</h3>
        <p><b>${t('branch1')}</b><br><span class="muted">${t('branch1_a')}</span></p>
        <p><b>${t('branch2')}</b><br><span class="muted">${t('branch2_a')}</span></p>
        <h3>${t('phone')}</h3><p>${s.phones.map(p => `<a href="tel:${esc(p.replace(/\s/g, ''))}">${esc(num(p))}</a>`).join('<br>')}</p>
        <h3>${t('email')}</h3><p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
        <p class="row"><a class="btn sm wa-b" target="_blank" rel="noopener" href="https://api.whatsapp.com/send/?phone=${encodeURIComponent(s.whatsapp)}&text&type=phone_number&app_absent=0">${t('open_wa')}</a>
        ${s.youtube ? `<a class="btn sm ghost-d" target="_blank" rel="noopener" href="${esc(s.youtube)}">YouTube</a>` : ''}</p>
      </div></div>
      <form class="card form" id="contactForm" novalidate><div class="card-b">
        <label>${t('f_name')} *<input name="name" required autocomplete="name"></label>
        <label>${t('f_phone')} *<input name="phone" type="tel" required autocomplete="tel"></label>
        <label>${t('f_class')}<select name="cls">${classOpts()}</select></label>
        <label>${t('f_school')}<input name="school"></label>
        <label>${t('f_college')}<input name="college"></label>
        <label>${t('f_msg')} *<textarea name="message" rows="4" required></textarea></label>
        <button class="btn" type="submit">${t('send')}</button>
      </div></form></div></section>`;
  };
  V.contact.after = () => {
    $('#contactForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (!f.name.trim() || !f.phone.trim() || !f.message.trim()) return toast(t('required'));
      Store.addMessage(f); e.target.reset(); toast(t('sent'));
    });
  };

  V.login = () => {
    return `<section class="auth"><form class="card form" id="loginForm" novalidate><div class="card-b">
      <img class="auth-logo" src="assets/logo.png" alt="" width="64" height="64">
      <h1>${t('login_h')}</h1><p class="muted">${t('login_s')}</p>
      <label>${t('login_id')}<input name="id" required autocomplete="username"></label>
      <label>${t('f_pass')}<input name="password" type="password" required autocomplete="current-password"></label>
      <p class="err" id="err" role="alert"></p>
      <button class="btn block" type="submit">${t('login_btn')}</button>
      <p class="center small">${t('no_acc')} <a href="#/register">${t('register')}</a></p>
    </div></form></section>`;
  };
  V.login.after = () => {
    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const r = await Store.login(f.id, f.password);
      if (!r.ok) { $('#err').textContent = t(r.err === 'blocked' ? 'blocked' : 'bad_login'); return; }
      const to = r.role === 'admin' ? '#/admin' : '#/dashboard';
      if (location.hash === to) route(); else location.hash = to;
    });
  };

  V.register = () => `<section class="auth"><form class="card form" id="regForm" novalidate><div class="card-b">
      <h1>${t('reg_h')}</h1><p class="muted">${t('reg_s')}</p>
      <label>${t('f_name')} *<input name="name" required autocomplete="name"></label>
      <div class="grid-2 tight">
        <label>${t('f_phone')} *<input name="phone" type="tel" required autocomplete="tel"></label>
        <label>${t('f_email')} *<input name="email" type="email" required autocomplete="email"></label>
      </div>
      <div class="grid-2 tight">
        <label>${t('f_class')} *<select name="cls" required>${classOpts()}</select></label>
        <label>${t('f_school')} *<input name="school" required></label>
      </div>
      <label>${t('f_college')}<input name="college"></label>
      <div class="grid-2 tight">
        <label>${t('f_pass')} *<input name="password" type="password" required minlength="6" autocomplete="new-password"></label>
        <label>${t('f_pass2')} *<input name="password2" type="password" required autocomplete="new-password"></label>
      </div>
      <p class="err" id="err" role="alert"></p>
      <button class="btn block" type="submit">${t('reg_btn')}</button>
      <p class="center small">${t('has_acc')} <a href="#/login">${t('login')}</a></p>
    </div></form></section>`;
  V.register.after = () => {
    $('#regForm').addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target)), err = $('#err');
      if (!f.name.trim() || !f.phone.trim() || !f.email.trim() || !f.cls || !f.school.trim() || !f.password) { err.textContent = t('required'); return; }
      if (f.password.length < 6) { err.textContent = t('pass_short'); return; }
      if (f.password !== f.password2) { err.textContent = t('pass_mismatch'); return; }
      const r = await Store.register(f);
      if (!r.ok) { err.textContent = t('exists'); return; }
      toast(t('reg_ok')); location.hash = '#/dashboard';
    });
  };

  V.programs = () => head(t('prog_h'), t('prog_s')) +
    `<section class="sec"><div class="wrap grid-3">${pub('courses').map(courseCard).join('') || empty()}</div></section>
     <section class="sec alt"><div class="wrap"><h2 class="sec-h">${t('sec_sched')}</h2>${scheduleTable()}</div></section>`;

  V.exam = () => {
    const st = Store.currentStudent(), adm = Store.isAdmin();
    let body;
    if (!st && !adm) body = `<p class="center">${t('exam_login')}</p><p class="center"><a class="btn" href="#/login">${t('login')}</a></p>`;
    else {
      const ex = pub('exams');
      body = ex.length ? `<div class="grid-3">${ex.map(e => `<article class="card"><div class="card-b">
        <small class="muted">${t('exam_date')}: ${fmtDate(e.date)}</small><h3>${esc(L(e, 'title'))}</h3>
        <p>${esc(L(e, 'desc'))}</p><p class="small muted">${t('exam_for')}: ${esc(e.level || '')}</p>
        ${e.link ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(e.link)}">${t('exam_open')}</a>` : ''}</div></article>`).join('')}</div>` : empty();
    }
    return head(t('exam_h'), t('exam_s')) + `<section class="sec"><div class="wrap">${body}</div></section>`;
  };

  V.privacy = () => head(t('priv_h')) + `<section class="sec"><div class="wrap narrow"><ul class="ticks big">
    <li>${t('priv_1')}</li><li>${t('priv_2')}</li><li>${t('priv_3')}</li><li>${t('priv_4')}</li></ul></div></section>`;

  /* ---------- student app (phone-style, after login) ---------- */
  const APP = ['dashboard', 'explore', 'report', 'inbox'];
  const ICON = {
    dashboard: '<path d="M12 3 2 8l10 5 8-4v6h2V8L12 3zm-6 9.500V16c0 1.700 2.700 3 6 3s6-1.300 6-3v-3.500l-6 3-6-3z"/>',
    explore: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.500 6.500-2 5-5 2 2-5 5-2z"/>',
    report: '<path d="M11 2v9h9a9 9 0 0 0-9-9zM9 4a9 9 0 1 0 11 11h-9V4z"/>',
    inbox: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 7 8-5H4l8 5zm0 2L4 8v10h16V8l-8 5z"/>'
  };
  const appShell = (st, tab, body) => {
    const nNew = Store.list('notices').filter(n => n.published !== false && (!n.level || n.level === st.cls)).length;
    return `<div class="phone">${body}
      <nav class="tabbar" aria-label="App">${APP.map(k => `<a href="#/${k}" class="${k === tab ? 'on' : ''}">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">${ICON[k]}</svg>
        <span>${t('tab_' + (k === 'dashboard' ? 'home' : k))}</span>${k === 'inbox' && nNew ? '<i class="dot"></i>' : ''}</a>`).join('')}</nav></div>`;
  };
  const needStudent = () => { const st = Store.currentStudent(); if (!st) { location.hash = '#/login'; return null; } return st; };
  const greet = () => { const h = new Date().getHours(); return t(h < 12 ? 'gm' : h < 17 ? 'ga' : 'ge'); };

  function streakInfo(st) {
    const days = new Set(Store.studentLogins(st.email).map(l => new Date(l.at).toDateString()));
    let n = 0; const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    // current week, Saturday first
    const wk = []; const t0 = new Date(); const back = (t0.getDay() + 1) % 7; t0.setDate(t0.getDate() - back);
    for (let i = 0; i < 7; i++) { const x = new Date(t0); x.setDate(t0.getDate() + i); wk.push({ on: days.has(x.toDateString()), today: x.toDateString() === new Date().toDateString() }); }
    return { n, wk };
  }

  V.dashboard = () => {
    const st = needStudent(); if (!st) return '';
    const s = S(), sk = streakInfo(st), mine = Store.db.admissions.filter(a => a.studentId === st.id);
    return appShell(st, 'dashboard', `
      <header class="ph-head"><div class="ph-user"><span class="av">${esc(st.name.trim()[0] || '?').toUpperCase()}</span>
        <div><b>${greet()}, ${esc(st.name.split(' ')[0])}</b><small>${esc(st.school)}</small></div>
        <button class="lang ph-lang" id="langBtn2" type="button">${lang === 'bn' ? 'EN' : 'বাং'}</button></div>
        <div class="chip-sel">${esc(clsLabel(st.cls))}</div></header>
      <div class="ph-body">
        <div class="shortcuts">
          <a href="#/explore"><span class="sc o">📚</span>${t('sc_courses')}</a>
          <a href="#/explore"><span class="sc g">📝</span>${t('sc_book')}</a>
          <a href="#/report"><span class="sc p">📊</span>${t('sc_report')}</a></div>
        <a class="banner" href="#/explore"><small>${t('banner_s')}</small><b>${t('banner_t')}</b><span>${esc(lang === 'bn' ? s.offer_bn : s.offer_en)}</span></a>
        <div class="ph-row"><h3>${t('streak_h')}</h3></div>
        <div class="streak"><div class="streak-t"><b>${num(sk.n)} ${t('streak_d')}</b><small>${sk.n ? t('streak_s') : t('streak_0')}</small></div>
          <div class="wk">${sk.wk.map((d, i) => `<div class="${d.on ? 'on' : ''} ${d.today ? 'today' : ''}"><i>${d.on ? '✓' : ''}</i><span>${I18N[lang].wk[i]}</span></div>`).join('')}</div></div>
        <div class="ph-row"><h3>${t('my_adm')}</h3></div>
        ${mine.length ? mine.map(a => `<div class="li"><div><b>${esc(a.courseTitle)}</b><small>${esc(a.batchLabel)}</small></div><span class="pill ${a.status}">${t('st_' + a.status)}</span></div>`).join('')
          : `<div class="li"><div><small>${t('adm_s')}</small></div><a class="btn xs" href="#/explore">${t('apply_adm')}</a></div>`}
        <p class="center"><a class="small" href="#/home">🌐 ${t('home_site')}</a> • <a class="small" href="#/logout">${t('logout')}</a></p>
      </div>`);
  };
  V.dashboard.after = () => { const b = $('#langBtn2'); if (b) b.addEventListener('click', () => $('#langBtn').click()); };

  V.explore = () => {
    const st = needStudent(); if (!st) return '';
    return appShell(st, 'explore', `
      <header class="ph-head slim"><b>${t('tab_explore')}</b></header>
      <div class="ph-body">
        <form class="card form" id="admForm"><div class="card-b">
          <h3>${t('apply_adm')}</h3><p class="muted small">${t('adm_s')}</p>
          <label>${t('adm_batch')}<select name="course" required>${pub('courses').map(c => `<option value="${c.id}">${esc(L(c, 'title'))}</option>`).join('')}</select></label>
          <label>${t('adm_time')}<select name="batch" required>${Store.list('batches').slice().reverse().map(b =>
            `<option value="${b.id}">${esc(L(b, 'branch'))} — ${esc(L(b, 'days'))}, ${esc(L(b, 'time'))}</option>`).join('')}</select></label>
          <label>${t('adm_note')}<textarea name="note" rows="2"></textarea></label>
          <button class="btn block" type="submit">${t('adm_apply')}</button></div></form>
        <div class="ph-row"><h3>${t('sec_courses')}</h3></div>
        ${pub('courses').map(c => `<div class="li course-li">${img(c.image, '')}<div><b>${esc(L(c, 'title'))}</b><small>${esc(c.level)}</small></div></div>`).join('')}
        <div class="ph-row"><h3>${t('exam')}</h3></div>
        ${pub('exams').map(e => `<div class="li"><div><b>${esc(L(e, 'title'))}</b><small>${fmtDate(e.date)}</small></div>${e.link ? `<a class="btn xs" target="_blank" rel="noopener" href="${esc(e.link)}">${t('exam_open')}</a>` : ''}</div>`).join('') || `<p class="muted small center">${t('none')}</p>`}
      </div>`);
  };
  V.explore.after = () => {
    const form = $('#admForm'); if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const st = Store.currentStudent(), f = Object.fromEntries(new FormData(form));
      const c = Store.list('courses').find(x => x.id === f.course), b = Store.list('batches').find(x => x.id === f.batch);
      Store.addAdmission({
        studentId: st.id, studentName: st.name, phone: st.phone, cls: st.cls, school: st.school,
        courseTitle: L(c, 'title'), batchLabel: `${L(b, 'branch')} — ${L(b, 'days')}, ${L(b, 'time')}`, note: f.note
      });
      toast(t('adm_done')); location.hash = '#/dashboard';
    });
  };

  V.report = () => {
    const st = needStudent(); if (!st) return '';
    const sk = streakInfo(st), mine = Store.db.admissions.filter(a => a.studentId === st.id);
    return appShell(st, 'report', `
      <header class="ph-head slim"><b>${t('tab_report')}</b></header>
      <div class="ph-body"><div class="grid-2 tight">
        <div class="kpi"><b>${num(Store.studentLogins(st.email).length)}</b><span>${t('rep_logins')}</span></div>
        <div class="kpi"><b>${num(sk.n)}</b><span>${t('streak_d')}</span></div>
        <div class="kpi"><b>${num(mine.length)}</b><span>${t('rep_adm')}</span></div>
        <div class="kpi"><b>${num(pub('exams').length)}</b><span>${t('rep_exams')}</span></div></div>
        <p class="muted small center">${t('rep_since')}: ${fmtDate(st.created)}</p></div>`);
  };

  V.inbox = () => {
    const st = needStudent(); if (!st) return '';
    const ns = Store.list('notices').filter(n => n.published !== false && (!n.level || n.level === st.cls));
    return appShell(st, 'inbox', `
      <header class="ph-head slim"><b>${t('inbox_h')}</b><small>${t('inbox_s')}</small></header>
      <div class="ph-body">${ns.map(n => `<div class="li col"><small class="muted">${fmtDate(n.date)}</small><b>${esc(L(n, 'title'))}</b><p>${esc(L(n, 'desc'))}</p></div>`).join('') || `<p class="muted center">${t('no_notice')}</p>`}</div>`);
  };

  V.logout = () => { Store.logout(); location.hash = '#/home'; return ''; };

  V['404'] = () => `<section class="auth"><div class="card"><div class="card-b center"><h1>404</h1><p>${t('n404')}</p><a class="btn" href="#/home">${t('back_home')}</a></div></div></section>`;

  /* ---------- admin panel ---------- */
  let adminTab = 'over';
  const ADMIN_TABS = [['over', 'a_over'], ['students', 'a_students'], ['adm', 'a_adm'], ['msgs', 'a_msgs'], ['courses', 'a_courses'],
    ['blog', 'a_blog'], ['hof', 'a_hof'], ['exams', 'a_exams'], ['batches', 'a_batches'], ['notices', 'a_notices'], ['teacher', 'a_teacher'], ['logins', 'a_logins'], ['settings', 'a_settings']];

  V.admin = () => {
    if (!Store.isAdmin()) {
      return `<section class="auth"><form class="card form" id="loginForm" novalidate><div class="card-b">
        <img class="auth-logo" src="assets/logo.png" alt="" width="64" height="64">
        <h1>${t('a_login_h')}</h1><p class="muted">${t('a_login_s')}</p>
        <label>${t('f_email')}<input name="id" type="email" required autocomplete="username"></label>
        <label>${t('f_pass')}<input name="password" type="password" required autocomplete="current-password"></label>
        <p class="err" id="err" role="alert"></p><button class="btn block" type="submit">${t('login_btn')}</button>
      </div></form></section>`;
    }
    return `<section class="admin"><aside class="a-side"><nav aria-label="Admin">
      ${ADMIN_TABS.map(([k, l]) => `<button class="${k === adminTab ? 'on' : ''}" data-tab="${k}">${t(l)}</button>`).join('')}
      <a href="#/logout">${t('logout')}</a></nav></aside>
      <div class="a-main" id="aMain"></div></section>`;
  };
  V.admin.after = () => {
    if (!Store.isAdmin()) return V.login.after();
    $$('.a-side button').forEach(b => b.addEventListener('click', () => { adminTab = b.dataset.tab; V.admin.refresh(); }));
    V.admin.render();
  };
  V.admin.refresh = () => { $$('.a-side button').forEach(b => b.classList.toggle('on', b.dataset.tab === adminTab)); V.admin.render(); };

  /* field definitions for generic CRUD */
  const F = {
    courses: [['title_en', 't_title_en'], ['title_bn', 't_title_bn'], ['level', 't_level'], ['desc_en', 't_desc_en', 'ta'], ['desc_bn', 't_desc_bn', 'ta'], ['image', 't_image', 'img'], ['published', 't_published', 'bool']],
    blog: [['title_en', 't_title_en'], ['title_bn', 't_title_bn'], ['date', 't_date', 'date'], ['desc_en', 't_desc_en', 'ta'], ['desc_bn', 't_desc_bn', 'ta'], ['image', 't_image', 'img'], ['published', 't_published', 'bool']],
    hof: [['title_en', 't_title_en'], ['title_bn', 't_title_bn'], ['desc_en', 't_desc_en', 'ta'], ['desc_bn', 't_desc_bn', 'ta'], ['image', 't_image', 'img'], ['published', 't_published', 'bool']],
    exams: [['title_en', 't_title_en'], ['title_bn', 't_title_bn'], ['date', 't_date', 'date'], ['level', 't_level'], ['link', 't_link'], ['desc_en', 't_desc_en', 'ta'], ['desc_bn', 't_desc_bn', 'ta'], ['published', 't_published', 'bool']],
    notices: [['title_en', 't_title_en'], ['title_bn', 't_title_bn'], ['date', 't_date', 'date'], ['level', 't_level'], ['desc_en', 't_desc_en', 'ta'], ['desc_bn', 't_desc_bn', 'ta'], ['published', 't_published', 'bool']],
    batches: [['branch_en', 't_name_en'], ['branch_bn', 't_name_bn'], ['days_en', 't_days'], ['days_bn', 't_days'], ['time_en', 't_time'], ['time_bn', 't_time']]
  };
  const COLTITLE = c => (c.title_en ? L(c, 'title') : (c.branch_en ? `${L(c, 'branch')} — ${L(c, 'days')} ${L(c, 'time')}` : ''));

  function fieldHtml([name, label, type], v) {
    const lb = t(label);
    if (type === 'ta') return `<label>${lb}<textarea name="${name}" rows="3">${esc(v)}</textarea></label>`;
    if (type === 'date') return `<label>${lb}<input name="${name}" type="date" value="${esc(v)}"></label>`;
    if (type === 'bool') return `<label class="chk"><input type="checkbox" name="${name}" ${v !== false ? 'checked' : ''}> ${lb}</label>`;
    if (type === 'img') return `<label>${lb}<input name="${name}" value="${esc(v)}" placeholder="assets/… or https://…" data-img><input type="file" accept="image/*" data-file="${name}"><img class="prev" src="${esc(v)}" alt=""></label>`;
    return `<label>${lb}<input name="${name}" value="${esc(v)}"></label>`;
  }

  function openForm(col, item) {
    const dlg = document.createElement('dialog'); dlg.className = 'dlg';
    const it = item || { published: true };
    dlg.innerHTML = `<form method="dialog" class="form"><h3>${item ? t('edit') : t('add')}</h3>
      ${F[col].map(f => fieldHtml(f, it[f[0]] ?? '')).join('')}
      <div class="row end"><button class="btn ghost-d" value="x" type="button" data-x>${t('cancel')}</button><button class="btn" type="submit">${t('save')}</button></div></form>`;
    document.body.appendChild(dlg); dlg.showModal();
    $$('[data-file]', dlg).forEach(inp => inp.addEventListener('change', async () => {
      if (!inp.files[0]) return;
      const url = await Store.fileToDataUrl(inp.files[0]);
      const tgt = $(`[name="${inp.dataset.file}"]`, dlg); tgt.value = url; inp.nextElementSibling.src = url;
    }));
    $('[data-x]', dlg).onclick = () => { dlg.close(); dlg.remove(); };
    dlg.addEventListener('close', () => dlg.remove());
    $('form', dlg).addEventListener('submit', e => {
      e.preventDefault();
      const out = { ...it };
      F[col].forEach(([n, , ty]) => { const el = $(`[name="${n}"]`, dlg); out[n] = ty === 'bool' ? el.checked : el.value.trim(); });
      Store.upsert(col, out); dlg.close(); toast(t('saved')); V.admin.render();
    });
  }

  function crudView(col) {
    const rows = Store.list(col);
    return `<div class="a-bar"><h2>${t('a_' + (col === 'adm' ? 'adm' : col))}</h2><button class="btn sm" data-add>${t('add')}</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${t('t_title_en')}</th><th>${t('t_published')}</th><th>${t('actions')}</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${r.image ? `<img class="thumb" src="${esc(r.image)}" alt="">` : ''}</td><td>${esc(COLTITLE(r))}</td>
      <td>${r.published === undefined ? '—' : (r.published ? t('yes') : t('no'))}</td>
      <td class="acts"><button class="btn xs" data-edit="${r.id}">${t('edit')}</button><button class="btn xs danger" data-del="${r.id}">${t('del')}</button></td></tr>`).join('')}
    </tbody></table></div>${rows.length ? '' : empty()}`;
  }

  function csv(rows, name) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const keys = Object.keys(rows[0] || {}).filter(k => k !== 'hash');
    const body = [keys.join(','), ...rows.map(r => keys.map(k => q(r[k])).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv' })); a.download = name; a.click();
  }

  V.admin.render = () => {
    const el = $('#aMain'); if (!el) return;
    const db = Store.db;
    let h = '';
    if (adminTab === 'over') {
      const s = Store.stats();
      h = `<div class="a-bar"><h2>${t('a_over')}</h2></div><div class="grid-4 kpis">
        <div class="kpi"><b>${num(s.students)}</b><span>${t('a_total_students')}</span></div>
        <div class="kpi"><b>${num(s.logins)}</b><span>${t('a_total_logins')}</span></div>
        <div class="kpi"><b>${num(s.today)}</b><span>${t('a_today')}</span></div>
        <div class="kpi"><b>${num(s.pending)}</b><span>${t('a_pending')}</span></div>
        <div class="kpi"><b>${num(s.unread)}</b><span>${t('a_unread')}</span></div></div>
        <p class="note">${t('data_note')}</p>`;
    } else if (adminTab === 'students') {
      h = `<div class="a-bar"><h2>${t('a_students')}</h2><div class="row"><input id="q" class="srch" placeholder="${t('a_search')}"><button class="btn sm ghost-d" data-csv>${t('a_export')}</button></div></div>
        <div class="tbl-wrap"><table class="tbl" id="stTbl"><thead><tr><th>${t('f_name')}</th><th>${t('f_phone')} / ${t('f_email')}</th><th>${t('class_')}</th><th>${t('school')}</th><th>${t('created')}</th><th>${t('actions')}</th></tr></thead><tbody>
        ${db.students.map(s => `<tr data-s="${esc((s.name + s.phone + s.email + s.school).toLowerCase())}"><td>${esc(s.name)}${s.blocked ? ' 🚫' : ''}</td><td>${esc(s.phone)}<br><small>${esc(s.email)}</small></td><td>${esc(clsLabel(s.cls))}</td><td>${esc(s.school)}</td><td>${fmtDate(s.created)}</td>
        <td class="acts"><button class="btn xs" data-block="${s.id}">${s.blocked ? t('a_unblock') : t('a_block')}</button><button class="btn xs danger" data-delst="${s.id}">${t('del')}</button></td></tr>`).join('')}
        </tbody></table></div>${db.students.length ? '' : empty()}`;
    } else if (adminTab === 'adm') {
      h = `<div class="a-bar"><h2>${t('a_adm')}</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('f_name')}</th><th>${t('adm_batch')}</th><th>${t('adm_status')}</th><th>${t('actions')}</th></tr></thead><tbody>
        ${db.admissions.map(a => `<tr><td>${esc(a.studentName)}<br><small>${esc(a.phone)} • ${esc(clsLabel(a.cls))}</small></td><td>${esc(a.courseTitle)}<br><small>${esc(a.batchLabel)}</small>${a.note ? `<br><small>“${esc(a.note)}”</small>` : ''}</td>
        <td><span class="pill ${a.status}">${t('st_' + a.status)}</span></td>
        <td class="acts"><button class="btn xs" data-adm="${a.id}:approved">${t('a_approve')}</button><button class="btn xs danger" data-adm="${a.id}:rejected">${t('a_reject')}</button></td></tr>`).join('')}</tbody></table></div>${db.admissions.length ? '' : empty()}`;
    } else if (adminTab === 'msgs') {
      h = `<div class="a-bar"><h2>${t('a_msgs')}</h2></div>` + (db.messages.map(m => `<div class="card msg ${m.read ? '' : 'new'}"><div class="card-b">
        <b>${esc(m.name)}</b> • <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a> <small class="muted">${fmtDT(m.at)}</small><br>
        <small class="muted">${esc(clsLabel(m.cls))} ${esc(m.school || '')} ${esc(m.college || '')}</small><p>${esc(m.message)}</p>
        ${m.read ? '' : `<button class="btn xs" data-read="${m.id}">${t('a_mark_read')}</button>`}</div></div>`).join('') || empty());
    } else if (F[adminTab]) {
      h = crudView(adminTab);
    } else if (adminTab === 'teacher') {
      const T = db.teacher;
      h = `<div class="a-bar"><h2>${t('a_teacher')}</h2></div><form class="card form" id="tForm"><div class="card-b">
        ${fieldHtml(['name_en', 't_name_en'], T.name_en)}${fieldHtml(['name_bn', 't_name_bn'], T.name_bn)}
        ${fieldHtml(['role_en', 'teacher_role'], T.role_en)}${fieldHtml(['role_bn', 'teacher_role'], T.role_bn)}
        ${fieldHtml(['bio_en', 'teacher_bio', 'ta'], T.bio_en)}${fieldHtml(['bio_bn', 'teacher_bio', 'ta'], T.bio_bn)}
        ${fieldHtml(['photo', 'teacher_photo', 'img'], T.photo)}<button class="btn" type="submit">${t('save')}</button></div></form>`;
    } else if (adminTab === 'logins') {
      h = `<div class="a-bar"><h2>${t('a_logins')}</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('a_when')}</th><th>${t('a_who')}</th><th>${t('a_role')}</th></tr></thead><tbody>
        ${db.logins.slice(0, 200).map(l => `<tr><td>${fmtDT(l.at)}</td><td>${esc(l.who)}</td><td>${esc(l.role)}</td></tr>`).join('')}</tbody></table></div>`;
    } else if (adminTab === 'settings') {
      const s = db.settings;
      h = `<div class="a-bar"><h2>${t('a_settings')}</h2></div><form class="card form" id="sForm"><div class="card-b">
        <label>${t('s_phones')}<textarea name="phones" rows="3">${esc(s.phones.join('\n'))}</textarea></label>
        <label>${t('s_email')}<input name="email" value="${esc(s.email)}"></label>
        <label>${t('s_whatsapp')}<input name="whatsapp" value="${esc(s.whatsapp)}"></label>
        <label>${t('s_youtube')}<input name="youtube" value="${esc(s.youtube)}"></label>
        <label>${t('s_facebook')}<input name="facebook" value="${esc(s.facebook)}"></label>
        <label>${t('s_start')}<input name="start" type="date" value="${esc(s.start)}"></label>
        <label>${t('s_offer_en')}<input name="offer_en" value="${esc(s.offer_en)}"></label>
        <label>${t('s_offer_bn')}<input name="offer_bn" value="${esc(s.offer_bn)}"></label>
        <button class="btn" type="submit">${t('save')}</button></div></form>
        <form class="card form" id="pForm"><div class="card-b"><h3>${t('s_pass')}</h3>
        <label>${t('s_pass_new')}<input name="p" type="password" minlength="6" autocomplete="new-password"></label>
        <button class="btn" type="submit">${t('save')}</button></div></form>`;
    }
    el.innerHTML = h; bindAdmin(el);
  };

  function bindAdmin(el) {
    const on = (sel, fn) => $$(sel, el).forEach(b => b.addEventListener('click', () => fn(b)));
    on('[data-add]', () => openForm(adminTab));
    on('[data-edit]', b => openForm(adminTab, Store.list(adminTab).find(x => x.id === b.dataset.edit)));
    on('[data-del]', b => { if (confirm(t('confirm_del'))) { Store.remove(adminTab, b.dataset.del); toast(t('deleted')); V.admin.render(); } });
    on('[data-block]', b => { const s = Store.db.students.find(x => x.id === b.dataset.block); Store.setBlocked(s.id, !s.blocked); V.admin.render(); });
    on('[data-delst]', b => { if (confirm(t('confirm_del'))) { Store.removeStudent(b.dataset.delst); toast(t('deleted')); V.admin.render(); } });
    on('[data-adm]', b => { const [id, st] = b.dataset.adm.split(':'); Store.setAdmission(id, st); V.admin.render(); });
    on('[data-read]', b => { Store.markRead(b.dataset.read); V.admin.render(); });
    on('[data-csv]', () => csv(Store.db.students, 'students.csv'));
    const q = $('#q', el); if (q) q.addEventListener('input', () => $$('#stTbl tbody tr', el).forEach(r => r.style.display = r.dataset.s.includes(q.value.toLowerCase()) ? '' : 'none'));
    $$('[data-file]', el).forEach(inp => inp.addEventListener('change', async () => {
      if (!inp.files[0]) return; const url = await Store.fileToDataUrl(inp.files[0], 600);
      $(`[name="${inp.dataset.file}"]`, el).value = url; inp.nextElementSibling.src = url;
    }));
    const tf = $('#tForm', el); if (tf) tf.addEventListener('submit', e => { e.preventDefault(); Store.setTeacher(Object.fromEntries(new FormData(tf))); toast(t('saved')); });
    const sf = $('#sForm', el); if (sf) sf.addEventListener('submit', e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(sf));
      f.phones = f.phones.split('\n').map(x => x.trim()).filter(Boolean); Store.setSettings(f); chrome(); toast(t('saved'));
    });
    const pf = $('#pForm', el); if (pf) pf.addEventListener('submit', async e => {
      e.preventDefault(); const p = pf.p.value; if (p.length < 6) return toast(t('pass_short'));
      await Store.setAdminPassword(p); pf.reset(); toast(t('saved'));
    });
  }

  /* ---------- router ---------- */
  function route() {
    let name = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
    const view = V[name] || V['404'];
    if (!V[name]) name = '404';
    document.body.classList.toggle('app', APP.includes(name));
    const html = view();
    if (name === 'logout') return;
    $('#main').innerHTML = html;
    chrome();
    if (view.after) view.after();
    window.scrollTo(0, 0);
    $('#menu').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
    $$('.menu > a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + name));
    observe();
    document.title = 'Sohag Physics — ' + (name === 'home' ? 'Academic & Admission Care' : name.replace('-', ' '));
  }

  /* ---------- effects ---------- */
  let io;
  function observe() {
    if (io) io.disconnect();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      if (el.matches('.reveal')) el.classList.add('in');
      if (el.matches('[data-count]')) {
        const to = +el.dataset.count, plus = 'plus' in el.dataset;
        if (reduce) { el.textContent = num(to) + (plus ? '+' : ''); return; }
        const t0 = performance.now(), d = 1200;
        (function step(n) { const p = Math.min(1, (n - t0) / d); el.textContent = num(Math.round(to * (1 - Math.pow(1 - p, 3)))) + (p === 1 && plus ? '+' : ''); if (p < 1) requestAnimationFrame(step); })(t0);
      }
    }), { threshold: .15 });
    $$('.reveal,[data-count]').forEach(el => io.observe(el));
  }

  /* ---------- boot ---------- */
  $('#langBtn').addEventListener('click', () => { lang = lang === 'bn' ? 'en' : 'bn'; localStorage.setItem('sp_lang', lang); route(); });
  $('#burger').addEventListener('click', () => { const o = $('#menu').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); });
  document.documentElement.dataset.theme = 'light';
  $$('.dd-btn').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));
  document.addEventListener('click', e => { if (!e.target.closest('.dd')) $$('.dd').forEach(d => d.classList.remove('open')); });
  window.addEventListener('hashchange', route);
  route();
})();
