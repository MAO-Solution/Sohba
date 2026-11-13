/* صحبة — admin / review (Vanilla JS). Routes: #s-<status> · #l-<lesson> */
(() => {
  'use strict';
  const { block, mountMemorize, esc, AR } = window.SohbaUI;
  const $root = document.getElementById('admin');
  let me = null;

  const STATUS = { in_review: 'تحت المراجعة', draft: 'مسودة', approved: 'معتمد', published: 'منشور' };
  const ACTION = {
    approve:         { label: 'اعتمد الدرس ✓', cls: 'pri', confirm: 'هتعتمد الدرس ده بالنص اللي قدامك. متأكد؟' },
    request_changes: { label: 'محتاج تعديل', cls: 'red' },
    submit:          { label: 'ابعته للمراجعة', cls: 'gold' },
    publish:         { label: 'انشره للناس', cls: 'pri', confirm: 'الدرس هيظهر لكل الناس. متأكد؟' },
    unpublish:       { label: 'اسحبه من النشر', cls: 'sec', confirm: 'الدرس هيختفي من التطبيق. متأكد؟' },
  };
  const HIST = { ...Object.fromEntries(Object.entries(ACTION).map(([k, v]) => [k, v.label.replace(' ✓', '')])), content_changed: 'المحتوى اتعدّل ورجع للمراجعة' };
  const ERR = { stale: 'الدرس اتغيّر من ساعة ما فتحته. الصفحة هتتحدث، راجعه تاني.', note_required: 'اكتب الملاحظة الأول.', forbidden: 'مش من صلاحيتك.', too_many_attempts: 'محاولات كتير. استنى ربع ساعة.', invalid_credentials: 'الإيميل أو الباسورد غلط.', admin_disabled: 'لوحة التحكم مش متفعّلة على السيرفر.' };

  const date = (d) => new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3000);
  }

  async function api(path, body) {
    const r = await fetch('/admin/api' + path, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : {});
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== '/login') { me = null; renderLogin(); throw new Error('unauthorized'); }
    if (!r.ok) { const e = new Error(data.error || r.status); e.code = data.error; throw e; }
    return data;
  }

  const top = () => `
    <div class="adm-top"><span>أهلاً <b>${esc(me.name || '')}</b> · ${me.role === 'reviewer' ? 'مراجع' : 'أدمن'}</span>
    <button id="logout">خروج</button></div>`;

  function renderLogin(msg = '') {
    $root.innerHTML = `
      <form class="card login" id="login">
        <h2 class="b-heading">صحبة · المراجعة</h2>
        <input name="email" type="email" placeholder="الإيميل" autocomplete="username" required dir="ltr">
        <input name="password" type="password" placeholder="الباسورد" autocomplete="current-password" required dir="ltr">
        <div class="err">${esc(msg)}</div>
        <button class="btn pri" type="submit">دخول</button>
      </form>`;
    document.getElementById('login').onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        me = await api('/login', { email: f.get('email'), password: f.get('password') });
        location.hash = '#'; route();
      } catch (err) { renderLogin(ERR[err.code] || 'حصلت مشكلة، جرّب تاني.'); }
    };
  }

  async function list(status) {
    const d = await api('/lessons?status=' + encodeURIComponent(status));
    return `${top()}
      <div class="tabs">${Object.entries(STATUS).map(([k, v]) =>
        `<a href="#s-${k}" class="${k === d.status ? 'on' : ''}">${v} (${AR(d.counts[k] || 0)})</a>`).join('')}</div>
      ${d.lessons.map((l) => `
        <a class="card adm-row" href="#l-${esc(l.slug)}">
          <h3>${esc(l.title)}</h3>
          <p>${esc(l.track_title)} · آخر تعديل ${date(l.updated_at)}${l.reviewed_by ? ' · راجعه ' + esc(l.reviewed_by) : ''}</p>
          ${l.last_note && l.status === 'draft' ? `<p class="note">ملاحظة: ${esc(l.last_note)}</p>` : ''}
        </a>`).join('') || '<div class="empty">مفيش دروس هنا</div>'}`;
  }

  async function lesson(slug) {
    const l = await api('/lessons/' + slug);
    const ctx = { admin: true };
    const html = `${top()}
      <div class="bar"><a class="back" href="#s-${l.status}" aria-label="رجوع">→</a>
        <span class="crumb">${esc(l.track_title)} · <span class="st ${l.status}">${STATUS[l.status]}</span></span></div>
      <header class="hero small"><h1>${esc(l.title)}</h1><div class="tag">${esc(l.summary)}</div></header>
      ${l.reviewed_by ? `<div class="draft">راجعه: ${esc(l.reviewed_by)} · ${date(l.reviewed_at)}</div>` : ''}
      ${l.blocks.map((b) => block(b, ctx)).join('')}
      ${l.history.length ? `<div class="label">السجل</div><ul class="card hist">${l.history.map((h) => `
        <li>${esc(HIST[h.action] || h.action)} · ${esc(h.by)} · ${date(h.created_at)}
          ${h.note ? `<div class="n">${esc(h.note)}</div>` : ''}</li>`).join('')}</ul>` : ''}
      ${l.actions.length ? `<div class="panel">
        ${l.actions.includes('request_changes') ? '<textarea id="note" maxlength="2000" placeholder="ملاحظاتك على الدرس (لازم لو محتاج تعديل)"></textarea>' : ''}
        <div class="row">${l.actions.map((a) => `<button class="btn ${ACTION[a].cls}" data-a="${a}">${ACTION[a].label}</button>`).join('')}</div>
      </div>` : ''}`;
    return { html, after: () => {
      if (ctx.memorize) mountMemorize(l.blocks.filter((b) => b.type === 'quran' && b.content.ayah).map((b) => b.content));
      $root.querySelectorAll('[data-a]').forEach((btn) => (btn.onclick = async () => {
        const a = btn.dataset.a;
        const note = document.getElementById('note')?.value.trim() || '';
        if (a === 'request_changes' && !note) return toast(ERR.note_required);
        if (ACTION[a].confirm && !confirm(ACTION[a].confirm)) return;
        btn.disabled = true;
        try {
          await api(`/lessons/${l.slug}/review`, { action: a, content_hash: l.content_hash, note });
          toast('تمام ✓'); route();
        } catch (err) {
          toast(ERR[err.code] || 'حصلت مشكلة، جرّب تاني.');
          if (err.code === 'stale') setTimeout(route, 1500); else btn.disabled = false;
        }
      }));
    } };
  }

  async function route() {
    if (!me) {
      try { me = await api('/me'); } catch (err) { if (err.message !== 'unauthorized') renderLogin(ERR[err.code] || ''); return; }
    }
    const h = location.hash.slice(1);
    let out;
    try {
      out = h.startsWith('l-') ? await lesson(h.slice(2))
        : await list(h.startsWith('s-') ? h.slice(2) : 'in_review');
    } catch (err) {
      if (err.message === 'unauthorized') return;
      out = `${top()}<div class="empty">الصفحة دي مش موجودة.</div>`;
    }
    const { html, after } = typeof out === 'string' ? { html: out } : out;
    $root.innerHTML = `<div class="view">${html}</div>`;
    window.scrollTo(0, 0);
    document.getElementById('logout').onclick = async () => { await api('/logout', {}).catch(() => {}); me = null; renderLogin(); };
    after?.();
  }

  window.addEventListener('hashchange', route);
  route();
})();
