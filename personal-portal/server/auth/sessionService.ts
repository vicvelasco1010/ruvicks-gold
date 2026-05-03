import { and, eq, gt } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { getDb } from '../db/client'
import { sessions, users } from '../db/schema'
import { hashSessionToken, newSessionToken } from './token'
import { SESSION_COOKIE, sessionCookieOptions } from './sessionCookie'

function requireSessionSecret() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET must be set to at least 16 characters')
  }
  return s
}

export async function createSession(c: Context, userId: string) {
  const secret = requireSessionSecret()
  const token = newSessionToken()
  const tokenHash = hashSessionToken(token, secret)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const db = getDb()
  await db.insert(sessions).values({ userId, tokenHash, expiresAt })
  setCookie(c, SESSION_COOKIE, token, sessionCookieOptions())
}

export async function destroySession(c: Context) {
  const token = getCookie(c, SESSION_COOKIE)
  const secret = process.env.SESSION_SECRET
  if (token && secret && secret.length >= 16) {
    const tokenHash = hashSessionToken(token, secret)
    const db = getDb()
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
  }
  deleteCookie(c, SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: 0 })
}

export async function getCurrentUser(c: Context) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) return null
  const tokenHash = hashSessionToken(token, secret)
  const db = getDb()
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1)
  return rows[0]?.user ?? null
}
