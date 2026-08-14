import { apiFetch } from '../lib/api'
import type { Mod } from '../types'

function ownedPath(url: string | undefined): string | undefined {
  return url?.startsWith('/api/files/') ? url : undefined
}

export const notificationService = {
  /**
   * Best-effort only — posts a Discord embed via the backend (which owns the
   * real webhook URL as a server-side secret, see server/src/lib/discord.js).
   * Fired when an admin approves a mod (Admin panel → Approve), not on
   * upload — a pending/rejected mod shouldn't ping the channel. Never
   * throws: a failed/unconfigured webhook shouldn't disrupt moderation.
   */
  async notifyModApproved(mod: Mod): Promise<void> {
    try {
      await apiFetch('/api/notifications/mod-approved', {
        method: 'POST',
        body: {
          title: mod.title,
          description: mod.description,
          category: mod.category,
          version: mod.version,
          slug: mod.slug,
          authorName: mod.authorName,
          thumbnailPath: ownedPath(mod.screenshots[0]),
        },
      })
    } catch (err) {
      console.warn('[towerhub] Discord notification failed (non-fatal):', err)
    }
  },
}
