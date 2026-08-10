import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { toAdminUser } from '../lib/serialize.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/users', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  res.json({ users: rows.map(toAdminUser) })
})

adminRouter.patch('/users/:id/status', (req, res) => {
  const { status } = req.body ?? {}
  if (!['active', 'warned', 'banned'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' })
  }

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!target) return res.status(404).json({ message: 'User not found.' })
  if (target.role === 'admin') return res.status(403).json({ message: 'An administrator cannot be sanctioned.' })

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, target.id)

  if (status === 'banned') {
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
      new Date().toISOString(),
      target.id
    )
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(target.id)
  res.json({ user: toAdminUser(updated) })
})

adminRouter.get('/login-attempts', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const rows = db.prepare('SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT ?').all(limit)
  res.json({
    attempts: rows.map((r) => ({
      id: r.id,
      email: r.email,
      success: !!r.success,
      reason: r.reason,
      ip: r.ip,
      createdAt: r.created_at,
    })),
  })
})
