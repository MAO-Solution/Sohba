import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Copy .env.example to .env and fill it.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
