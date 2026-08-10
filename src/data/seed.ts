import type { Comment, Mod, Rating } from '../types'
import { avatarFor } from '../lib/utils'
import { generateScreenshot } from '../lib/placeholder'

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

/**
 * Minimal author lookup used only to stamp usernames/avatars onto any
 * simulated mods/comments seeded below. Real accounts (credentials, roles,
 * etc.) live in the backend's SQLite database now — see `server/src/db.js`,
 * which seeds the same six usernames/ids so mod and comment authorship
 * would line up with real, loggable-in accounts if seed mods are added back.
 */
const AUTHORS = {
  u_admin: { username: 'admin', avatarUrl: avatarFor('admin') },
  u_gus: { username: 'GroundControlGus', avatarUrl: avatarFor('GroundControlGus') },
  u_fer: { username: 'ILS_Fer', avatarUrl: avatarFor('ILS_Fer') },
  u_tess: { username: 'TaxiwayTess', avatarUrl: avatarFor('TaxiwayTess') },
  u_maria: { username: 'AtcMaria', avatarUrl: avatarFor('AtcMaria') },
  u_rwy: { username: 'Rwy27L', avatarUrl: avatarFor('Rwy27L') },
} as const

interface SeedModInput {
  id: string
  title: string
  description: string
  category: Mod['category']
  version: string
  authorId: string
  authorName: string
  credits: string
  days: number
  downloads: number
  status?: Mod['status']
  reported?: boolean
  shots?: number
}

// Catalog starts empty — mods only appear once real users upload them via
// "Upload a mod" (or moderators approve them from Admin panel → Pending mods).
const RAW_MODS: SeedModInput[] = []

export const SEED_MODS: Mod[] = RAW_MODS.map((m) => {
  const shotCount = 2 + (m.title.length % 3)
  return {
    id: m.id,
    slug: `${m.id.replace('m_', '')}`,
    title: m.title,
    description: m.description,
    category: m.category,
    version: m.version,
    authorId: m.authorId,
    authorName: m.authorName,
    credits: m.credits,
    screenshots: Array.from({ length: shotCount }, (_, i) =>
      generateScreenshot(`${m.id}-${i}`, m.title)
    ),
    fileMeta: {
      name: `${m.id.replace('m_', '')}-v${m.version}.ts3mod`,
      sizeBytes: 1_200_000 + (m.downloads % 9) * 480_000,
      type: 'application/octet-stream',
      // Seed mods have no real backing file — real uploads get a genuine
      // /api/uploads/files/mods/… URL from uploadService instead (see UploadMod.tsx).
      url: '',
    },
    status: m.status ?? 'approved',
    downloadCount: m.downloads,
    favoriteCount: Math.round(m.downloads * 0.04),
    changelog: [
      { version: m.version, notes: 'Minor tweaks and fixes.', date: daysAgo(m.days) },
      { version: '0.9.0', notes: 'First beta release published.', date: daysAgo(m.days + 20) },
    ],
    createdAt: daysAgo(m.days + 20),
    updatedAt: daysAgo(m.days),
    reported: m.reported ?? false,
  }
})

const commentSeed: [string, string, string, number][] = []

export const SEED_COMMENTS: Comment[] = commentSeed.map(([modId, userId, text, days], i) => {
  const author = AUTHORS[userId as keyof typeof AUTHORS]
  return {
    id: `c_seed_${i}`,
    modId,
    userId,
    userName: author.username,
    userAvatar: author.avatarUrl,
    text,
    parentId: null,
    createdAt: daysAgo(days),
    reported: false,
  }
})

export const SEED_RATINGS: Rating[] = []
