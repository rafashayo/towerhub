import { apiFetch, setAccessToken } from '../lib/api'
import type { AccountSession, LoginResult, SafeUser } from '../types/auth'

export type { SafeUser, PublicUser, AdminUser, LoginAttempt, AccountSession, LoginResult } from '../types/auth'

export const authService = {
  async register(input: { username: string; email: string; password: string }): Promise<{ user: SafeUser; devVerifyUrl?: string }> {
    const data = await apiFetch<{ user: SafeUser; accessToken: string; devVerifyUrl?: string }>('/api/auth/register', {
      method: 'POST',
      body: input,
    })
    setAccessToken(data.accessToken)
    return { user: data.user, devVerifyUrl: data.devVerifyUrl }
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const data = await apiFetch<{ requires2FA: true; pendingId: string } | { user: SafeUser; accessToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password }, skipAuthRetry: true }
    )
    if ('requires2FA' in data && data.requires2FA) {
      return { requires2FA: true, pendingId: data.pendingId }
    }
    setAccessToken((data as { accessToken: string }).accessToken)
    return { requires2FA: false, user: (data as { user: SafeUser }).user }
  },

  async loginWithTwoFactor(pendingId: string, code: string): Promise<SafeUser> {
    const data = await apiFetch<{ user: SafeUser; accessToken: string }>('/api/auth/login/2fa', {
      method: 'POST',
      body: { pendingId, code },
      skipAuthRetry: true,
    })
    setAccessToken(data.accessToken)
    return data.user
  },

  async logout(): Promise<void> {
    await apiFetch('/api/auth/logout', { method: 'POST', skipAuthRetry: true })
    setAccessToken(null)
  },

  async logoutAll(): Promise<void> {
    await apiFetch('/api/auth/logout-all', { method: 'POST' })
    setAccessToken(null)
  },

  /** Silent session restore on app boot: exchanges the httpOnly refresh cookie for a fresh access token. */
  async currentUser(): Promise<SafeUser | null> {
    try {
      const data = await apiFetch<{ user: SafeUser; accessToken: string }>('/api/auth/refresh', {
        method: 'POST',
        skipAuthRetry: true,
      })
      setAccessToken(data.accessToken)
      return data.user
    } catch {
      setAccessToken(null)
      return null
    }
  },

  /** Lightweight re-fetch of the current user without touching the refresh cookie. */
  async me(): Promise<SafeUser> {
    const data = await apiFetch<{ user: SafeUser }>('/api/auth/me')
    return data.user
  },

  updateProfile(patch: Partial<Pick<SafeUser, 'bio' | 'avatarUrl' | 'username'>>): Promise<SafeUser> {
    return apiFetch<{ user: SafeUser }>('/api/users/me', { method: 'PATCH', body: patch }).then((d) => d.user)
  },

  toggleFavorite(modId: string): Promise<SafeUser> {
    return apiFetch<{ user: SafeUser }>('/api/users/me/favorites', { method: 'PATCH', body: { modId } }).then((d) => d.user)
  },

  forgotPassword(email: string): Promise<{ message: string; devPreviewUrl?: string }> {
    return apiFetch('/api/auth/forgot-password', { method: 'POST', body: { email }, skipAuthRetry: true })
  },

  resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiFetch('/api/auth/reset-password', { method: 'POST', body: { token, newPassword }, skipAuthRetry: true })
  },

  changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiFetch('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } })
  },

  verifyEmail(token: string): Promise<{ verified: boolean; message: string }> {
    return apiFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { skipAuthRetry: true })
  },

  resendVerification(): Promise<{ message: string; devPreviewUrl?: string }> {
    return apiFetch('/api/auth/resend-verification', { method: 'POST' })
  },

  setupTwoFactor(): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    return apiFetch('/api/auth/2fa/setup', { method: 'POST' })
  },

  enableTwoFactor(code: string): Promise<{ message: string }> {
    return apiFetch('/api/auth/2fa/enable', { method: 'POST', body: { code } })
  },

  disableTwoFactor(password: string): Promise<{ message: string }> {
    return apiFetch('/api/auth/2fa/disable', { method: 'POST', body: { password } })
  },

  listSessions(): Promise<AccountSession[]> {
    return apiFetch<{ sessions: AccountSession[] }>('/api/auth/sessions').then((d) => d.sessions)
  },

  revokeSession(id: string): Promise<void> {
    return apiFetch(`/api/auth/sessions/${id}`, { method: 'DELETE' })
  },
}
