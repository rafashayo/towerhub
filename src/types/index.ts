export type ModCategory =
  | 'Schedules'
  | 'Liveries'
  | 'Traffic'
  | 'Airports'
  | 'Tools'
  | 'Misc'
  | 'Instruments'
  | 'Utility'

export const MOD_CATEGORIES: ModCategory[] = [
  'Schedules',
  'Liveries',
  'Traffic',
  'Airports',
  'Tools',
  'Misc',
  'Instruments',
  'Utility',
]

export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'warned' | 'banned'

// Account/auth types (SafeUser, PublicUser, AdminUser, …) live in `types/auth.ts` —
// that data now comes from the real backend in `server/`, not from local mock state.

export type ModStatus = 'pending' | 'approved' | 'rejected'

export interface ChangelogEntry {
  version: string
  notes: string
  date: string
}

export interface ModFileMeta {
  name: string
  sizeBytes: number
  type: string
  /** Real, server-hosted URL (/api/uploads/files/mods/…) — see uploadService.ts. */
  url: string
}

export interface Mod {
  id: string
  slug: string
  title: string
  description: string
  category: ModCategory
  version: string
  authorId: string
  authorName: string
  credits: string
  screenshots: string[]
  fileMeta: ModFileMeta
  status: ModStatus
  downloadCount: number
  favoriteCount: number
  changelog: ChangelogEntry[]
  createdAt: string
  updatedAt: string
  reported: boolean
}

export interface Rating {
  id: string
  modId: string
  userId: string
  stars: 1 | 2 | 3 | 4 | 5
  createdAt: string
}

export interface Comment {
  id: string
  modId: string
  userId: string
  userName: string
  userAvatar: string
  text: string
  parentId: string | null
  createdAt: string
  reported: boolean
}

export type SortOption = 'popular' | 'recent' | 'rating' | 'downloads'
