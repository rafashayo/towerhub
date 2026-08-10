import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { uid } from './lib/ids.js'
import { avatarFor } from './lib/avatar.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(path.join(DATA_DIR, 'towerhub.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                TEXT PRIMARY KEY,
    username          TEXT UNIQUE NOT NULL,
    email             TEXT UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    avatar_url        TEXT NOT NULL,
    bio               TEXT NOT NULL DEFAULT '',
    role              TEXT NOT NULL DEFAULT 'user',
    status            TEXT NOT NULL DEFAULT 'active',
    email_verified    INTEGER NOT NULL DEFAULT 0,
    totp_secret       TEXT,
    totp_enabled      INTEGER NOT NULL DEFAULT 0,
    favorite_mod_ids  TEXT NOT NULL DEFAULT '[]',
    created_at        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    user_agent  TEXT,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    revoked_at  TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

  CREATE TABLE IF NOT EXISTS email_verifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used_at     TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used_at     TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pending_2fa (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL,
    success     INTEGER NOT NULL,
    reason      TEXT,
    ip          TEXT,
    created_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at);
`)

function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get()
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, avatar_url, bio, role, status, email_verified, favorite_mod_ids, created_at)
    VALUES (@id, @username, @email, @password_hash, @avatar_url, @bio, @role, @status, @email_verified, '[]', @created_at)
  `)

  const seedUsers = [
    {
      id: 'u_admin',
      username: 'admin',
      email: 'admin@towerhub.io',
      password: 'admin123',
      bio: 'Moderation and support for TowerHub.',
      role: 'admin',
      status: 'active',
    },
    {
      id: 'u_gus',
      username: 'GroundControlGus',
      email: 'gus@example.com',
      password: 'password1',
      bio: 'Virtual controller for 6 years. I specialize in realistic traffic packages.',
      role: 'user',
      status: 'active',
    },
    {
      id: 'u_fer',
      username: 'ILS_Fer',
      email: 'fer@example.com',
      password: 'password1',
      bio: 'I design airports and custom instrument panels for TS3.',
      role: 'user',
      status: 'active',
    },
    {
      id: 'u_tess',
      username: 'TaxiwayTess',
      email: 'tess@example.com',
      password: 'password1',
      bio: 'Liveries and visual detail. If it flies, I repaint it.',
      role: 'user',
      status: 'active',
    },
    {
      id: 'u_maria',
      username: 'AtcMaria',
      email: 'maria@example.com',
      password: 'password1',
      bio: 'Schedules based on real-world traffic.',
      role: 'user',
      status: 'active',
    },
    {
      id: 'u_rwy',
      username: 'Rwy27L',
      email: 'rwy@example.com',
      password: 'password1',
      bio: 'Tools and utilities to optimize your session.',
      role: 'user',
      status: 'warned',
    },
  ]

  const tx = db.transaction((users) => {
    for (const u of users) {
      insert.run({
        id: u.id,
        username: u.username,
        email: u.email,
        password_hash: bcrypt.hashSync(u.password, 12),
        avatar_url: avatarFor(u.username),
        bio: u.bio,
        role: u.role,
        status: u.status,
        email_verified: 1,
        created_at: now,
      })
    }
  })
  tx(seedUsers)

  console.log(`[towerhub-server] Seeded ${seedUsers.length} demo users.`)
}

seedIfEmpty()

export function newId(prefix) {
  return uid(prefix)
}
