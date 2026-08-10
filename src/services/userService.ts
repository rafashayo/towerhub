import { apiFetch } from '../lib/api'
import type { PublicUser } from '../types/auth'

export const userService = {
  async findByUsername(username: string): Promise<PublicUser | null> {
    try {
      const data = await apiFetch<{ user: PublicUser }>(`/api/users/${encodeURIComponent(username)}`)
      return data.user
    } catch {
      return null
    }
  },
}
