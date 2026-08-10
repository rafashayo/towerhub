const PREFIX = 'towerhub:'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error(`[towerhub] no se pudo persistir "${key}" en localStorage`, err)
  }
}

export function clearStore(key: string): void {
  localStorage.removeItem(PREFIX + key)
}
