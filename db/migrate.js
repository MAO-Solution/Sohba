// Applies db/migrations/*.sql in order, once each. Usage: npm run migrate
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../server/db.js';

const dir = path.resolve(import.meta.dirname, 'migrations');

async function migrate() {
  const { rows } = await pool.query(`SELECT to_regclass('schema_migrations') AS t`);
  const applied = new Set(
    rows[0].t ? (await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name) : []
  );
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    const name = file.replace(/\.sql$/, '');
    if (applied.has(name)) continue;
    await pool.query(await readFile(path.join(dir, file), 'utf8'));
    console.log(`applied ${name}`);
  }
  await pool.end();
}

migrate().catch((e) => { console.error(e.message); process.exit(1); });
