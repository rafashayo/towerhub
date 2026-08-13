import { Router } from 'express'
import { z } from 'zod'
import { db, newId } from '../db.js'
import { hashPassword, verifyPassword } from '../lib/hash.js'
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
} from '../lib/tokens.js'
import { randomToken, sha256 } from '../lib/ids.js'
import { avatarFor } from '../lib/avatar.js'
import { toPrivateUser } from '../lib/serialize.js'
import { setRefreshCookie, clearRefreshCookie, getRefreshCookie } from '../lib/cookies.js'
import { simulateSendEmail } from '../lib/mailer.js'
import { verifyTotp } from '../lib/totp.js'
import { requireAuth } from '../middleware/auth.js'
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimit.js'
import { config } from '../config.js'

export const authRouter = Router()

// ---------- validation ----------
const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters long.')
  .max(24, 'Username must be at most 24 characters long.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, "_" and "-".')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(200)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
    message: 'Password must include upper case, lower case, and a number.',
  })

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email('Enter a valid email address.'),
  password: passwordSchema,
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

function badRequest(res, err) {
  const message = err instanceof z.ZodError ? err.issues[0]?.message ?? 'Invalid input.' : String(err)
  return res.status(400).json({ message })
}

function clientIp(req) {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
}

// ---------- session issuing ----------
/**
 * `rememberMe` controls both how long the refresh token is valid for
 * server-side (30 days vs a few hours, see config.js) and whether the
 * cookie itself persists across a browser restart (see cookies.js).
 */
function issueSession(user, req, res, rememberMe = false) {
  const accessToken = signAccessToken(user)
  const rawRefresh = generateRefreshToken()
  const expiresAt = refreshExpiryDate(rememberMe)

  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, remember_me, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId('rt'),
    user.id,
    hashRefreshToken(rawRefresh),
    req.headers['user-agent'] ?? null,
    rememberMe ? 1 : 0,
    new Date().toISOString(),
    expiresAt.toISOString()
  )

  setRefreshCookie(res, rawRefresh, expiresAt, rememberMe)
  return accessToken
}

function recordAttempt(email, success, reason, req) {
  db.prepare('INSERT INTO login_attempts (email, success, reason, ip, created_at) VALUES (?, ?, ?, ?, ?)').run(
    email.toLowerCase(),
    success ? 1 : 0,
    reason ?? null,
    clientIp(req),
    new Date().toISOString()
  )
}

