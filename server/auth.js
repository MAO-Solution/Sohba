// Staff auth: scrypt passwords + stateless HMAC-signed session cookie (works on serverless).
// The signature also covers the user's password hash, so changing a password logs out every session.
import { scrypt as scryptCb, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';

const scrypt = promisify(scryptCb);
const KEYLEN = 64;
const COOKIE = 'sohba_s';
const TTL_SEC = 12 * 60 * 60;
const SECRET = process.env.SESSION_SECRET ?? '';
export const authEnabled = SECRET.length >= 32;

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, KEYLEN);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

// Used when the email doesn't exist, so a miss costs the same time as a wrong password.
const DUMMY = await hashPassword(randomBytes(16).toString('hex'));

export async function verifyPassword(pw, stored) {
  const [alg, salt, key] = String(stored ?? DUMMY).split('$');
  if (alg !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  const actual = await scrypt(pw, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

const sign = (uid, exp, pwHash) =>
  createHmac('sha256', SECRET).update(`${uid}.${exp}.${pwHash}`).digest('base64url');

const safeEq = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

function readCookie(req) {
  const raw = req.headers.cookie ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

const cookieAttrs = (req, maxAge) =>
  `Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${req.secure ? '; Secure' : ''}`;

export function setSession(req, res, user) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  res.append('Set-Cookie', `${COOKIE}=${user.id}.${exp}.${sign(user.id, exp, user.password_hash)}; ${cookieAttrs(req, TTL_SEC)}`);
}

export function clearSession(req, res) {
  res.append('Set-Cookie', `${COOKIE}=; ${cookieAttrs(req, 0)}`);
}

// Resolves the session to a live staff user (role re-checked from the DB on every request).
export async function currentUser(req) {
  const token = readCookie(req);
  if (!token) return null;
  const [uidS, expS, sig] = token.split('.');
  const uid = Number(uidS), exp = Number(expS);
  if (!Number.isInteger(uid) || !Number.isInteger(exp) || !sig || exp < Date.now() / 1000) return null;
  const { rows: [u] } = await pool.query(
    'SELECT id, email, name, role, password_hash FROM users WHERE id = $1 AND role IS NOT NULL', [uid]
  );
  if (!u || !safeEq(sig, sign(u.id, exp, u.password_hash))) return null;
  delete u.password_hash;
  return u;
}

/* ---------- brute-force throttling (DB-backed) ---------- */
const WINDOW = '15 minutes';
const MAX = { ip: 20, email: 5 };

export async function isThrottled(ip, email) {
  const { rows: [r] } = await pool.query(
    `SELECT count(*) FILTER (WHERE key = $1)::int AS ip, count(*) FILTER (WHERE key = $2)::int AS email
       FROM auth_failures WHERE key IN ($1, $2) AND at > now() - $3::interval`,
    [`ip:${ip}`, `email:${email}`, WINDOW]
  );
  return r.ip >= MAX.ip || r.email >= MAX.email;
}

export async function recordFailure(ip, email) {
  await pool.query(
    `WITH gc AS (DELETE FROM auth_failures WHERE at < now() - interval '1 day')
     INSERT INTO auth_failures (key) VALUES ($1), ($2)`,
    [`ip:${ip}`, `email:${email}`]
  );
}

export async function clearFailures(email) {
  await pool.query('DELETE FROM auth_failures WHERE key = $1', [`email:${email}`]);
}
