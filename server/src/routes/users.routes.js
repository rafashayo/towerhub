import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { toPrivateUser, toPublicUser } from '../lib/serialize.js'

export const usersRouter = Router()

const updateProfileSchema = z.object({
  bio: z.string().max(280).optional(),
  // Either a real uploaded file URL (/api/uploads/files/images/...) or a
  // data: URI (the "shuffle avatar" feature generates a small SVG inline
  // client-side without an upload round-trip).
  avatarUrl: z
    .string()
    .max(4096)
    .refine((v) => v.startsWith('data:image/') || v.startsWith('/api/files/images/'), 'Invalid avatar.')
    .optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
})

// Public profile — no email, no security state.
usersRouter.get('/:username', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE lower(username) = ?').get(req.params.username.toLowerCase())
  if (!row) return res.status(404).json({ message: 'User not found.' })
  res.json({ user: toPublicUser(row) })
})

usersRouter.patch('/me', requireAuth, (req, res) => {
  let input
  try {
    input = updateProfileSchema.parse(req.body)
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? 'Invalid input.' : String(err)
    return res.status(400).json({ message })
  }

  if (input.username && input.username.toLowerCase() !== req.user.username.toLowerCase()) {
    const taken = db.prepare('SELECT id FROM users WHERE lower(username) = ?').get(input.username.toLowerCase())
    if (taken) return res.status(409).json({ message: 'That username is already taken.' })
  }

  const next = {
    bio: input.bio ?? req.user.bio,
    avatar_url: input.avatarUrl ?? req.user.avatar_url,
    username: input.username ?? req.user.username,
  }
  db.prepare('UPDATE users SET bio = ?, avatar_url = ?, username = ? WHERE id = ?').run(
    next.bio,
    next.avatar_url,
    next.username,
    req.user.id
  )

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: toPrivateUser(updated) })
})

usersRouter.patch('/me/favorites', requireAuth, (req, res) => {
  const { modId } = req.body ?? {}
  if (!modId || typeof modId !== 'string') return res.status(400).json({ message: 'modId is required.' })

  let favorites = []
  try {
    favorites = JSON.parse(req.user.favorite_mod_ids ?? '[]')
  } catch {
    favorites = []
  }

  favorites = favorites.includes(modId) ? favorites.filter((id) => id !== modId) : [...favorites, modId]

  db.prepare('UPDATE users SET favorite_mod_ids = ? WHERE id = ?').run(JSON.stringify(favorites), req.user.id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: toPrivateUser(updated) })
})
