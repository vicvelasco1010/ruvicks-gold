import { createHash, randomBytes } from 'node:crypto'

export function newSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string, secret: string) {
  return createHash('sha256').update(token).update(secret).digest('hex')
}
