// /admin/api — staff-only review workflow.
//   draft ──submit(admin)──▶ in_review ──approve(reviewer)──▶ approved ──publish(admin)──▶ published
//                  ◀──request_changes(reviewer, note)──┘                 ◀──unpublish(admin)──┘
// Every transition is one guarded UPDATE: it only applies if the lesson is still in the expected
// status AND still has the exact content the user was looking at (content_hash). Otherwise 409.
import express, { Router } from 'express';
import { pool } from '../db.js';
import {
  authEnabled, currentUser, verifyPassword, setSession, clearSession,
  isThrottled, recordFailure, clearFailures,
} from '../auth.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const SLUG = /^[a-z0-9-]{1,64}$/;
const STATUSES = ['draft', 'in_review', 'approved', 'published'];

const ACTIONS = {
  submit:          { role: 'admin',    from: 'draft',     to: 'in_review' },
  approve:         { role: 'reviewer', from: 'in_review', to: 'approved' },
  request_changes: { role: 'reviewer', from: 'in_review', to: 'draft', needsNote: true },
  publish:         { role: 'admin',    from: 'approved',  to: 'published' },
  unpublish:       { role: 'admin',    from: 'published', to: 'approved' },
};

router.use((req, res, next) => {
  if (!authEnabled) return res.status(503).json({ error: 'admin_disabled' });
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  // CSRF: SameSite=Strict cookie + JSON-only bodies + same-origin check.
  if (req.method !== 'GET') {
    if (!req.is('application/json')) return res.status(415).json({ error: 'json_only' });
    const origin = req.get('origin');
    if (origin && origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ error: 'bad_origin' });
  }
  next();
});
router.use(express.json({ limit: '10kb' }));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase().slice(0, 254);
  const password = String(req.body?.password ?? '').slice(0, 256);
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
  if (await isThrottled(req.ip, email)) return res.status(429).json({ error: 'too_many_attempts' });

  const { rows: [u] } = await pool.query(
    'SELECT id, name, role, password_hash FROM users WHERE lower(email) = $1 AND role IS NOT NULL', [email]
  );
  if (!(await verifyPassword(password, u?.password_hash)) || !u) {
    await recordFailure(req.ip, email);
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  await clearFailures(email);
  setSession(req, res, u);
  res.json({ name: u.name, role: u.role });
}));

router.post('/logout', (req, res) => { clearSession(req, res); res.json({ ok: true }); });

// Everything below needs a staff session.
router.use(wrap(async (req, res, next) => {
  req.user = await currentUser(req);
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}));

router.get('/me', (req, res) => res.json({ name: req.user.name, role: req.user.role }));

router.get('/lessons', wrap(async (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : 'in_review';
  const [{ rows: lessons }, { rows: counts }] = await Promise.all([
    pool.query(
      `SELECT l.slug, l.title, l.status, l.reviewed_by, l.updated_at, t.title AS track_title,
              (SELECT r.note FROM lesson_reviews r WHERE r.lesson_id = l.id AND r.action = 'request_changes'
                ORDER BY r.created_at DESC LIMIT 1) AS last_note
         FROM lessons l JOIN tracks t ON t.id = l.track_id
        WHERE l.status = $1 ORDER BY t.sort, l.sort`,
      [status]
    ),
    pool.query('SELECT status, count(*)::int AS n FROM lessons GROUP BY status'),
  ]);
  res.json({ status, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])), lessons });
}));

router.get('/lessons/:slug', wrap(async (req, res) => {
  if (!SLUG.test(req.params.slug)) return res.status(404).json({ error: 'not_found' });
  const { rows: [lesson] } = await pool.query(
    `SELECT l.id, l.slug, l.title, l.summary, l.status, l.reviewed_by, l.reviewed_at, l.content_hash,
            t.slug AS track, t.title AS track_title
       FROM lessons l JOIN tracks t ON t.id = l.track_id WHERE l.slug = $1`,
    [req.params.slug]
  );
  if (!lesson) return res.status(404).json({ error: 'not_found' });
  const [{ rows: blocks }, { rows: history }] = await Promise.all([
    pool.query(
      `SELECT b.type, b.content, s.title AS source, s.ref AS source_ref
         FROM blocks b LEFT JOIN sources s ON s.id = b.source_id WHERE b.lesson_id = $1 ORDER BY b.sort`,
      [lesson.id]
    ),
    pool.query(
      `SELECT r.action, r.from_status, r.to_status, r.note, r.created_at, coalesce(u.name, 'النظام') AS by
         FROM lesson_reviews r LEFT JOIN users u ON u.id = r.user_id
        WHERE r.lesson_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
      [lesson.id]
    ),
  ]);
  delete lesson.id;
  const actions = Object.entries(ACTIONS)
    .filter(([, a]) => a.role === req.user.role && a.from === lesson.status).map(([k]) => k);
  res.json({ ...lesson, blocks, history, actions });
}));

router.post('/lessons/:slug/review', wrap(async (req, res) => {
  if (!SLUG.test(req.params.slug)) return res.status(404).json({ error: 'not_found' });
  const action = ACTIONS[req.body?.action];
  if (!action) return res.status(400).json({ error: 'bad_action' });
  if (action.role !== req.user.role) return res.status(403).json({ error: 'forbidden' });
  const hash = String(req.body?.content_hash ?? '');
  const note = String(req.body?.note ?? '').trim().slice(0, 2000) || null;
  if (action.needsNote && !note) return res.status(400).json({ error: 'note_required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // approve stamps the reviewer; going back to draft clears it; publish/unpublish keep it.
    const reviewSet =
      req.body.action === 'approve' ? ', reviewed_by = $5, reviewed_at = now()'
      : action.to === 'draft' ? ', reviewed_by = NULL, reviewed_at = NULL' : '';
    const params = [req.params.slug, action.from, action.to, hash];
    if (req.body.action === 'approve') params.push(req.user.name || req.user.email);
    const { rows: [l] } = await client.query(
      `UPDATE lessons SET status = $3, updated_at = now() ${reviewSet}
        WHERE slug = $1 AND status = $2 AND content_hash = $4 RETURNING id`,
      params
    );
    if (!l) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'stale' }); }
    await client.query(
      `INSERT INTO lesson_reviews (lesson_id, user_id, action, from_status, to_status, content_hash, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [l.id, req.user.id, req.body.action, action.from, action.to, hash, note]
    );
    await client.query('COMMIT');
    res.json({ ok: true, status: action.to });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

router.use((_req, res) => res.status(404).json({ error: 'not_found' }));

export default router;
