import { randomUUID, randomBytes, createHash } from 'node:crypto'

export function uid(prefix = 'id') {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex')
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}
