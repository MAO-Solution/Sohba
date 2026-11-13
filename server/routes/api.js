import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Only published lessons reach users. PREVIEW_DRAFTS=true shows drafts too (dev / review only).
const VISIBLE = process.env.PREVIEW_DRAFTS === 'true'
  ? ['draft', 'in_review', 'approved', 'published']
  : ['published'];

const SLUG = /^[a-z0-9-]{1,64}$/;
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get('/tracks', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT t.slug, t.title, t.subtitle, t.is_available,
            count(l.id) FILTER (WHERE l.status = ANY($1::lesson_status[]))::int AS lessons
       FROM tracks t LEFT JOIN lessons l ON l.track_id = t.id
      WHERE t.is_listed
      GROUP BY t.id ORDER BY t.sort`,
    [VISIBLE]
  );
  res.json(rows);
}));

router.get('/tracks/:slug', wrap(async (req, res) => {
  if (!SLUG.test(req.params.slug)) return res.status(404).json({ error: 'not_found' });
  const { rows: [track] } = await pool.query(
    'SELECT id, slug, title, subtitle, is_available FROM tracks WHERE slug = $1', [req.params.slug]
  );
  if (!track || !track.is_available) return res.status(404).json({ error: 'not_found' });
  const { rows: lessons } = await pool.query(
    `SELECT slug, title, summary, status FROM lessons
      WHERE track_id = $1 AND status = ANY($2::lesson_status[]) ORDER BY sort`,
    [track.id, VISIBLE]
  );
  delete track.id;
  res.json({ ...track, lessons });
}));

router.get('/lessons/:slug', wrap(async (req, res) => {
  if (!SLUG.test(req.params.slug)) return res.status(404).json({ error: 'not_found' });
  const { rows: [lesson] } = await pool.query(
    `SELECT l.id, l.slug, l.title, l.summary, l.status, l.sort, t.slug AS track, t.title AS track_title
       FROM lessons l JOIN tracks t ON t.id = l.track_id
      WHERE l.slug = $1 AND l.status = ANY($2::lesson_status[])`,
    [req.params.slug, VISIBLE]
  );
  if (!lesson) return res.status(404).json({ error: 'not_found' });

  const [{ rows: blocks }, { rows: [next] }] = await Promise.all([
    pool.query(
      `SELECT b.type, b.content, s.title AS source, s.ref AS source_ref
         FROM blocks b LEFT JOIN sources s ON s.id = b.source_id
        WHERE b.lesson_id = $1 ORDER BY b.sort`,
      [lesson.id]
    ),
    pool.query(
      `SELECT slug, title FROM lessons
        WHERE track_id = (SELECT track_id FROM lessons WHERE id = $1)
          AND sort > $2 AND status = ANY($3::lesson_status[])
        ORDER BY sort LIMIT 1`,
      [lesson.id, lesson.sort, VISIBLE]
    ),
  ]);
  delete lesson.id; delete lesson.sort;
  res.json({ ...lesson, blocks, next: next ?? null });
}));

// Seasons: the client picks the active ones by its own (local + hijri) date.
// Only seasons whose lesson is visible are returned, so unreviewed text never reaches the ticker.
router.get('/seasons', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT s.key, s.rule, s.theme, l.slug AS lesson, l.title, l.summary,
            coalesce((SELECT jsonb_agg(t.item ORDER BY b.sort, t.n)
                        FROM blocks b, jsonb_array_elements_text(b.content->'items') WITH ORDINALITY AS t(item, n)
                       WHERE b.lesson_id = l.id AND b.type = 'ticker'), '[]') AS ticker
       FROM seasons s JOIN lessons l ON l.id = s.lesson_id
      WHERE l.status = ANY($1::lesson_status[])
      ORDER BY s.sort`,
    [VISIBLE]
  );
  res.set('Cache-Control', 'public, max-age=300').json(rows);
}));

// Daily dose: one ayah + one dua, stable for the whole day.
router.get('/daily', wrap(async (_req, res) => {
  const pick = (types, extra = '') => pool.query(
    `SELECT b.type, b.content, s.title AS source, l.slug AS lesson, l.title AS lesson_title
       FROM blocks b JOIN lessons l ON l.id = b.lesson_id LEFT JOIN sources s ON s.id = b.source_id
      WHERE b.type = ANY($1) AND l.status = ANY($2::lesson_status[]) ${extra}
      ORDER BY md5(b.id::text || current_date::text) LIMIT 1`,
    [types, VISIBLE]
  );
  const [{ rows: [ayah] }, { rows: [dua] }] = await Promise.all([pick(['quran'], `AND b.content ? 'ayah'`), pick(['dua'])]);
  res.json({ ayah: ayah ?? null, dua: dua ?? null });
}));

export default router;
