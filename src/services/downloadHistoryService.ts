import { readStore, writeStore } from '../lib/storage'

/**
 * Per-browser record of "have I downloaded this mod before", keyed by user
 * id (or 'guest' when signed out) so it doesn't leak between accounts that
 * share a browser. This is purely a client-side courtesy — it doesn't
 * affect the mod's real `downloadCount`, which still increments on every
 * download regardless of history.
 */
type DownloadRecord = Record<string, string> // modId -> ISO timestamp of last download

function storeKey(userId: string): string {
  return `downloads:${userId}`
}

export const downloadHistoryService = {
  lastDownloadedAt(userId: string, modId: string): string | null {
    const record = readStore<DownloadRecord>(storeKey(userId), {})
    return record[modId] ?? null
  },

  markDownloaded(userId: string, modId: string): void {
    const record = readStore<DownloadRecord>(storeKey(userId), {})
    record[modId] = new Date().toISOString()
    writeStore(storeKey(userId), record)
  },
}
