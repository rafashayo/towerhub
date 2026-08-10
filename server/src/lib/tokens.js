import jwt from 'jsonwebtoken'
import { createHmac } from 'node:crypto'
import { config } from '../config.js'
import { randomToken } from './ids.js'

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, status: user.status },
    config.jwtAccessSecret,
    { expiresIn: config.accessTokenTtl }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret)
}

/** Raw refresh tokens are never stored — only an HMAC digest, so a DB leak alone can't be replayed. */
export function hashRefreshToken(rawToken) {
  return createHmac('sha256', config.jwtRefreshPepper).update(rawToken).digest('hex')
}

export function generateRefreshToken() {
  return randomToken(48)
}

export function refreshExpiryDate() {
  return new Date(Date.now() + config.refreshTokenTtlDays * 86400000)
}
