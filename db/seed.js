// Loads content/*.json into Postgres. Idempotent: safe to run again after editing content.
// Usage: npm run seed
import { pool } from '../server/db.js';
import { loadContent } from './content.js';

async function seed() {
  const { tracks, sources, lessons } = await loadContent();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    for (const l of lessons) {
      const { rows: [lesson] } = await client.query(
        `INSERT INTO lessons (track_id, slug, title, summary, sort, status, reviewed_by, reviewed_at, updated_at)
         VALUES ((SELECT id FROM tracks WHERE slug=$1), $2,$3,$4,$5,$6,$7,$8, now())
         ON CONFLICT (slug) DO UPDATE SET track_id=EXCLUDED.track_id, title=$3, summary=$4, sort=$5,
           status=$6, reviewed_by=$7, reviewed_at=$8, updated_at=now()
         RETURNING id`,
        [l.track, l.slug, l.title, l.summary, l.sort, l.status ?? 'draft', l.reviewed_by ?? null, l.reviewed_at ?? null]
      );
      await client.query('DELETE FROM blocks WHERE lesson_id=$1', [lesson.id]);
      for (const [i, b] of l.blocks.entries()) {
        const { type, source, ...content } = b;
        if (source && !srcId[source]) throw new Error(`Unknown source "${source}" in lesson ${l.slug}`);
        await client.query(
          'INSERT INTO blocks (lesson_id, sort, type, content, source_id) VALUES ($1,$2,$3,$4,$5)',
          [lesson.id, i + 1, type, content, source ? srcId[source] : null]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${tracks.length} tracks, ${sources.length} sources, ${lessons.length} lessons.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
