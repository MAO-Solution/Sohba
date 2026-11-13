// Loads content/*.json into Postgres. Idempotent: safe to run on every deploy.
// Usage: npm run seed
//
// Review state lives in the DB, not in Git:
// - A lesson's `status` / `reviewed_*` in JSON is used only when the lesson is first inserted.
// - After that, the seed never touches them, unless the lesson's content changed (content_hash):
//   then an approved/published lesson goes back to in_review and its review is cleared.
// - Blocks are rewritten only when the content changed, so block ids stay stable.
import { createHash } from 'node:crypto';
import { pool } from '../server/db.js';
import { loadContent } from './content.js';

const REVIEWED = new Set(['approved', 'published']);

// Key-order-independent JSON, so reformatting a file doesn't count as a content change.
const canonical = (v) =>
  Array.isArray(v) ? `[${v.map(canonical).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
  : JSON.stringify(v);

// What the reviewer signs off on: the text the user reads.
const hashLesson = (l) =>
  createHash('sha256').update(canonical({ title: l.title, summary: l.summary ?? null, blocks: l.blocks })).digest('hex');

async function seed() {
  const { tracks, sources, lessons } = await loadContent();
  const client = await pool.connect();
  const stats = { inserted: 0, changed: 0, unchanged: 0, backToReview: [] };
  try {
    await client.query('BEGIN');
    // Two overlapping deploys must not seed at the same time.
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('sohba:seed'))`);

    for (const t of tracks) {
      await client.query(
        `INSERT INTO tracks (slug, title, subtitle, sort, is_available) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (slug) DO UPDATE SET title=$2, subtitle=$3, sort=$4, is_available=$5`,
        [t.slug, t.title, t.subtitle, t.sort, t.is_available]
      );
    }
    for (const s of sources) {
      await client.query(
        `INSERT INTO sources (key, kind, title, ref, url) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (key) DO UPDATE SET kind=$2, title=$3, ref=$4, url=$5`,
        [s.key, s.kind, s.title, s.ref ?? null, s.url ?? null]
      );
    }
    const srcId = Object.fromEntries((await client.query('SELECT id, key FROM sources')).rows.map((r) => [r.key, r.id]));

    // Validate every lesson up front, including unchanged ones, so a broken source fails the deploy.
    for (const l of lessons) {
      for (const b of l.blocks) {
        if (b.source && !srcId[b.source]) throw new Error(`Unknown source "${b.source}" in lesson ${l.slug}`);
      }
    }

    const existing = new Map(
      (await client.query('SELECT id, slug, status, content_hash FROM lessons FOR UPDATE')).rows.map((r) => [r.slug, r])
    );

    for (const l of lessons) {
      const hash = hashLesson(l);
      const old = existing.get(l.slug);
      let lessonId;

      if (!old) {
        ({ rows: [{ id: lessonId }] } = await client.query(
          `INSERT INTO lessons (track_id, slug, title, summary, sort, status, reviewed_by, reviewed_at, content_hash)
           VALUES ((SELECT id FROM tracks WHERE slug=$1), $2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [l.track, l.slug, l.title, l.summary, l.sort, l.status ?? 'draft', l.reviewed_by ?? null, l.reviewed_at ?? null, hash]
        ));
        stats.inserted++;
      } else {
        lessonId = old.id;
        const changed = old.content_hash !== hash;
        const demote = changed && REVIEWED.has(old.status);
        await client.query(
          `UPDATE lessons SET track_id=(SELECT id FROM tracks WHERE slug=$2), title=$3, summary=$4, sort=$5,
                  content_hash=$6
                  ${changed ? ', updated_at=now()' : ''}
                  ${demote ? `, status='in_review', reviewed_by=NULL, reviewed_at=NULL` : ''}
            WHERE id=$1`,
          [lessonId, l.track, l.title, l.summary, l.sort, hash]
        );
        if (demote) {
          stats.backToReview.push(l.slug);
          await client.query(
            `INSERT INTO lesson_reviews (lesson_id, action, from_status, to_status, content_hash)
             VALUES ($1, 'content_changed', $2, 'in_review', $3)`,
            [lessonId, old.status, hash]
          );
        }
        if (!changed) { stats.unchanged++; continue; }
        stats.changed++;
      }

      await client.query('DELETE FROM blocks WHERE lesson_id=$1', [lessonId]);
      for (const [i, b] of l.blocks.entries()) {
        const { type, source, ...content } = b;
        await client.query(
          'INSERT INTO blocks (lesson_id, sort, type, content, source_id) VALUES ($1,$2,$3,$4,$5)',
          [lessonId, i + 1, type, content, source ? srcId[source] : null]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${tracks.length} tracks, ${sources.length} sources, ${lessons.length} lessons ` +
      `(new ${stats.inserted}, changed ${stats.changed}, unchanged ${stats.unchanged}).`);
    if (stats.backToReview.length) console.warn(`Back to in_review (content changed): ${stats.backToReview.join(', ')}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
