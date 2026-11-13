import express from 'express';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import api from './routes/api.js';
import admin from './routes/admin.js';
import { pool } from './db.js';

const app = express();
const publicDir = path.resolve(import.meta.dirname, '..', 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  });
  next();
});

// Minimal per-IP rate limit for the API (in-memory; fine for a single instance).
const hits = new Map();
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN ?? 120);
setInterval(() => hits.clear(), 60_000).unref();
app.use('/api', (req, res, next) => {
  const n = (hits.get(req.ip) ?? 0) + 1;
  hits.set(req.ip, n);
  if (n > LIMIT) return res.status(429).json({ error: 'too_many_requests' });
  next();
});

app.get('/healthz', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});

app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

app.use('/admin/api', admin);
// Admin shell: same tracing trick as index.html below. Strict CSP: no inline script anywhere.
const adminShell = readFileSync(new URL('../public/admin.html', import.meta.url), 'utf8');
app.get('/admin', (_req, res) => res.type('html').set({
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
}).send(adminShell));

app.use(express.static(publicDir, { maxAge: '1h', index: 'index.html' }));
// The app shell is read once at startup. Referencing it with new URL(..., import.meta.url) lets
// Vercel's file tracing bundle it into the function (on Vercel, "/" reaches the function, not the CDN).
const shell = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
app.get('*', (_req, res) => res.type('html').set('Cache-Control', 'no-cache').send(shell));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

export default app;
