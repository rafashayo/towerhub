export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Kept in memory only (never localStorage) — an XSS payload that can read
// localStorage can't read a module-scoped JS variable, which is the whole
// point of pairing a short-lived access token with an httpOnly refresh
// cookie. Lost on full page reload by design; `authService.currentUser()`
// re-derives it from the refresh cookie on app start.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  skipAuthRetry?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null)
          return false
        }
        const data = await res.json()
        setAccessToken(data.accessToken)
        return true
      })
      .catch(() => {
        setAccessToken(null)
        return false
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const doFetch = () =>
    fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

  let res = await doFetch()

  if (res.status === 401 && !options.skipAuthRetry && path !== '/api/auth/refresh') {
    const refreshed = await tryRefresh()
    if (refreshed) res = await doFetch()
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.message ?? 'Something went wrong.', res.status, data.code)
  }
  return data as T
}

/** Multipart upload (real file, not base64-in-JSON) — same auth/refresh handling as apiFetch. */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const doUpload = () => {
    const form = new FormData()
    form.append('file', file)
    return fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: form,
    })
  }

  let res = await doUpload()

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) res = await doUpload()
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.message ?? 'Upload failed.', res.status, data.code)
  }
  return data as T
}

/**
 * Multipart upload with real upload-progress events, for large files
 * (mod packages up to a couple GB) where `fetch` gives no progress signal.
 * XMLHttpRequest is the only browser API that exposes `upload.onprogress`.
 */
export function apiUploadWithProgress<T>(path: string, file: File, onProgress?: (percent: number) => void): Promise<T> {
  const attempt = (): Promise<{ status: number; body: Record<string, unknown> }> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', path)
      xhr.withCredentials = true
      if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        let body: Record<string, unknown> = {}
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          // non-JSON error page (e.g. a proxy timeout) — leave body empty, status still signals failure
        }
        resolve({ status: xhr.status, body })
      }
      xhr.onerror = () => reject(new Error('Network error during upload.'))
      const form = new FormData()
      form.append('file', file)
      xhr.send(form)
    })

  return attempt().then(async ({ status, body }) => {
    if (status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        const retry = await attempt()
        if (retry.status < 200 || retry.status >= 300) {
          throw new ApiError((retry.body.message as string) ?? 'Upload failed.', retry.status)
        }
        return retry.body as T
      }
    }
    if (status < 200 || status >= 300) {
      throw new ApiError((body.message as string) ?? 'Upload failed.', status)
    }
    return body as T
  })
}
