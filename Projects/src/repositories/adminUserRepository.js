const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

function verifyPassword(password, saltHex, hashHex) {
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length, SCRYPT_OPTIONS);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

class AdminUserRepository {
  constructor(db) {
    this.db = db;
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.upsertFromEnvironment();
  }

  upsertFromEnvironment() {
    const username = (process.env.GRAMAGLOW_ADMIN_USERNAME || 'admin').trim();
    const password = process.env.GRAMAGLOW_ADMIN_PASSWORD || '';
    if (!password) return;
    const credentials = hashPassword(password);
    this.db.prepare(`
      INSERT INTO admin_users (username, password_salt, password_hash)
      VALUES (?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password_salt = excluded.password_salt,
        password_hash = excluded.password_hash,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(username, credentials.salt, credentials.hash);
  }

  findActiveByUsername(username) {
    return this.db.prepare(`
      SELECT id, username, password_salt, password_hash, role
      FROM admin_users WHERE username = ? AND is_active = 1
    `).get(String(username || ''));
  }

  verify(username, password) {
    const user = this.findActiveByUsername(username);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) return null;
    return { id: user.id, username: user.username, role: user.role };
  }
}

module.exports = { AdminUserRepository, hashPassword, verifyPassword };
