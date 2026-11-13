/* صحبة — front-end (Vanilla JS). Routes: #  ·  #t-<track>  ·  #l-<lesson> */
(() => {
  'use strict';
  const $app = document.getElementById('app');
  const PREVIEW = window.__SOHBA_DATA__ || null;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const done = () => new Set(store.get('sohba-done', []));
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- data: real API, or embedded content in preview ---------- */
  async function api(path) {
    if (PREVIEW) return localApi(path);
    const r = await fetch('/api' + path);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  function localApi(path) {
    const D = PREVIEW;
    const src = (k) => D.sources.find((s) => s.key === k);
    const lessonsOf = (t) => D.lessons.filter((l) => l.track === t).sort((a, b) => a.sort - b.sort);
    const toBlock = ({ type, source, ...content }) => ({ type, content, source: source ? src(source).title : null, source_ref: source ? src(source).ref ?? null : null });
    let m;
    const metaOf = (l) => {
      const q = l.blocks.filter((b) => b.type === 'quran' && b.surah && b.ayah);
      return q.length ? { surah: q[0].surah, ayat: q.length, words: q.reduce((n, b) => n + b.body.split(/\s+/).filter((w) => /[\u0621-\u064A]/.test(w)).length, 0) } : {};
    };
    if (path === '/tracks') return D.tracks.filter((t) => t.is_listed !== false).map((t) => ({ ...t, lessons: lessonsOf(t.slug).length, slugs: lessonsOf(t.slug).map((l) => l.slug) }));
    if (path === '/seasons') return D.seasons.map((s) => {
      const l = D.lessons.find((x) => x.slug === s.lesson);
      return { key: s.key, rule: s.rule, theme: s.theme ?? null, lesson: l.slug, title: l.title, summary: l.summary,
        ticker: l.blocks.filter((b) => b.type === 'ticker').flatMap((b) => b.items) };
    });
    if ((m = path.match(/^\/tracks\/([a-z0-9-]+)$/))) {
      const t = D.tracks.find((x) => x.slug === m[1] && x.is_available);
      if (!t) throw new Error(404);
      return { ...t, chapters: t.chapters || [], lessons: lessonsOf(t.slug).map((l) => ({ slug: l.slug, title: l.title, summary: l.summary, status: l.status, chapter: l.chapter ?? null, meta: metaOf(l) })) };
    }
    if ((m = path.match(/^\/lessons\/([a-z0-9-]+)$/))) {
      const l = D.lessons.find((x) => x.slug === m[1]);
      if (!l) throw new Error(404);
      const sib = lessonsOf(l.track); const nx = sib[sib.indexOf(l) + 1];
      const tr = D.tracks.find((t) => t.slug === l.track);
      return { slug: l.slug, title: l.title, summary: l.summary, status: l.status, track: l.track, chapter: l.chapter ?? null, meta: metaOf(l),
        chapter_title: (tr.chapters || []).find((c) => c.key === l.chapter)?.title ?? null,
        track_title: D.tracks.find((t) => t.slug === l.track).title, blocks: l.blocks.map(toBlock),
        next: nx ? { slug: nx.slug, title: nx.title } : null };
    }
    if (path === '/daily') {
      const all = D.lessons.flatMap((l) => l.blocks.map((b) => ({ ...toBlock(b), lesson: l.slug, lesson_title: l.title })));
      const day = Math.floor(Date.now() / 864e5);
      const pick = (t) => { const xs = all.filter((b) => b.type === t && (t !== 'quran' || b.content.ayah)); return xs.length ? xs[day % xs.length] : null; };
      return { ayah: pick('quran'), dua: pick('dua') };
    }
    throw new Error(404);
  }

  /* ---------- icons (no people, ever) ---------- */
  const ICONS = {
    sprout: '<path d="M16 28V14"/><path d="M16 18c-5 0-8-3-8-8 5 0 8 3 8 8z"/><path d="M16 15c0-5 3-8 8-8 0 5-3 8-8 8z"/><path d="M9 28h14"/>',
    crown: '<path d="M6 23l-2-12 7 5 5-9 5 9 7-5-2 12z"/><path d="M6 27h20"/>',
    arch: '<path d="M7 28V15a9 9 0 0 1 18 0v13"/><path d="M12 28v-9a4 4 0 0 1 8 0v9"/><path d="M4 28h24"/>',
    wave: '<path d="M4 16c3-5 5-5 8 0s5 5 8 0 5-5 8 0"/><path d="M8 23c2-2 4-2 6 0" opacity=".5"/>',
    heart: '<path d="M16 27s-10-6-10-13a6 6 0 0 1 10-4 6 6 0 0 1 10 4c0 7-10 13-10 13z"/><path d="M13 15l3 3 3-3"/>',
    pair: '<circle cx="11" cy="16" r="6" stroke-dasharray="2 2.5"/><circle cx="21" cy="16" r="6"/>',
    one: '<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="2.5"/>',
    none: '<circle cx="16" cy="16" r="10"/><path d="M9 23L23 9"/>',
    star: '<path d="M16 5l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L16 21.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"/>',
    sun: '<path d="M4 22h24"/><path d="M9 22a7 7 0 0 1 14 0"/><path d="M16 8v3M8 12l2 2M24 12l-2 2"/>',
    moon: '<path d="M21 6a10 10 0 1 0 5 15A8 8 0 0 1 21 6z"/>',
    knot: '<path d="M6 16h20"/><circle cx="12" cy="16" r="3"/><circle cx="20" cy="16" r="3"/>',
    eye: '<path d="M4 16s4-7 12-7 12 7 12 7-4 7-12 7S4 16 4 16z"/><circle cx="16" cy="16" r="3"/>',
  };
  const icon = (k, color) => `<svg viewBox="0 0 32 32" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ''}</svg>`;
  const TRACK_MARK = { start: '١', quran: '﴿﴾', sunnah: '٤٠', seerah: '✦', listen: '🎧' };

  const srcLine = (b) => b.source ? `<span class="src">المصدر: ${esc(b.source)}${b.source_ref ? ' · ' + esc(b.source_ref) : ''}${b.content.ref ? ' · ' + esc(b.content.ref) : ''}</span>` : '';
  const footer = () => `
    <div class="foot">
      عندك سؤال في الدين؟ اسأل المتخصصين: <a href="https://www.dar-alifta.org" target="_blank" rel="noopener">دار الإفتاء المصرية</a><br>
      صحبة · من ماو سوليوشنز
    </div>`;

  /* ---------- seasons: rules evaluated on the user's own date (and hijri date) ---------- */
  // ?date=2027-02-15 lets us preview a season on any day.
  const today = () => {
    const q = new URLSearchParams(location.search).get('date');
    const d = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? new Date(q + 'T12:00:00') : new Date();
    return isNaN(d) ? new Date() : d;
  };
  function hijri(date) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric' }).formatToParts(date);
      const get = (t) => Number(parts.find((p) => p.type === t)?.value);
      return { month: get('month'), day: get('day') };
    } catch { return null; } // old browser without the hijri calendar: hijri seasons just don't show
  }
  function isActive(rule, now) {
    if (rule.always) return true;
    if (rule.weekday !== undefined) return now.getDay() === rule.weekday;
    if (rule.hijri_month) {
      // shift: correct a day when Egypt's moon sighting differs from Umm al-Qura
      const h = hijri(new Date(now.getTime() + (rule.shift || 0) * 864e5));
      return !!h && h.month === rule.hijri_month && h.day >= (rule.from || 1) && h.day <= (rule.to || 30);
    }
    return false;
  }
  async function activeSeasons() {
    const all = await api('/seasons').catch(() => []);
    const now = today();
    const on = all.filter((s) => isActive(s.rule, now));
    const theme = on.find((s) => s.theme)?.theme;
    if (theme) document.body.dataset.theme = theme; else delete document.body.dataset.theme;
    return on;
  }
  const ticker = (items) => {
    if (!items.length) return '';
    let run = items; // each run must be wider than the screen for a seamless loop
    while (run.join('').length < 140) run = run.concat(items);
    return ticker_(run);
  };
  const ticker_ = (items) => `
    <div class="ticker" role="marquee" aria-label="تذكير">
      <div class="tk-track">${[0, 1].map((k) => `<div class="tk-run"${k ? ' aria-hidden="true"' : ''}>${items.map((x) => `<span>${esc(x)}</span>`).join('<i>✦</i>')}<i>✦</i></div>`).join('')}</div>
    </div>`;

  /* ---------- views ---------- */
  async function home() {
    const [tracks, daily, seasons] = await Promise.all([api('/tracks'), api('/daily'), activeSeasons()]);
    const featured = seasons.filter((s) => !s.rule.always);
    const due = dueReviews(), act = pendingAction(), last = store.get('sohba-last', null), dn = done();
    const cur = (last && tracks.some((t) => t.slug === last.track)) ? last.track
      : tracks.find((t) => t.is_available && t.slugs.some((x) => !dn.has(x)))?.slug;
    const d = daily.ayah ? `
      <div class="card daily">
        <div class="d-ayah">${esc(daily.ayah.content.body)} <span class="anum">﴿${AR(daily.ayah.content.ayah ?? '')}﴾</span></div>
        <div class="meta">${esc(daily.ayah.lesson_title)}</div>
        ${daily.dua ? `<hr><div class="dua">${esc(daily.dua.content.body)}</div><div class="meta">${esc(daily.dua.content.title || '')} · ${esc(daily.dua.lesson_title)}</div>` : ''}
      </div>` : '';
    return `
      <header class="hero">
        <span class="pill-tag">نسخة تجريبية</span>
        <h1>صحبة</h1>
        <div class="tag">صاحبك في طريقك لربنا، من أول خطوة</div>
      </header>
      ${ticker(seasons.flatMap((s) => s.ticker))}
      ${last ? `<a class="card resume" href="#l-${esc(last.slug)}"><div><span class="k">كمّل من مكان ما وقفت</span><h3>${esc(last.title)}</h3><p>${esc(last.where || '')}</p></div><span class="go">‹</span></a>` : ''}
      ${act ? `<div class="card act-ask"><div class="k">${act.day === dayNum() - 1 ? 'امبارح' : 'قبل كده'} قلت هتعمل:</div>
        <p>${esc(act.body)}</p><p class="from">من درس «${esc(act.title)}»</p>
        <div class="row"><button class="btn pri" data-a="done">الحمد لله، عملتها</button><button class="btn sec" data-a="later">لسه، هحاول النهارده</button></div></div>` : ''}
      ${due.length ? `<a class="card due" href="#review"><div><h3>مراجعة النهارده</h3><p>${AR(due.length)} ${due.length === 1 ? 'درس مستنيك' : 'دروس مستنيينك'} · دقيقتين بس</p></div><span class="go">‹</span></a>` : ''}
      ${featured.map((s) => `
        <a class="card season" href="#l-${esc(s.lesson)}">
          <div><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p></div><span class="go">‹</span>
        </a>`).join('')}
      <div class="label">طريقك</div>
      <div class="road">${tracks.map((t) => {
        const n = t.slugs.length, k = t.slugs.filter((x) => dn.has(x)).length;
        const state = !t.is_available ? 'soon' : n && k === n ? 'done' : t.slug === cur ? 'cur' : '';
        return `<a class="stop ${state}" href="${t.is_available ? '#t-' + esc(t.slug) : '#'}">
          <span class="pin">${state === 'done' ? '✓' : TRACK_MARK[t.slug] || '•'}</span>
          <span class="sb"><b>${esc(t.title)}</b>${state === 'cur' ? '<em>إنت هنا</em>' : ''}${state === 'soon' ? '<em class="soon">قريبًا</em>' : ''}
            <small>${esc(t.subtitle)}</small>
            ${n ? `<span class="prog"><i style="width:${Math.round((k * 100) / n)}%"></i></span><small>${AR(k)} من ${AR(n)}</small>` : ''}</span></a>`;
      }).join('')}</div>
      ${d ? `<div class="label">وِرد اليوم</div>${d}` : ''}
      ${footer()}`;
  }
  async function homeView() {
    const html = await home();
    return { html, after: () => {
      $app.querySelectorAll('.act-ask [data-a]').forEach((b) => (b.onclick = () => {
        const acts = store.get('sohba-acts', []); const a = acts.find((x) => x.state === 'pending' && x.day < dayNum());
        if (!a) return;
        if (b.dataset.a === 'done') { a.state = 'done'; toast('ربنا يتقبل منك 🤍'); } else { a.day = dayNum(); toast('ولا يهمك، ربنا ييسرلك'); }
        store.set('sohba-acts', acts);
        b.closest('.act-ask').remove();
      }));
    } };
  }

  const memSet = () => new Set(store.get('sohba-mem', []));
  // Arabic counting: ١ كلمة، ٢ كلمتين، ٣–١٠ كلمات، ١١+ كلمة
  const count = (n, [one, two, few]) => n === 1 ? one : n === 2 ? two : `${AR(n)} ${n >= 3 && n <= 10 ? few : one}`;
  const WORDS = ['كلمة', 'كلمتين', 'كلمات'], AYAT = ['آية', 'آيتين', 'آيات'];
  const short = (title) => title.replace(/^سورة /, '');
  async function track(slug) {
    const t = await api('/tracks/' + slug);
    const dn = done();
    const head = `
      <div class="bar"><a class="back" href="#" aria-label="رجوع">→</a><span class="crumb">طريقك</span></div>
      <header class="hero small"><h1>${esc(t.title)}</h1><div class="tag">${esc(t.subtitle)}</div></header>`;
    const row = (l, i) => `
        <a class="card lesson-row ${dn.has(l.slug) ? 'done' : ''}" href="#l-${esc(l.slug)}">
          <div class="n">${dn.has(l.slug) ? '✓' : AR(i + 1)}</div>
          <div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p></div>
        </a>`;
    const ch = t.chapters || [];
    if (ch.length && ch[0].n) { // the Quran: a shelf of 30 ajza'
      return `${head}
        <div class="label">الأجزاء</div>
        <div class="shelf">${ch.map((c) => {
          const ls = t.lessons.filter((l) => l.chapter === c.key), k = ls.filter((l) => dn.has(l.slug)).length;
          const name = esc(c.title.replace(/^جزء /, ''));
          return ls.length
            ? `<a class="juz on${k === ls.length ? ' full' : ''}" href="#c-${esc(t.slug)}.${esc(c.key)}"><b>${AR(c.n)}</b><small>${name}</small><i style="width:${Math.round((k * 100) / ls.length)}%"></i></a>`
            : `<div class="juz"><b>${AR(c.n)}</b><small>${name}</small></div>`;
        }).join('')}</div>
        <p class="shelf-note">الأجزاء الباقية جاية تباعًا، وكل جزء بيتفتح بعد ما محتواه يتراجع.</p>
        ${footer()}`;
    }
    if (ch.length) { // grouped by period/topic
      let i = 0;
      return `${head}${ch.map((c) => {
        const ls = t.lessons.filter((l) => l.chapter === c.key);
        return ls.length ? `<div class="label">${esc(c.title)}</div>${ls.map((l) => row(l, i++)).join('')}` : '';
      }).join('')}${footer()}`;
    }
    return `${head}${t.lessons.map(row).join('') || '<div class="empty">الدروس جاية قريب إن شاء الله</div>'}${footer()}`;
  }

  // A juz: surahs as a mosaic in mushaf order (tile size follows the ayah count), colored by progress.
  async function chapter(trackSlug, key) {
    const t = await api('/tracks/' + trackSlug);
    const c = (t.chapters || []).find((x) => x.key === key);
    if (!c) throw new Error(404);
    const ls = t.lessons.filter((l) => l.chapter === key);
    const dn = done(), mem = memSet(), due = new Set(dueReviews().map(([s]) => s));
    const state = (s) => mem.has(s) ? 's-mem' : due.has(s) ? 's-due' : dn.has(s) ? 's-done' : '';
    const plan = ls.filter((l) => l.meta?.words).sort((a, b) => a.meta.words - b.meta.words);
    const next = plan.find((l) => !mem.has(l.slug)), got = plan.filter((l) => mem.has(l.slug)).length;
    const ayat = ls.reduce((n, l) => n + (l.meta?.ayat || 0), 0);
    return `
      <div class="bar"><a class="back" href="#t-${esc(t.slug)}" aria-label="رجوع">→</a><span class="crumb">${esc(t.title)}</span></div>
      <header class="hero small"><h1>${esc(c.title)}</h1><div class="tag">${AR(ls.length)} سورة · ${AR(ayat)} آية</div></header>
      ${plan.length ? `<a class="card plan" href="#p-${esc(t.slug)}.${esc(key)}">
        <div class="k">خطة الحفظ: نبدأ بالأسهل</div>
        <h3>${next ? `سورتك الجاية: ${esc(short(next.title))}` : 'حفظت الجزء كله، ما شاء الله 🤍'}</h3>
        <p>${AR(got)} من ${AR(plan.length)}${next ? ` · ${count(next.meta.words, WORDS)}` : ''}</p>
        <span class="prog"><i style="width:${Math.round((got * 100) / plan.length)}%"></i></span></a>` : ''}
      <div class="label">بترتيب المصحف</div>
      <div class="mosaic">${ls.map((l) => `
        <a class="tile ${state(l.slug)}" style="flex-grow:${Math.round(Math.sqrt(l.meta?.ayat || 1) * 10)}" href="#l-${esc(l.slug)}">
          <b>${esc(short(l.title))}</b><small>${AR(l.meta?.ayat || '')}</small></a>`).join('')}</div>
      <div class="legend"><span><i class="s-mem"></i>حفظتها</span><span><i class="s-done"></i>خلصت الدرس</span><span><i class="s-due"></i>مراجعة النهارده</span></div>
      ${footer()}`;
  }

  // Memorization plan: the same surahs, shortest first (by word count).
  async function plan(trackSlug, key) {
    const t = await api('/tracks/' + trackSlug);
    const c = (t.chapters || []).find((x) => x.key === key);
    if (!c) throw new Error(404);
    const mem = memSet();
    const ls = t.lessons.filter((l) => l.chapter === key && l.meta?.words).sort((a, b) => a.meta.words - b.meta.words);
    const next = ls.find((l) => !mem.has(l.slug));
    return `
      <div class="bar"><a class="back" href="#c-${esc(t.slug)}.${esc(key)}" aria-label="رجوع">→</a><span class="crumb">${esc(c.title)}</span></div>
      <header class="hero small"><h1>خطة الحفظ</h1><div class="tag">من الأقصر للأطول · ${AR(mem.size ? ls.filter((l) => mem.has(l.slug)).length : 0)} من ${AR(ls.length)}</div></header>
      <p class="b-note">رتبنا السور من الأقصر للأطول بعدد الكلمات. مش لازم تمشي بالترتيب، بس ده أسهل طريق تبدأ بيه. ولما تخلص وضع «احفظ» لآخر مستوى، دوس «حفظتها ✓».</p>
      ${ls.map((l, i) => `
        <a class="card lesson-row plan-row ${mem.has(l.slug) ? 'done' : ''}${l === next ? ' next' : ''}" href="#l-${esc(l.slug)}">
          <div class="n">${mem.has(l.slug) ? '✓' : AR(i + 1)}</div>
          <div><h3>${esc(short(l.title))} ${l === next ? '<span class="badge">ابدأ هنا</span>' : ''}</h3><p>${count(l.meta.words, WORDS)} · ${count(l.meta.ayat, AYAT)}</p></div>
        </a>`).join('')}
      ${footer()}`;
  }

  function block(b, ctx) {
    const c = b.content;
    switch (b.type) {
      case 'heading': return `<h2 class="b-heading">${esc(c.body)}</h2>`;
      case 'text': return `<p class="b-text">${esc(c.body)}</p>`;
      case 'egy': return `<div class="b-egy">${esc(c.body)}</div>`;
      case 'note': return `<p class="b-note">${esc(c.body)}</p>`;
      case 'tip': return `<div class="b-tip"><span class="k">${esc(c.label || 'حيلة')}</span>${esc(c.body)}</div>`;
      case 'dua': return `<div class="b-quote"><div class="t">${esc(c.title || '')}</div><div class="body">${esc(c.body)}</div>${srcLine(b)}</div>`;
      case 'hadith': return `<div class="b-quote hadith"><div class="narr">${esc(c.narrator || '')}</div><div class="body">${esc(c.body)}</div>${srcLine(b)}</div>`;
      case 'list': return `<div class="b-list">${c.title ? `<h4>${esc(c.title)}</h4>` : ''}<ol>${(c.items || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
      case 'step': return `
        <div class="b-step"><div class="n">${AR(c.n)}</div><div>
          <h4>${esc(c.title)} ${c.repeat ? `<span class="rep">${c.repeat === 1 ? 'مرة واحدة' : AR(c.repeat) + ' مرات'}</span>` : ''} ${c.inAyah ? '<span class="inayah">في الآية</span>' : ''}</h4>
          <p>${esc(c.body)}</p></div></div>`;
      case 'quran':
        if (c.surah && c.ayah) {
          return `
          <article class="ayah">
            <div class="qt">${esc(c.body)} <span class="anum">﴿${AR(c.ayah)}﴾</span></div>
            ${c.egy ? `<div class="egy">${esc(c.egy)}</div>` : ''}
            ${c.tafsir ? `<details><summary>التفسير الميسر${c.tafsir_to ? ` للآيات ${AR(c.ayah)}–${AR(c.tafsir_to)}` : ''} (المصدر)</summary><div class="tf">${esc(c.tafsir)}</div></details>` : ''}
            <a class="listen" href="https://quran.com/${Number(c.surah)}/${Number(c.ayah)}" target="_blank" rel="noopener">🔊 اسمع الآية</a>
          </article>`;
        }
        return `<div class="b-quote"><div class="body">${esc(c.body)}</div>${srcLine(b)}</div>`;
      case 'map': return `
        <div class="map">
          <div class="label flush">${esc(c.label || 'خريطة السورة')}</div>
          ${(c.segments || []).map((s, i) => `
            ${i ? '<div class="arrow">▼</div>' : ''}
            <div class="seg ${s.tone === 'b' ? 'b' : 'a'}">
              <div class="seg-head"><div class="num">${AR(i + 1)}</div><div><div class="qq">${esc(s.q)}</div><div class="sub">${esc(s.ayat)}</div></div></div>
              <div class="ladder">${s.items.map((it) => `
                <div class="rung">${icon(it.icon, s.tone === 'b' ? '#a14a2a' : '#1d5c45')}<div class="w">${esc(it.w)}</div><div class="e">${esc(it.e)}</div></div>`).join('')}
              </div>
            </div>`).join('')}
        </div>`;
      case 'memorize': ctx.memorize = true; return '<div id="mem"></div>';
      case 'link': {
        const safe = /^https:\/\//.test(c.url || '') ? c.url : '#';
        return `<a class="b-link" href="${esc(safe)}" target="_blank" rel="noopener">
          <div><h4>${esc(c.title)}</h4><p>${esc(c.desc || '')}</p><span class="site">${esc(c.site || '')}</span></div><span class="go">↗</span></a>`;
      }
      // The ticker lines show on the home bar, not inside the lesson. The admin preview lists them for review.
      case 'ticker': return ctx.admin ? `<div class="b-list"><h4>جمل الشريط</h4><ol>${(c.items || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>` : '';
      case 'quiz': {
        const n = (ctx.quizzes ||= []).push({ c, slug: ctx.slug }) - 1;
        return `<div class="b-quiz" data-quiz="${n}">
          <div class="k">افتكر</div><p class="q">${esc(c.q)}</p>
          <div class="opts">${order(c).map((i) => [c.options[i], i]).map(([o, i]) => `<button class="opt${ctx.admin && i === c.answer ? ' ok' : ''}" data-i="${i}"${ctx.admin ? ' disabled' : ''}>${esc(o)}</button>`).join('')}</div>
          <div class="why"${ctx.admin ? '' : ' hidden'}>${esc(c.why || '')}</div></div>`;
      }
      case 'action': ctx.action = c.body; return `
        <div class="b-action"><div class="k">طبّق النهارده</div><p>${esc(c.body)}</p>
          ${ctx.admin ? '' : '<button class="btn gold" data-act>هعملها إن شاء الله</button>'}</div>`;
      default: return '';
    }
  }

  // Stable per-question shuffle, so the right answer isn't always in the same place.
  function order(c) {
    const h = (str) => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);
    return c.options.map((o, i) => i).sort((a, b) => h(c.q + c.options[a]) - h(c.q + c.options[b]));
  }

  /* ---------- افتكر + طبّق: all on-device, no account needed ---------- */
  const INTERVALS = [1, 3, 7, 14, 30]; // days until the next review, by step
  const dayNum = (d = today()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
  function bindQuizzes(root, ctx, onAnswer) {
    root.querySelectorAll('.b-quiz').forEach((el) => {
      const { c } = ctx.quizzes[el.dataset.quiz];
      el.querySelectorAll('.opt').forEach((btn) => (btn.onclick = () => {
        const i = Number(btn.dataset.i), right = i === c.answer;
        el.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (Number(b.dataset.i) === c.answer) b.classList.add('ok'); });
        if (!right) btn.classList.add('no');
        el.querySelector('.why').hidden = false;
        el.querySelector('.why').insertAdjacentHTML('afterbegin', `<b>${right ? 'صح، برافو 👏' : 'مش دي، بس عادي، كده هتفتكرها أكتر.'}</b> `);
        onAnswer?.(Number(el.dataset.quiz), right);
      }));
    });
  }
  function bindAction(root, l, body) {
    const btn = root.querySelector('[data-act]');
    if (!btn) return;
    btn.onclick = () => {
      const acts = store.get('sohba-acts', []).filter((a) => a.slug !== l.slug);
      acts.unshift({ slug: l.slug, title: l.title, body, day: dayNum(), state: 'pending' });
      store.set('sohba-acts', acts.slice(0, 20));
      btn.disabled = true; btn.textContent = 'تمام، هسألك عليها بكرة 🤍';
    };
  }
  function scheduleReview(l) {
    const srs = store.get('sohba-srs', {});
    if (!srs[l.slug]) { srs[l.slug] = { step: 0, due: dayNum() + INTERVALS[0], title: l.title }; store.set('sohba-srs', srs); }
  }
  const dueReviews = () => Object.entries(store.get('sohba-srs', {})).filter(([, r]) => r.due <= dayNum());
  const pendingAction = () => store.get('sohba-acts', []).find((a) => a.state === 'pending' && a.day < dayNum());

  async function review() {
    const due = dueReviews();
    const head = `<div class="bar"><a class="back" href="#" aria-label="رجوع">→</a><span class="crumb">مراجعة النهارده</span></div>`;
    if (!due.length) return `${head}<div class="empty">مفيش مراجعة النهارده 👌<br>كمّل درس جديد.</div>`;
    const lessons = (await Promise.all(due.map(([slug]) => api('/lessons/' + slug).catch(() => null)))).filter(Boolean);
    const ctx = { quizzes: [] }, answers = {};
    const html = `${head}
      <header class="hero small"><h1>افتكر</h1><div class="tag">${AR(lessons.length)} دروس · دقيقتين بس</div></header>
      ${lessons.map((l) => {
        ctx.slug = l.slug;
        const qs = l.blocks.filter((b) => b.type === 'quiz').map((b) => block(b, ctx)).join('');
        const mem = l.blocks.some((b) => b.type === 'memorize');
        return `<div class="label">${esc(l.title)}</div>${qs}
          ${mem ? `<a class="card rev-mem" href="#l-${esc(l.slug)}">🔁 سمّع ${esc(l.title)} لنفسك في وضع «احفظ»</a>` : ''}`;
      }).join('')}
      <div class="row"><button class="btn pri" id="rev-done" disabled>خلصت المراجعة</button></div>`;
    return { html, after: () => {
      const done = document.getElementById('rev-done');
      if (!ctx.quizzes.length) done.disabled = false;
      bindQuizzes($app, ctx, (n, right) => {
        answers[n] = right;
        if (Object.keys(answers).length === ctx.quizzes.length) done.disabled = false;
      });
      done.onclick = () => {
        const srs = store.get('sohba-srs', {});
        let next = Infinity;
        for (const l of lessons) {
          const r = srs[l.slug]; if (!r) continue;
          const mine = ctx.quizzes.map((q, i) => (q.slug === l.slug ? answers[i] : true));
          r.step = mine.every(Boolean) ? Math.min(r.step + 1, INTERVALS.length - 1) : 0;
          r.due = dayNum() + INTERVALS[r.step];
          next = Math.min(next, INTERVALS[r.step]);
        }
        store.set('sohba-srs', srs);
        toast(`برافو! المراجعة الجاية بعد ${AR(next)} ${next === 1 ? 'يوم' : 'أيام'}`);
        location.hash = '#';
      };
    } };
  }

  async function lesson(slug) {
    const l = await api('/lessons/' + slug);
    const ctx = { slug: l.slug };
    store.set('sohba-last', { slug: l.slug, title: l.title, track: l.track, where: l.chapter_title || l.track_title });
    const backTo = l.chapter && /^juz-/.test(l.chapter) ? `#c-${l.track}.${l.chapter}` : `#t-${l.track}`;
    const body = l.blocks.map((b) => block(b, ctx)).join('');
    const html = `
      <div class="bar"><a class="back" href="${esc(backTo)}" aria-label="رجوع">→</a><span class="crumb">${esc(l.chapter_title || l.track_title)}</span></div>
      <header class="hero small"><h1>${esc(l.title)}</h1><div class="tag">${esc(l.summary)}</div></header>
      ${l.status !== 'published' ? '<div class="draft">⚠ مسودة تحت المراجعة الشرعية، ومش هتظهر للناس قبل ما تتراجع.</div>' : ''}
      ${body}
      <div class="row finish">
        <button class="btn gold" id="finish">خلصت الدرس ✓</button>
        ${l.next ? `<a class="btn sec" href="#l-${esc(l.next.slug)}">التالي: ${esc(l.next.title)}</a>` : ''}
      </div>
      ${footer()}`;
    return { html, after: () => {
      document.getElementById('finish').onclick = () => {
        const s = done(); s.add(l.slug); store.set('sohba-done', [...s]);
        if (ctx.quizzes?.length || ctx.memorize) scheduleReview(l);
        toast(l.next ? 'برافو! كمّل على الدرس اللي بعده' : 'برافو! خلصت المسار ده');
      };
      bindQuizzes($app, ctx);
      bindAction($app, l, ctx.action);
      if (ctx.memorize) mountMemorize(l.blocks.filter((b) => b.type === 'quran' && b.content.ayah).map((b) => b.content), l.slug, l.title);
    } };
  }

  /* ---------- memorize: progressive word hiding ---------- */
  function mountMemorize(ayat, slug, title) {
    const el = document.getElementById('mem');
    const LV = ['اقرا وبُص', 'آخر كلمة مستخبية', 'نص الكلام مستخبي', 'أول كلمة بس'];
    let lvl = 0;
    const hidden = (n, i) => lvl === 0 ? false : lvl === 1 ? i === n - 1 : lvl === 2 ? (n === 1 || i % 2 === 1 || i === n - 1) : (i > 0 || n === 1);
    const draw = () => {
      el.className = 'mem';
      el.innerHTML = `
        <h4>احفظ</h4>
        <div class="lv"><span>المستوى ${AR(lvl + 1)}: ${LV[lvl]}</span><span class="dots">${LV.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span></div>
        ${ayat.map((a) => { const w = a.body.split(' '); return `<div class="ml">${w.map((x, i) => `<span class="wd ${hidden(w.length, i) ? 'hid' : ''}">${esc(x)}</span>`).join(' ')} <span class="anum">﴿${AR(a.ayah)}﴾</span></div>`; }).join('')}
        <div class="row"><button class="btn sec" data-a="less">أسهل</button>${lvl < 3
          ? '<button class="btn pri" data-a="more">خبّي أكتر</button>'
          : `<button class="btn gold" data-a="got">${memSet().has(slug) ? 'حفظتها ✓' : 'حفظتها ✓ سجّلها'}</button>`}</div>`;
      el.querySelectorAll('.wd.hid').forEach((w) => (w.onclick = () => { w.classList.remove('hid'); w.classList.add('peek'); }));
      el.querySelector('[data-a=less]').onclick = () => { if (lvl > 0) { lvl--; draw(); } };
      el.querySelector('[data-a=more]')?.addEventListener('click', () => { lvl++; draw(); if (lvl === 3) toast('آخر مستوى: لو قلتها كلها من غير ما تبص، يبقى حفظتها 👏'); });
      el.querySelector('[data-a=got]')?.addEventListener('click', () => {
        const m = memSet(); m.add(slug); store.set('sohba-mem', [...m]);
        if (title) scheduleReview({ slug, title });
        toast('ما شاء الله! هنفكّرك تراجعها عشان متتنسيش'); draw();
      });
    };
    draw();
  }

  // The admin review page reuses the exact same renderer, so the sheikh reviews what users will see.
  window.SohbaUI = { block, mountMemorize, esc, AR };
  if (!$app) return; // loaded as a library (admin page): no router, no service worker

  /* ---------- router ---------- */
  async function route() {
    const h = location.hash.slice(1);
    let out;
    try {
      if (h === 'review') out = await review();
      else if (h.startsWith('c-')) out = await chapter(...h.slice(2).split('.'));
      else if (h.startsWith('p-')) out = await plan(...h.slice(2).split('.'));
      else if (h.startsWith('t-')) out = await track(h.slice(2));
      else if (h.startsWith('l-')) out = await lesson(h.slice(2));
      else out = await homeView();
    } catch {
      out = `<div class="bar"><a class="back" href="#">→</a></div><div class="empty">الصفحة دي مش موجودة.</div>`;
    }
    const { html, after } = typeof out === 'string' ? { html: out } : out;
    $app.innerHTML = `<div class="view">${html}</div>`;
    window.scrollTo(0, 0);
    after?.();
  }
  window.addEventListener('hashchange', route);
  activeSeasons(); // apply the season theme even when the app opens straight on a lesson
  route();

  if (!PREVIEW && 'serviceWorker' in navigator) {
    // When a new service worker takes over (after a deploy), reload once so the new code runs.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
