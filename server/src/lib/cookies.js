import { config } from '../config.js'

const COOKIE_NAME = 'refresh_token'

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'lax',
    path: '/api/auth',
    expires: expiresAt,
  })
}

export function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/api/auth' })
}

export function getRefreshCookie(req) {
  return req.cookies?.[COOKIE_NAME] ?? null
}
