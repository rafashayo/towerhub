import { db } from '../db.js'
import { verifyAccessToken } from '../lib/tokens.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return res.status(401).json({ message: 'Session expired.', code: 'TOKEN_EXPIRED' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
  if (!user) return res.status(401).json({ message: 'Account no longer exists.' })
  if (user.status === 'banned') return res.status(403).json({ message: 'This account has been suspended.' })

  req.user = user
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrators only.' })
  next()
}
