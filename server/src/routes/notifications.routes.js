import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { sendModApprovedEmbed } from '../lib/discord.js'
import { config } from '../config.js'

export const notificationsRouter = Router()

const MOD_CATEGORIES = ['Schedules', 'Liveries', 'Traffic', 'Airports', 'Tools', 'Misc', 'Instruments', 'Utility']

const notifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many notifications sent, try again later.' }),
})

// Only accept an image path we actually serve ourselves — never let a
// caller point this webhook's embed at an arbitrary third-party URL.
const ownedPath = z
  .string()
  .max(300)
  .refine((v) => v.startsWith('/api/files/'), 'Must be a path served by this server.')

const modApprovedSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(MOD_CATEGORIES),
  version: z.string().trim().min(1).max(50),
  slug: z.string().trim().min(1).max(120),
  authorName: z.string().trim().min(1).max(60),
  thumbnailPath: ownedPath.optional(),
})

// requireAdmin because this fires from Admin panel → approve, not from the
// upload form — a mod being *submitted* shouldn't ping the channel, only
// one an admin actually greenlit.
notificationsRouter.post('/mod-approved', requireAuth, requireAdmin, notifyLimiter, async (req, res) => {
  let input
  try {
    input = modApprovedSchema.parse(req.body)
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? 'Invalid input.' : String(err)
    return res.status(400).json({ message })
  }

  const result = await sendModApprovedEmbed({
    title: input.title,
    description: input.description,
    category: input.category,
    version: input.version,
    authorName: input.authorName,
    thumbnailUrl: input.thumbnailPath ? `${config.clientOrigin}${input.thumbnailPath}` : undefined,
    url: `${config.clientOrigin}/mods/${input.slug}`,
  })

  res.json(result)
})
