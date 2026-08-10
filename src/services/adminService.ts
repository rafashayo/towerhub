import { apiFetch } from '../lib/api'
import type { AdminUser, LoginAttempt } from '../types/auth'
import type { UserStatus } from '../types'

export const adminService = {
  listUsers(): Promise<AdminUser[]> {
    return apiFetch<{ users: AdminUser[] }>('/api/admin/users').then((d) => d.users)
  },

  setUserStatus(userId: string, status: UserStatus): Promise<AdminUser> {
    return apiFetch<{ user: AdminUser }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    }).then((d) => d.user)
  },

  listLoginAttempts(limit = 50): Promise<LoginAttempt[]> {
    return apiFetch<{ attempts: LoginAttempt[] }>(`/api/admin/login-attempts?limit=${limit}`).then((d) => d.attempts)
  },
}
