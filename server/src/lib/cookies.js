import { config } from '../config.js'

const COOKIE_NAME = 'refresh_token'

/**
 * `persistent` controls whether the *cookie itself* survives a browser
 * restart: with it, we set `expires` and the browser writes the cookie to
 * disk ("remember me"). Without it, no `expires` is sent at all, so the
 * browser treats it as a session cookie and drops it when the browser
 * closes — regardless, the token is still bounded server-side by
 * `expiresAt` (see lib/tokens.js#refreshExpiryDate).
 */
export function setRefreshCookie(res, token, expiresAt, persistent) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'lax',
    path: '/api/auth',
    ...(persistent ? { expires: expiresAt } : {}),
  })
}

export function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/api/auth' })
}

export function getRefreshCookie(req) {
  return req.cookies?.[COOKIE_NAME] ?? null
}
