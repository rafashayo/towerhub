import type { UserRole, UserStatus } from './index'

/** The authenticated user's own view of their account — from /api/auth/me, login, register, refresh. */
export interface SafeUser {
  id: string
  username: string
  email: string
  avatarUrl: string
  bio: string
  role: UserRole
  status: UserStatus
  favoriteModIds: string[]
  createdAt: string
  emailVerified: boolean
  totpEnabled: boolean
}

/** What anyone can see on GET /api/users/:username — no email, no security flags. */
export interface PublicUser {
  id: string
  username: string
  avatarUrl: string
  bio: string
  role: UserRole
  createdAt: string
}

/** Admin user-management listing — from GET /api/admin/users. */
export interface AdminUser {
  id: string
  username: string
  email: string
  avatarUrl: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
}

export interface LoginAttempt {
  id: number
  email: string
  success: boolean
  reason: string | null
  ip: string | null
  createdAt: string
}

export interface AccountSession {
  id: string
  userAgent: string | null
  createdAt: string
  expiresAt: string
  current: boolean
}

export type LoginResult = { requires2FA: true; pendingId: string } | { requires2FA: false; user: SafeUser }
