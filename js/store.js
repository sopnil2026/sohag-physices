/* Data layer. Currently backed by localStorage so the site works on GitHub Pages
   with no server. Every call goes through Store.*, so a real backend
   (Supabase / PostgreSQL / your own API) can replace this file later without touching the UI. */
(function () {
  const KEY = 'sp_db_v1', SESS = 'sp_session_v1';
  // SHA-256 of the admin password (not stored as plain text). Change it in Admin → Site Settings.
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_HASH = 'e31f6542b54cd689b02cf9055fbeb4a12fa5ffe3909fafc24588e21a7b116728';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toISOString();

  async function sha256(s) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { // very old / insecure-context fallback
      let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
    }
  }

  function seed() {
    return {
      v: 1,
      admin: { email: ADMIN_EMAIL, hash: ADMIN_HASH },
      settings: {
        phones: ['01726 69 45 46', '01789 53 92 92', '01780 57 18 35'],
        email: 'sohagphysics18@gmail.com',
        whatsapp: '8801780571835',
        youtube: 'https://www.youtube.com/@SohagPhysicsYT',
        facebook: '',
        website: 'sohagphysics.com',
        start: '2026-06-15',
        offer_en: 'Admission without the 500৳ fee until June 2026',
        offer_bn: 'জুন ২০২৬ পর্যন্ত ৫০০ টাকা ছাড়ে ভর্তি'
      },
      teacher: {
        name_en: 'Sohag Prodhan', name_bn: 'সোহাগ প্রধান',
        role_en: 'Physics Teacher & Founder, Sohag Physics', role_bn: 'পদার্থবিজ্ঞান শিক্ষক ও প্রতিষ্ঠাতা, সোহাগ ফিজিক্স',
        bio_en: 'Teaching physics for SSC, HSC, Medical, University and Engineering admission for 13 years. Believes physics must be understood, not memorised.',
        bio_bn: '১৩ বছর ধরে SSC, HSC, মেডিকেল, ভার্সিটি ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতির জন্য পদার্থবিজ্ঞান পড়াচ্ছেন। বিশ্বাস করেন ফিজিক্স মুখস্থ নয়, অনুভবের বিষয়।',
        photo: 'assets/teacher.png'
      },
      batches: [
        { id: 'b1', branch_en: 'Jaleshworitola', branch_bn: 'জলেশ্বরীতলা', days_en: 'Sat-Mon-Wed', days_bn: 'শনি-সোম-বুধ', time_en: '3:00 PM', time_bn: 'বিকাল ৩টা' },
        { id: 'b2', branch_en: 'Jaleshworitola', branch_bn: 'জলেশ্বরীতলা', days_en: 'Sat-Mon-Wed', days_bn: 'শনি-সোম-বুধ', time_en: '4:00 PM', time_bn: 'বিকাল ৪টা' },
        { id: 'b3', branch_en: 'Jaleshworitola', branch_bn: 'জলেশ্বরীতলা', days_en: 'Sun-Tue-Thu', days_bn: 'রবি-মঙ্গল-বৃহঃ', time_en: '4:00 PM', time_bn: 'বিকাল ৪টা' },
        { id: 'b4', branch_en: 'Kalitola', branch_bn: 'কালিতলা', days_en: 'Sat-Mon-Wed', days_bn: 'শনি-সোম-বুধ', time_en: '7:00 AM', time_bn: 'সকাল ৭টা' },
        { id: 'b5', branch_en: 'Kalitola', branch_bn: 'কালিতলা', days_en: 'Sun-Tue-Thu', days_bn: 'রবি-মঙ্গল-বৃহঃ', time_en: '8:00 AM', time_bn: 'সকাল ৮টা' },
        { id: 'b6', branch_en: 'Kalitola', branch_bn: 'কালিতলা', days_en: 'Sat-Mon-Wed', days_bn: 'শনি-সোম-বুধ', time_en: '8:00 AM', time_bn: 'সকাল ৮টা' }
      ],
      courses: [
        { id: 'c1', level: 'HSC', title_en: 'HSC-28 Physics (Private Batch)', title_bn: 'HSC-28 পদার্থবিজ্ঞান (প্রাইভেট ব্যাচ)',
          desc_en: 'Theory, 100+ numerical & CQ practice per chapter, admission question practice, weekly & monthly exams, offline + HD recorded online class.',
          desc_bn: 'থিউরি, প্রতি অধ্যায়ে ১০০+ গাণিতিক ও CQ প্র্যাকটিস, এডমিশন কোশ্চেন প্র্যাকটিস, সাপ্তাহিক ও মাসিক এক্সাম, অফলাইন + HD রেকর্ডেড অনলাইন ক্লাস।',
          image: 'assets/poster-hsc28.png', published: true },
        { id: 'c2', level: 'SSC', title_en: 'SSC-26 Physics', title_bn: 'SSC-26 পদার্থবিজ্ঞান',
          desc_en: 'Concept-first physics for SSC with simulation and animation. The new batch starts after the SSC result, with college classes following.',
          desc_bn: 'সিমুলেশন ও অ্যানিমেশনসহ SSC পদার্থবিজ্ঞান। নতুন ব্যাচ SSC রেজাল্টের পর শুরু হবে, পরে কলেজ ক্লাস।',
          image: 'assets/flyer.png', published: true },
        { id: 'c3', level: 'Admission', title_en: 'Medical, University & Engineering Admission', title_bn: 'মেডিকেল, ভার্সিটি ও ইঞ্জিনিয়ারিং এডমিশন',
          desc_en: 'Admission question practice and model tests for Medical, Varsity and Engineering admission.',
          desc_bn: 'মেডিকেল, ভার্সিটি ও ইঞ্জিনিয়ারিং ভর্তির জন্য প্রশ্ন প্র্যাকটিস ও মডেল টেস্ট।',
          image: 'assets/event.png', published: true },
        { id: 'c4', level: '9-10', title_en: 'Class 9 & 10 Physics', title_bn: 'নবম–দশম শ্রেণি পদার্থবিজ্ঞান',
          desc_en: 'Strong foundation in physics for Class 9 and 10 students.',
          desc_bn: 'নবম ও দশম শ্রেণির শিক্ষার্থীদের জন্য ফিজিক্সের শক্ত ভিত্তি।',
          image: 'assets/logo.png', published: true }
      ],
      blog: [
        { id: 'p1', date: '2026-06-01', title_en: 'HSC-28 physics batch: admission is open', title_bn: 'HSC-28 পদার্থবিজ্ঞান ব্যাচে ভর্তি চলছে',
          desc_en: 'Classes start on 15 June 2026 (Monday) at both branches. Admission without the 500৳ fee until June.',
          desc_bn: '১৫ জুন ২০২৬ (সোমবার) থেকে দুই শাখাতেই ক্লাস শুরু। জুন মাস পর্যন্ত ৫০০ টাকা ছাড়ে ভর্তি।',
          image: 'assets/poster-hsc28.png', published: true },
        { id: 'p2', date: '2026-05-20', title_en: 'Why physics should be felt, not memorised', title_bn: 'ফিজিক্স কেন মুখস্থ নয়, অনুভবের বিষয়',
          desc_en: 'Understanding the idea behind a formula makes problems easy. That is why our classes use simulations and animation.',
          desc_bn: 'সূত্রের পেছনের ধারণা বুঝলে সমস্যা সহজ হয়। তাই আমাদের ক্লাসে সিমুলেশন ও অ্যানিমেশন ব্যবহার করা হয়।',
          image: 'assets/flyer.png', published: true }
      ],
      hof: [
        { id: 'h1', title_en: 'Felicitation & Guideline Program', title_bn: 'সংবর্ধনা ও গাইডলাইন অনুষ্ঠান',
          desc_en: 'Honouring our successful students with a guideline session.', desc_bn: 'কৃতি শিক্ষার্থীদের সংবর্ধনা ও গাইডলাইন অনুষ্ঠান।',
          image: 'assets/event.png', published: true }
      ],
      exams: [],
      notices: [
        { id: 'n1', date: '2026-06-01', level: '', title_en: 'Welcome to Sohag Physics', title_bn: 'সোহাগ ফিজিক্সে স্বাগতম', desc_en: 'Apply for admission from the Explore tab. Classes start 15 June.', desc_bn: 'এক্সপ্লোর ট্যাব থেকে ভর্তির আবেদন করো। ক্লাস শুরু ১৫ জুন।', published: true }
      ],
      students: [], admissions: [], messages: [], logins: []
    };
  }

  let db;
  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.v) { db = seed(); persist(); }
    if (!db.notices) db.notices = [];
    return db;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { alert('Storage is full. Use smaller images or delete old items.'); }
  }
  load();

  const norm = s => (s || '').trim().toLowerCase();
  const normPhone = s => (s || '').replace(/[^\d]/g, '').replace(/^88/, '');

  const Store = {
    get db() { return db; },
    reset() { db = seed(); persist(); },
    uid,

    /* ---------- generic collection CRUD (courses, blog, hof, exams, batches) ---------- */
    list(col) { return db[col]; },
    upsert(col, item) {
      if (!item.id) { item.id = uid(); db[col].unshift(item); }
      else { const i = db[col].findIndex(x => x.id === item.id); if (i >= 0) db[col][i] = item; else db[col].unshift(item); }
      persist(); return item;
    },
    remove(col, id) { db[col] = db[col].filter(x => x.id !== id); persist(); },
    setSettings(s) { Object.assign(db.settings, s); persist(); },
    setTeacher(t) { Object.assign(db.teacher, t); persist(); },

    /* ---------- session ---------- */
    session() { try { return JSON.parse(localStorage.getItem(SESS)); } catch (e) { return null; } },
    currentStudent() { const s = Store.session(); return s && s.role === 'student' ? db.students.find(x => x.id === s.id) : null; },
    isAdmin() { const s = Store.session(); return !!(s && s.role === 'admin'); },
    logout() { localStorage.removeItem(SESS); },
    _log(who, role) { db.logins.unshift({ id: uid(), at: now(), who, role }); db.logins = db.logins.slice(0, 1000); },

    /* ---------- auth ---------- */
    async register(f) {
      const email = norm(f.email), phone = normPhone(f.phone);
      if (db.students.some(s => norm(s.email) === email || normPhone(s.phone) === phone)) return { ok: false, err: 'exists' };
      const st = {
        id: uid(), name: f.name.trim(), phone: f.phone.trim(), email, school: (f.school || '').trim(), college: (f.college || '').trim(),
        cls: f.cls, hash: await sha256(f.password), blocked: false, created: now(), lastLogin: now(), logins: 1
      };
      db.students.unshift(st); Store._log(st.email, 'student'); persist();
      localStorage.setItem(SESS, JSON.stringify({ role: 'student', id: st.id }));
      return { ok: true, student: st };
    },
    async login(idf, password) {
      const id = norm(idf), h = await sha256(password);
      if (id === norm(db.admin.email)) {
        if (h !== db.admin.hash) return { ok: false, err: 'bad' };
        Store._log(db.admin.email, 'admin'); persist();
        localStorage.setItem(SESS, JSON.stringify({ role: 'admin' }));
        return { ok: true, role: 'admin' };
      }
      const st = db.students.find(s => norm(s.email) === id || (normPhone(idf) && normPhone(s.phone) === normPhone(idf)));
      if (!st || st.hash !== h) return { ok: false, err: 'bad' };
      if (st.blocked) return { ok: false, err: 'blocked' };
      st.lastLogin = now(); st.logins = (st.logins || 0) + 1; Store._log(st.email, 'student'); persist();
      localStorage.setItem(SESS, JSON.stringify({ role: 'student', id: st.id }));
      return { ok: true, role: 'student' };
    },
    async setAdminPassword(p) { db.admin.hash = await sha256(p); persist(); },

    /* ---------- students / admissions / messages ---------- */
    removeStudent(id) { db.students = db.students.filter(x => x.id !== id); db.admissions = db.admissions.filter(a => a.studentId !== id); persist(); },
    setBlocked(id, v) { const s = db.students.find(x => x.id === id); if (s) { s.blocked = v; persist(); } },
    updateStudent(id, patch) { const s = db.students.find(x => x.id === id); if (s) { Object.assign(s, patch); persist(); } },
    addAdmission(a) { a.id = uid(); a.at = now(); a.status = 'pending'; db.admissions.unshift(a); persist(); return a; },
    setAdmission(id, status) { const a = db.admissions.find(x => x.id === id); if (a) { a.status = status; persist(); } },
    addMessage(m) { m.id = uid(); m.at = now(); m.read = false; db.messages.unshift(m); persist(); },
    markRead(id) { const m = db.messages.find(x => x.id === id); if (m) { m.read = true; persist(); } },

    studentLogins(email) { return db.logins.filter(l => l.who === email && l.role === 'student'); },

    /* ---------- helpers ---------- */
    stats() {
      const today = new Date().toDateString();
      return {
        students: db.students.length,
        logins: db.logins.length,
        today: db.logins.filter(l => new Date(l.at).toDateString() === today).length,
        pending: db.admissions.filter(a => a.status === 'pending').length,
        unread: db.messages.filter(m => !m.read).length
      };
    },
    fileToDataUrl(file, max = 1200) { // resize uploaded images so storage stays small
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onerror = rej;
        r.onload = () => {
          const img = new Image();
          img.onerror = rej;
          img.onload = () => {
            const k = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.82));
          };
          img.src = r.result;
        };
        r.readAsDataURL(file);
      });
    }
  };
  window.Store = Store;
})();
