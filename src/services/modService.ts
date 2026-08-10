import type { Mod, ModCategory, ModFileMeta, ModStatus, SortOption } from '../types'
import { db } from './db'
import { ApiError, request } from './http'
import { slugify, uid } from '../lib/utils'

export interface ModFilters {
  query?: string
  category?: ModCategory | 'all'
  sort?: SortOption
  status?: ModStatus | 'all'
  authorId?: string
}

function avgRating(modId: string): number {
  const ratings = db.ratings.all().filter((r) => r.modId === modId)
  if (!ratings.length) return 0
  return ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
}

function ratingCount(modId: string): number {
  return db.ratings.all().filter((r) => r.modId === modId).length
}

export interface ModWithStats extends Mod {
  avgRating: number
  ratingCount: number
}

function withStats(mod: Mod): ModWithStats {
  return { ...mod, avgRating: avgRating(mod.id), ratingCount: ratingCount(mod.id) }
}

export const modService = {
  list(filters: ModFilters = {}): Promise<ModWithStats[]> {
    return request(() => {
      let mods = db.mods.all()

      const status = filters.status ?? 'approved'
      if (status !== 'all') mods = mods.filter((m) => m.status === status)
      if (filters.authorId) mods = mods.filter((m) => m.authorId === filters.authorId)
      if (filters.category && filters.category !== 'all') {
        mods = mods.filter((m) => m.category === filters.category)
      }
      if (filters.query?.trim()) {
        const q = filters.query.trim().toLowerCase()
        mods = mods.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.authorName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        )
      }

      let withStatsMods = mods.map(withStats)

      const sort = filters.sort ?? 'popular'
      withStatsMods = withStatsMods.sort((a, b) => {
        switch (sort) {
          case 'recent':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'rating':
            return b.avgRating - a.avgRating || b.ratingCount - a.ratingCount
          case 'downloads':
            return b.downloadCount - a.downloadCount
          case 'popular':
          default:
            return b.downloadCount * 0.7 + b.favoriteCount * 3 - (a.downloadCount * 0.7 + a.favoriteCount * 3)
        }
      })

      return withStatsMods
    })
  },

  getBySlug(slug: string): Promise<ModWithStats | null> {
    return request(() => {
      const mod = db.mods.all().find((m) => m.slug === slug)
      return mod ? withStats(mod) : null
    })
  },

  getById(id: string): Promise<ModWithStats | null> {
    return request(() => {
      const mod = db.mods.all().find((m) => m.id === id)
      return mod ? withStats(mod) : null
    }, 60)
  },

  /**
   * `screenshots` are already-uploaded image URLs and `file` is the
   * already-uploaded mod file's metadata (both via `uploadService`, which
   * hits the real backend at `/api/uploads/*` — see server/src/routes/uploads.routes.js).
   * This function only ever deals with URLs/metadata, never raw bytes.
   */
  create(input: {
    title: string
    description: string
    category: ModCategory
    version: string
    credits: string
    authorId: string
    authorName: string
    screenshots: string[]
    file: ModFileMeta
  }): Promise<Mod> {
    return request(() => {
      if (input.title.trim().length < 4) throw new ApiError('The title is too short.')
      if (input.description.trim().length < 20) throw new ApiError('The description must be at least 20 characters long.')
      if (!input.screenshots.length) throw new ApiError('Upload at least one screenshot.')

      const mods = db.mods.all()
      const id = uid('m')
      const baseSlug = slugify(input.title) || id
      let slug = baseSlug
      let n = 1
      while (mods.some((m) => m.slug === slug)) {
        slug = `${baseSlug}-${++n}`
      }

      const now = new Date().toISOString()
      const mod: Mod = {
        id,
        slug,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        version: input.version.trim() || '1.0.0',
        authorId: input.authorId,
        authorName: input.authorName,
        credits: input.credits.trim(),
        screenshots: input.screenshots,
        fileMeta: input.file,
        status: 'pending',
        downloadCount: 0,
        favoriteCount: 0,
        changelog: [{ version: input.version.trim() || '1.0.0', notes: 'Initial release.', date: now }],
        createdAt: now,
        updatedAt: now,
        reported: false,
      }

      db.mods.save([...mods, mod])
      return mod
    }, 300)
  },

  setStatus(modId: string, status: ModStatus): Promise<Mod> {
    return request(() => {
      const mods = db.mods.all()
      const idx = mods.findIndex((m) => m.id === modId)
      if (idx === -1) throw new ApiError('Mod not found.', 404)
      mods[idx] = { ...mods[idx], status, updatedAt: new Date().toISOString() }
      db.mods.save(mods)
      return mods[idx]
    })
  },

  setReported(modId: string, reported: boolean): Promise<Mod> {
    return request(() => {
      const mods = db.mods.all()
      const idx = mods.findIndex((m) => m.id === modId)
      if (idx === -1) throw new ApiError('Mod not found.', 404)
      mods[idx] = { ...mods[idx], reported }
      db.mods.save(mods)
      return mods[idx]
    }, 120)
  },

  remove(modId: string): Promise<void> {
    return request(() => {
      db.mods.save(db.mods.all().filter((m) => m.id !== modId))
    })
  },

  registerDownload(modId: string): Promise<{ url: string; filename: string }> {
    return request(() => {
      const mods = db.mods.all()
      const idx = mods.findIndex((m) => m.id === modId)
      if (idx === -1) throw new ApiError('Mod not found.', 404)
      mods[idx] = { ...mods[idx], downloadCount: mods[idx].downloadCount + 1 }
      db.mods.save(mods)

      // fileMeta.url is a real file served by the backend (server/uploads/) —
      // no more in-memory blob registry or placeholder-text fallback.
      return { url: mods[idx].fileMeta.url, filename: mods[idx].fileMeta.name }
    }, 200)
  },
}
