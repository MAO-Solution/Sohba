// Creates or updates a staff account. Run locally against the target DB (e.g. Neon):
//   npm run user -- --email sheikh@example.com --name "الشيخ فلان" --role reviewer
// The password is asked interactively (never put it in shell history or a file).
// Re-running for an existing email resets the password (logging out its sessions) and updates name/role.
// --role none removes staff access.
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { pool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

const { values: a } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } });
const email = a.email?.trim().toLowerCase();
const role = a.role === 'none' ? null : a.role;
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email) || !['admin', 'reviewer', null].includes(role ?? null) || a.role === undefined) {
  console.error('Usage: npm run user -- --email <email> --name "<name>" --role admin|reviewer|none');
  process.exit(1);
}

function askHidden(q) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (ans) => { rl.close(); process.stdout.write('\n'); resolve(ans); });
  });
}

try {
  let hash = null;
  if (role) {
    const pw = await askHidden('Password (12+ chars): ');
    if (pw.length < 12) throw new Error('Password must be at least 12 characters.');
    if ((await askHidden('Repeat password: ')) !== pw) throw new Error('Passwords do not match.');
    hash = await hashPassword(pw);
  }
  const { rows: [u] } = await pool.query(
    `INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, coalesce($4, '!'))
     ON CONFLICT ((lower(email))) DO UPDATE SET
       name = coalesce(EXCLUDED.name, users.name), role = EXCLUDED.role,
       password_hash = coalesce($4, users.password_hash)
     RETURNING id, email, name, role`,
    [email, a.name ?? null, role, hash]
  );
  console.log(`OK: #${u.id} ${u.email} (${u.name ?? '-'}) role=${u.role ?? 'none'}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
