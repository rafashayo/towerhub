// Dev utility: wipes every table except the admin user row(s) in `users`.
// Run with: node scripts/reset-except-admin.js  (from the server/ directory)
import { db } from '../src/db.js'

const tx = db.transaction(() => {
  db.prepare('DELETE FROM login_attempts').run()
  db.prepare('DELETE FROM pending_2fa').run()
  db.prepare('DELETE FROM email_verifications').run()
  db.prepare('DELETE FROM password_resets').run()
  db.prepare('DELETE FROM refresh_tokens').run()
  const { changes } = db.prepare("DELETE FROM users WHERE role != 'admin'").run()
  return changes
})

const deletedUsers = tx()
const remaining = db.prepare('SELECT id, username, email, role FROM users').all()

console.log(`Deleted ${deletedUsers} non-admin user(s) and cleared all sessions/tokens/attempts.`)
console.log('Remaining users:', remaining)
