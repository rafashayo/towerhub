/**
 * In-memory / localStorage "database" for the parts of the app that are
 * still simulated client-side: mod/comment/rating *records* (title,
 * description, category, ratings, comment text, etc).
 *
 * Accounts, authentication, AND file storage (screenshots + the mod file
 * itself) are NOT simulated anymore — they're served by the real
 * Express + SQLite backend in `server/` (see `services/authService.ts`,
 * `services/userService.ts`, `services/adminService.ts`, `services/uploadService.ts`,
 * all of which call the API via `lib/api.ts`). Mod records here just hold a
 * `fileMeta.url` / `screenshots[]` pointing at real files served from
 * `/api/uploads/files/…` — there's no more base64-in-localStorage or
 * in-memory blob registry.
 *
 * See README.md → "What's simulated vs. production" for what moving the
 * mod/comment/rating *records* themselves to the backend would look like.
 */
import type { Comment, Mod, Rating } from '../types'
import { readStore, writeStore } from '../lib/storage'
import { SEED_COMMENTS, SEED_MODS, SEED_RATINGS } from '../data/seed'

const KEYS = {
  mods: 'mods',
  comments: 'comments',
  ratings: 'ratings',
  seeded: 'seeded_v4',
} as const

function ensureSeeded() {
  if (readStore(KEYS.seeded, false)) return
  writeStore(KEYS.mods, SEED_MODS)
  writeStore(KEYS.comments, SEED_COMMENTS)
  writeStore(KEYS.ratings, SEED_RATINGS)
  writeStore(KEYS.seeded, true)
}

ensureSeeded()

export const db = {
  mods: {
    all: (): Mod[] => readStore(KEYS.mods, []),
    save: (mods: Mod[]) => writeStore(KEYS.mods, mods),
  },
  comments: {
    all: (): Comment[] => readStore(KEYS.comments, []),
    save: (comments: Comment[]) => writeStore(KEYS.comments, comments),
  },
  ratings: {
    all: (): Rating[] => readStore(KEYS.ratings, []),
    save: (ratings: Rating[]) => writeStore(KEYS.ratings, ratings),
  },
}
