import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/client'
import { portalDotaMatches, portalNews, portalNotes } from '../db/schema'
import { requireAuth } from '../middleware/requireAuth'

const MAX_NOTES = 400
const MAX_NEWS = 400
const MAX_MATCHES = 2000
const MAX_TITLE = 400
const MAX_BODY = 80_000
const MAX_HERO = 200
const MAX_ACCENT = 300

function clampStr(s: string, max: number) {
  if (s.length <= max) return s
  return s.slice(0, max)
}

function safeTimeMs(v: unknown, fallback: number) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  if (v < 0 || v > Date.now() + 86400000 * 365 * 50) return fallback
  return v
}

function safeIsoDate(v: unknown, fallback: Date) {
  if (typeof v !== 'string') return fallback
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return fallback
  return d
}

function isStringArray(x: unknown, maxLen: number): x is string[] {
  if (!Array.isArray(x) || x.length > maxLen) return false
  return x.every((i) => typeof i === 'string' && i.length < 2000)
}

type CleanNote = { title: string; body: string; accent: string; createdAt: Date }
type CleanNews = { title: string; body: string; publishedAt: Date; readAt: Date | null }
type CleanMatch = { won: boolean; hero: string; createdAt: Date }

function parsePayload(body: {
  replace?: unknown
  notes?: unknown
  newsItems?: unknown
  readIds?: unknown
  matches?: unknown
}): { replace: boolean; notes: CleanNote[]; news: CleanNews[]; matches: CleanMatch[] } | { error: string } {
  const replace = body.replace === true
  const notesIn = Array.isArray(body.notes) ? body.notes : []
  const newsIn = Array.isArray(body.newsItems) ? body.newsItems : []
  const matchesIn = Array.isArray(body.matches) ? body.matches : []
  const readIds = isStringArray(body.readIds, 5000) ? new Set(body.readIds) : new Set<string>()

  if (notesIn.length > MAX_NOTES || newsIn.length > MAX_NEWS || matchesIn.length > MAX_MATCHES) {
    return { error: 'payload_too_large' }
  }

  const notes: CleanNote[] = []
  for (const raw of notesIn) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const title = typeof o.title === 'string' ? clampStr(o.title.trim() || 'Untitled', MAX_TITLE) : 'Untitled'
    const text = typeof o.body === 'string' ? clampStr(o.body, MAX_BODY) : ''
    const accent = typeof o.accent === 'string' ? clampStr(o.accent, MAX_ACCENT) : ''
    if (!text || !accent) continue
    notes.push({ title, body: text, accent, createdAt: new Date(safeTimeMs(o.createdAt, Date.now())) })
  }

  const news: CleanNews[] = []
  for (const raw of newsIn) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const title = typeof o.title === 'string' ? clampStr(o.title.trim(), MAX_TITLE) : ''
    const text = typeof o.body === 'string' ? clampStr(o.body, MAX_BODY) : ''
    if (!title || !text) continue
    const id = typeof o.id === 'string' ? o.id : ''
    const publishedAt = safeIsoDate(o.date, new Date())
    const readAt = id && readIds.has(id) ? new Date() : null
    news.push({ title, body: text, publishedAt, readAt })
  }

  const matches: CleanMatch[] = []
  for (const raw of matchesIn) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    if (typeof o.won !== 'boolean') continue
    const hero =
      typeof o.hero === 'string' ? clampStr(o.hero.trim() || 'Unknown', MAX_HERO) : 'Unknown'
    matches.push({ won: o.won, hero, createdAt: new Date(safeTimeMs(o.createdAt, Date.now())) })
  }

  return { replace, notes, news, matches }
}

export function importLocalApp() {
  const app = new Hono()
  app.use('*', requireAuth)

  app.post('/local', async (c) => {
    const user = c.get('user')
    let raw: unknown
    try {
      raw = await c.req.json()
    } catch {
      return c.json({ error: 'invalid_json' }, 400)
    }
    if (!raw || typeof raw !== 'object') {
      return c.json({ error: 'invalid_body' }, 400)
    }

    const parsed = parsePayload(raw as Record<string, unknown>)
    if ('error' in parsed) {
      return c.json({ error: parsed.error }, 413)
    }

    const { replace, notes, news, matches } = parsed
    const total = notes.length + news.length + matches.length
    if (total === 0) {
      return c.json({ error: 'nothing_to_import', message: 'No valid notes, news, or matches in the payload.' }, 400)
    }

    const db = getDb()
    await db.transaction(async (tx) => {
      if (replace) {
        await tx.delete(portalNotes).where(eq(portalNotes.userId, user.id))
        await tx.delete(portalNews).where(eq(portalNews.userId, user.id))
        await tx.delete(portalDotaMatches).where(eq(portalDotaMatches.userId, user.id))
      }
      for (const n of notes) {
        await tx.insert(portalNotes).values({
          userId: user.id,
          title: n.title,
          body: n.body,
          accent: n.accent,
          createdAt: n.createdAt,
        })
      }
      for (const item of news) {
        await tx.insert(portalNews).values({
          userId: user.id,
          title: item.title,
          body: item.body,
          publishedAt: item.publishedAt,
          readAt: item.readAt,
        })
      }
      for (const m of matches) {
        await tx.insert(portalDotaMatches).values({
          userId: user.id,
          won: m.won,
          hero: m.hero,
          createdAt: m.createdAt,
        })
      }
    })

    return c.json({
      ok: true,
      imported: { notes: notes.length, news: news.length, matches: matches.length },
      replace,
    })
  })

  return app
}
