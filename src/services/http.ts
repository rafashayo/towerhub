/**
 * Simulates the shape of a real network call: async, latency, and a place
 * for errors to surface. Every function in `services/*.ts` is written
 * against this so that replacing the body with a real `fetch('/api/...')`
 * later is a mechanical change — callers (components/pages) never touch
 * `localStorage` or synchronous data directly.
 */
export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function request<T>(work: () => T, delayMs = 220): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(work())
      } catch (err) {
        reject(err)
      }
    }, delayMs)
  })
}
