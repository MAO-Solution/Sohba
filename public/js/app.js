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
    if (path === '/tracks') return D.tracks.map((t) => ({ ...t, lessons: lessonsOf(t.slug).length }));
    if ((m = path.match(/^\/tracks\/([a-z0-9-]+)$/))) {
      const t = D.tracks.find((x) => x.slug === m[1] && x.is_available);
      if (!t) throw new Error(404);
      return { ...t, lessons: lessonsOf(t.slug).map(({ slug, title, summary, status }) => ({ slug, title, summary, status })) };
    }
    if ((m = path.match(/^\/lessons\/([a-z0-9-]+)$/))) {
      const l = D.lessons.find((x) => x.slug === m[1]);
      if (!l) throw new Error(404);
      const sib = lessonsOf(l.track); const nx = sib[sib.indexOf(l) + 1];
      return { slug: l.slug, title: l.title, summary: l.summary, status: l.status, track: l.track,
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

  /* ---------- views ---------- */
  async function home() {
    const [tracks, daily] = await Promise.all([api('/tracks'), api('/daily')]);
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
      ${d ? `<div class="label">وِرد اليوم</div>${d}` : ''}
      <div class="label">المسارات</div>
      ${tracks.map((t) => t.is_available ? `
        <a class="card track" href="#t-${esc(t.slug)}">
          <div class="ic">${TRACK_MARK[t.slug] || '•'}</div>
          <div><h3>${esc(t.title)}</h3><p>${esc(t.subtitle)} · ${AR(t.lessons)} دروس</p></div>
          <span class="go">‹</span>
        </a>` : `
        <div class="card track soon">
          <div class="ic">${TRACK_MARK[t.slug] || '•'}</div>
          <div><h3>${esc(t.title)}</h3><p>${esc(t.subtitle)}</p></div>
          <span class="badge push">قريباً</span>
        </div>`).join('')}
      ${footer()}`;
  }

  async function track(slug) {
    const t = await api('/tracks/' + slug);
    const dn = done();
    return `
      <div class="bar"><a class="back" href="#" aria-label="رجوع">→</a><span class="crumb">المسارات</span></div>
      <header class="hero small"><h1>${esc(t.title)}</h1><div class="tag">${esc(t.subtitle)}</div></header>
      ${t.lessons.map((l, i) => `
        <a class="card lesson-row ${dn.has(l.slug) ? 'done' : ''}" href="#l-${esc(l.slug)}">
          <div class="n">${dn.has(l.slug) ? '✓' : AR(i + 1)}</div>
          <div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p></div>
        </a>`).join('') || '<div class="empty">الدروس جاية قريب إن شاء الله</div>'}
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
            ${c.tafsir ? `<details><summary>التفسير الميسر (المصدر)</summary><div class="tf">${esc(c.tafsir)}</div></details>` : ''}
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
      default: return '';
    }
  }

  async function lesson(slug) {
    const l = await api('/lessons/' + slug);
    const ctx = {};
    const body = l.blocks.map((b) => block(b, ctx)).join('');
    const html = `
      <div class="bar"><a class="back" href="#t-${esc(l.track)}" aria-label="رجوع">→</a><span class="crumb">${esc(l.track_title)}</span></div>
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
        toast(l.next ? 'برافو! كمّل على الدرس اللي بعده' : 'برافو! خلصت المسار ده');
      };
      if (ctx.memorize) mountMemorize(l.blocks.filter((b) => b.type === 'quran' && b.content.ayah).map((b) => b.content), l.slug);
    } };
  }

  /* ---------- memorize: progressive word hiding ---------- */
  function mountMemorize(ayat, slug) {
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
        <div class="row"><button class="btn sec" data-a="less">أسهل</button><button class="btn pri" data-a="more">خبّي أكتر</button></div>`;
      el.querySelectorAll('.wd.hid').forEach((w) => (w.onclick = () => { w.classList.remove('hid'); w.classList.add('peek'); }));
      el.querySelector('[data-a=less]').onclick = () => { if (lvl > 0) { lvl--; draw(); } };
      el.querySelector('[data-a=more]').onclick = () => { if (lvl < 3) { lvl++; draw(); } else toast('ده آخر مستوى. لو قلتها كلها من غير ما تبص، يبقى حفظتها 👏'); };
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
      if (h.startsWith('t-')) out = await track(h.slice(2));
      else if (h.startsWith('l-')) out = await lesson(h.slice(2));
      else out = await home();
    } catch {
      out = `<div class="bar"><a class="back" href="#">→</a></div><div class="empty">الصفحة دي مش موجودة.</div>`;
    }
    const { html, after } = typeof out === 'string' ? { html: out } : out;
    $app.innerHTML = `<div class="view">${html}</div>`;
    window.scrollTo(0, 0);
    after?.();
  }
  window.addEventListener('hashchange', route);
  route();

  if (!PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