// ---------- register ----------
authRouter.post('/register', registerLimiter, (req, res) => {
  let input
  try {
    input = registerSchema.parse(req.body)
  } catch (err) {
    return badRequest(res, err)
  }
  const email = input.email.toLowerCase()

  const existingEmail = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email)
  if (existingEmail) return res.status(409).json({ message: 'An account with that email already exists.' })
  const existingUsername = db.prepare('SELECT id FROM users WHERE lower(username) = ?').get(input.username.toLowerCase())
  if (existingUsername) return res.status(409).json({ message: 'That username is already taken.' })

  hashPassword(input.password).then((passwordHash) => {
    const now = new Date().toISOString()
    const user = {
      id: newId('u'),
      username: input.username,
      email,
      password_hash: passwordHash,
      avatar_url: avatarFor(input.username),
      bio: '',
      role: 'user',
      status: 'active',
      email_verified: 0,
      favorite_mod_ids: '[]',
      created_at: now,
    }
    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, avatar_url, bio, role, status, email_verified, favorite_mod_ids, created_at)
       VALUES (@id, @username, @email, @password_hash, @avatar_url, @bio, @role, @status, @email_verified, @favorite_mod_ids, @created_at)`
    ).run(user)

    const rawToken = randomToken()
    db.prepare(
      `INSERT INTO email_verifications (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(newId('ev'), user.id, sha256(rawToken), new Date(Date.now() + 24 * 3600000).toISOString(), now)

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${rawToken}`
    const { devPreviewUrl } = simulateSendEmail({ to: email, subject: 'Verify your TowerHub email', actionUrl: verifyUrl })

    // No session issued here on purpose — this account can't sign in until
    // the email is verified (see /login below), so registering doesn't log
    // you in like it used to.
    res.status(201).json({
      message: 'Account created. Check your email to verify your address before signing in.',
      devVerifyUrl: devPreviewUrl,
    })
  })
})

// ---------- login ----------
authRouter.post('/login', loginLimiter, (req, res) => {
  let input
  try {
    input = loginSchema.parse(req.body)
  } catch (err) {
    return badRequest(res, err)
  }
  const email = input.email.toLowerCase()
  const rememberMe = req.body?.rememberMe === true

  const windowStart = new Date(Date.now() - config.loginLockoutWindowMin * 60000).toISOString()
  // 'email_not_verified' is excluded on purpose: correct credentials aren't a
  // failed guess, so someone who just hasn't clicked their verification link
  // yet shouldn't be able to lock themselves out by retrying.
  const { failed } = db
    .prepare(
      "SELECT COUNT(*) AS failed FROM login_attempts WHERE email = ? AND success = 0 AND (reason IS NULL OR reason != 'email_not_verified') AND created_at > ?"
    )
    .get(email, windowStart)
  if (failed >= config.loginMaxAttempts) {
    return res.status(429).json({
      message: `Too many failed login attempts. Try again in ${config.loginLockoutWindowMin} minutes.`,
      code: 'LOCKED_OUT',
    })
  }

  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email)
  if (!user) {
    recordAttempt(email, false, 'no_such_user', req)
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }
  if (user.status === 'banned') {
    recordAttempt(email, false, 'banned', req)
    return res.status(403).json({ message: 'This account has been suspended. Contact an administrator.' })
  }

  verifyPassword(input.password, user.password_hash).then((ok) => {
    if (!ok) {
      recordAttempt(email, false, 'bad_password', req)
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }

    if (!user.email_verified) {
      recordAttempt(email, false, 'email_not_verified', req)
      return res.status(403).json({
        message: 'Please verify your email before signing in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    if (user.totp_enabled) {
      const pendingId = newId('p2fa')
      db.prepare('INSERT INTO pending_2fa (id, user_id, remember_me, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
        pendingId,
        user.id,
        rememberMe ? 1 : 0,
        new Date(Date.now() + 5 * 60000).toISOString(),
        new Date().toISOString()
      )
      recordAttempt(email, true, 'password_ok_awaiting_2fa', req)
      return res.json({ requires2FA: true, pendingId })
    }

    recordAttempt(email, true, null, req)
    const accessToken = issueSession(user, req, res, rememberMe)
    res.json({ user: toPrivateUser(user), accessToken })
  })
})

// ---------- 2FA login challenge ----------
authRouter.post('/login/2fa', loginLimiter, (req, res) => {
  const { pendingId, code } = req.body ?? {}
  if (!pendingId || !code) return res.status(400).json({ message: 'Missing verification code.' })

  const pending = db.prepare('SELECT * FROM pending_2fa WHERE id = ?').get(pendingId)
  if (!pending || new Date(pending.expires_at) < new Date()) {
    return res.status(400).json({ message: 'This login attempt expired. Sign in again.' })
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(pending.user_id)
  if (!user) return res.status(400).json({ message: 'Account no longer exists.' })

  if (!verifyTotp(code, user.totp_secret)) {
    return res.status(401).json({ message: 'Invalid verification code.' })
  }

  db.prepare('DELETE FROM pending_2fa WHERE id = ?').run(pendingId)
  recordAttempt(user.email, true, '2fa_ok', req)
  const accessToken = issueSession(user, req, res, !!pending.remember_me)
  res.json({ user: toPrivateUser(user), accessToken })
})

// ---------- refresh ----------
authRouter.post('/refresh', (req, res) => {
  const raw = getRefreshCookie(req)
  if (!raw) return res.status(401).json({ message: 'Not authenticated.' })

  const tokenHash = hashRefreshToken(raw)
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash)
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
    clearRefreshCookie(res)
    return res.status(401).json({ message: 'Session expired, please sign in again.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
  if (!user || user.status === 'banned') {
    clearRefreshCookie(res)
    return res.status(401).json({ message: 'Account unavailable.' })
  }

  // rotate: revoke the used token, issue a fresh one that preserves whether
  // this was a "remembered" session (persistent cookie + longer TTL) or not
  db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), row.id)
  const accessToken = issueSession(user, req, res, !!row.remember_me)
  res.json({ user: toPrivateUser(user), accessToken })
})

// ---------- logout ----------
authRouter.post('/logout', (req, res) => {
  const raw = getRefreshCookie(req)
  if (raw) {
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL').run(
      new Date().toISOString(),
      hashRefreshToken(raw)
    )
  }
  clearRefreshCookie(res)
  res.status(204).end()
})

authRouter.post('/logout-all', requireAuth, (req, res) => {
  db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    req.user.id
  )
  clearRefreshCookie(res)
  res.status(204).end()
})

// ---------- me ----------
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: toPrivateUser(req.user) })
})

// ---------- forgot / reset password ----------
authRouter.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const generic = { message: 'If an account with that email exists, a reset link has been sent.' }
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email)
  if (!user) return res.json(generic) // never reveal whether the email exists

  const rawToken = randomToken()
  db.prepare('INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
    newId('pr'),
    user.id,
    sha256(rawToken),
    new Date(Date.now() + 30 * 60000).toISOString(),
    new Date().toISOString()
  )

  const resetUrl = `${config.clientOrigin}/reset-password?token=${rawToken}`
  const { devPreviewUrl } = simulateSendEmail({ to: email, subject: 'Reset your TowerHub password', actionUrl: resetUrl })
  res.json({ ...generic, devPreviewUrl })
})

authRouter.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body ?? {}
  if (!token || !newPassword) return res.status(400).json({ message: 'Missing token or new password.' })
  try {
    passwordSchema.parse(newPassword)
  } catch (err) {
    return badRequest(res, err)
  }

  const tokenHash = sha256(token)
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(tokenHash)
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ message: 'This reset link is invalid or has expired.' })
  }

  hashPassword(newPassword).then((passwordHash) => {
    const now = new Date().toISOString()
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.user_id)
    db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(now, row.id)
    // A password reset is a strong signal to kill every existing session.
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now, row.user_id)
    res.json({ message: 'Password updated. You can now sign in with your new password.' })
  })
})

// ---------- change password (authenticated) ----------
authRouter.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing password fields.' })
  try {
    passwordSchema.parse(newPassword)
  } catch (err) {
    return badRequest(res, err)
  }

  verifyPassword(currentPassword, req.user.password_hash).then(async (ok) => {
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect.' })

    const passwordHash = await hashPassword(newPassword)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id)

    // Keep the current session alive, kill every other one.
    const currentRaw = getRefreshCookie(req)
    const currentHash = currentRaw ? hashRefreshToken(currentRaw) : null
    const now = new Date().toISOString()
    if (currentHash) {
      db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL AND token_hash != ?').run(
        now,
        req.user.id,
        currentHash
      )
    } else {
      db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now, req.user.id)
    }

    res.json({ message: 'Password changed. Your other sessions were signed out.' })
  })
})

// ---------- email verification ----------
authRouter.get('/verify-email', (req, res) => {
  const token = String(req.query.token ?? '')
  if (!token) return res.status(400).json({ verified: false, message: 'Missing token.' })

  const row = db.prepare('SELECT * FROM email_verifications WHERE token_hash = ?').get(sha256(token))
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ verified: false, message: 'This verification link is invalid or has expired.' })
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id)
  // Invalidate every outstanding verification token for this user, not just
  // the one that was clicked — otherwise an older link from an earlier
  // resend stays live (unused, unexpired) and can replay this same
  // auto-login indefinitely instead of being a true one-time link.
  db.prepare('UPDATE email_verifications SET used_at = ? WHERE user_id = ? AND used_at IS NULL').run(now, row.user_id)

  // Verifying is the last gate before this account can sign in — go ahead
  // and establish a session right here so clicking the link logs you in,
  // instead of bouncing back to a login form you'd otherwise now pass.
  // There's no "remember me" checkbox in this flow, so default to a
  // persistent session — clicking an emailed link is a deliberate enough
  // action that bouncing them to a session-only login would be annoying.
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
  const accessToken = issueSession(user, req, res, true)
  res.json({ verified: true, message: 'Email verified — you are now signed in.', user: toPrivateUser(user), accessToken })
})

authRouter.post('/resend-verification', forgotPasswordLimiter, (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const generic = { message: 'If that account exists and needs verifying, a new link has been sent.' }
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email)
  if (!user || user.email_verified) return res.json(generic) // don't reveal existence or verified-ness

  const rawToken = randomToken()
  db.prepare('INSERT INTO email_verifications (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
    newId('ev'),
    user.id,
    sha256(rawToken),
    new Date(Date.now() + 24 * 3600000).toISOString(),
    new Date().toISOString()
  )
  const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${rawToken}`
  const { devPreviewUrl } = simulateSendEmail({ to: user.email, subject: 'Verify your TowerHub email', actionUrl: verifyUrl })
  res.json({ ...generic, devPreviewUrl })
})

// ---------- sessions ----------
authRouter.get('/sessions', requireAuth, (req, res) => {
  const currentRaw = getRefreshCookie(req)
  const currentHash = currentRaw ? hashRefreshToken(currentRaw) : null

  const rows = db
    .prepare(
      `SELECT id, user_agent, remember_me, created_at, expires_at, token_hash FROM refresh_tokens
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC`
    )
    .all(req.user.id, new Date().toISOString())

  res.json({
    sessions: rows.map((r) => ({
      id: r.id,
      userAgent: r.user_agent,
      rememberMe: !!r.remember_me,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      current: r.token_hash === currentHash,
    })),
  })
})

authRouter.delete('/sessions/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ message: 'Session not found.' })

  db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), row.id)

  const currentRaw = getRefreshCookie(req)
  if (currentRaw && hashRefreshToken(currentRaw) === row.token_hash) clearRefreshCookie(res)

  res.status(204).end()
})
