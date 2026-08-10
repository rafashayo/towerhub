import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { generateTotpSecret, totpKeyUri, totpQrCodeDataUrl, verifyTotp } from '../lib/totp.js'
import { verifyPassword } from '../lib/hash.js'

export const twoFactorRouter = Router()

// Generates (or regenerates) a pending secret. Not active until /enable confirms
// the user can actually produce a valid code with it.
twoFactorRouter.post('/setup', requireAuth, async (req, res) => {
  const secret = generateTotpSecret()
  db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secret, req.user.id)

  const otpauthUrl = totpKeyUri(req.user.email, secret)
  const qrCodeDataUrl = await totpQrCodeDataUrl(otpauthUrl)
  res.json({ secret, otpauthUrl, qrCodeDataUrl })
})

twoFactorRouter.post('/enable', requireAuth, (req, res) => {
  const { code } = req.body ?? {}
  if (!req.user.totp_secret) return res.status(400).json({ message: 'Start 2FA setup first.' })
  if (!verifyTotp(code, req.user.totp_secret)) return res.status(400).json({ message: 'Invalid code. Check your authenticator app and try again.' })

  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.user.id)
  res.json({ message: 'Two-factor authentication enabled.' })
})

twoFactorRouter.post('/disable', requireAuth, async (req, res) => {
  const { password } = req.body ?? {}
  const ok = await verifyPassword(password ?? '', req.user.password_hash)
  if (!ok) return res.status(401).json({ message: 'Incorrect password.' })

  db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(req.user.id)
  res.json({ message: 'Two-factor authentication disabled.' })
})
