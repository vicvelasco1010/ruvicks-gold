import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/client'
import { portalDotaMatches, portalNews, portalNotes } from '../db/schema'
import { requireAuth } from '../middleware/requireAuth'

function rowNote(n: typeof portalNotes.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    accent: n.accent,
    createdAt: n.createdAt.getTime(),
  }
}

function rowNews(n: typeof portalNews.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    date: n.publishedAt.toISOString(),
    read: n.readAt != null,
  }
}

function rowMatch(m: typeof portalDotaMatches.$inferSelect) {
  return {
    id: m.id,
    won: m.won,
    hero: m.hero,
    createdAt: m.createdAt.getTime(),
  }
}

export function portalDataApp() {
  const app = new Hono()
  app.use('*', requireAuth)

  app.get('/notes', async (c) => {
    const user = c.get('user')
    const db = getDb()
    const rows = await db
      .select()
      .from(portalNotes)
      .where(eq(portalNotes.userId, user.id))
      .orderBy(desc(portalNotes.createdAt))
    return c.json({ notes: rows.map(rowNote) })
  })

  app.post('/notes', async (c) => {
    const user = c.get('user')
    let body: { title?: string; body?: string; accent?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid_json' }, 400)
    }
    const title = typeof body.title === 'string' ? body.title.trim() || 'Untitled' : 'Untitled'
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    const accent = typeof body.accent === 'string' ? body.accent : ''
    if (!text) return c.json({ error: 'body_required' }, 400)
    if (!accent) return c.json({ error: 'accent_required' }, 400)
    const db = getDb()
    const [inserted] = await db
      .insert(portalNotes)
      .values({ userId: user.id, title, body: text, accent })
      .returning()
    if (!inserted) return c.json({ error: 'insert_failed' }, 500)
    return c.json({ note: rowNote(inserted) })
  })

  app.delete('/notes/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const db = getDb()
    const deleted = await db
      .delete(portalNotes)
      .where(and(eq(portalNotes.id, id), eq(portalNotes.userId, user.id)))
      .returning({ id: portalNotes.id })
    if (!deleted.length) return c.json({ error: 'not_found' }, 404)
    return c.json({ ok: true })
  })

  app.get('/news', async (c) => {
    const user = c.get('user')
    const db = getDb()
    const rows = await db
      .select()
      .from(portalNews)
      .where(eq(portalNews.userId, user.id))
      .orderBy(desc(portalNews.publishedAt))
    return c.json({ items: rows.map(rowNews) })
  })

  app.post('/news', async (c) => {
    const user = c.get('user')
    let body: { title?: string; body?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid_json' }, 400)
    }
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!title || !text) return c.json({ error: 'title_and_body_required' }, 400)
    const db = getDb()
    const [inserted] = await db
      .insert(portalNews)
      .values({ userId: user.id, title, body: text })
      .returning()
    if (!inserted) return c.json({ error: 'insert_failed' }, 500)
    return c.json({ item: rowNews(inserted) })
  })

  app.delete('/news/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const db = getDb()
    const deleted = await db
      .delete(portalNews)
      .where(and(eq(portalNews.id, id), eq(portalNews.userId, user.id)))
      .returning({ id: portalNews.id })
    if (!deleted.length) return c.json({ error: 'not_found' }, 404)
    return c.json({ ok: true })
  })

  app.patch('/news/:id/read', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    let body: { read?: boolean }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid_json' }, 400)
    }
    const read = body.read === true
    const db = getDb()
    const [updated] = await db
      .update(portalNews)
      .set({ readAt: read ? new Date() : null })
      .where(and(eq(portalNews.id, id), eq(portalNews.userId, user.id)))
      .returning()
    if (!updated) return c.json({ error: 'not_found' }, 404)
    return c.json({ item: rowNews(updated) })
  })

  app.get('/matches', async (c) => {
    const user = c.get('user')
    const db = getDb()
    const rows = await db
      .select()
      .from(portalDotaMatches)
      .where(eq(portalDotaMatches.userId, user.id))
      .orderBy(desc(portalDotaMatches.createdAt))
    return c.json({ matches: rows.map(rowMatch) })
  })

  app.post('/matches', async (c) => {
    const user = c.get('user')
    let body: { won?: boolean; hero?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid_json' }, 400)
    }
    const won = body.won === true
    const hero = typeof body.hero === 'string' ? body.hero.trim() || 'Unknown' : 'Unknown'
    const db = getDb()
    const [inserted] = await db
      .insert(portalDotaMatches)
      .values({ userId: user.id, won, hero })
      .returning()
    if (!inserted) return c.json({ error: 'insert_failed' }, 500)
    return c.json({ match: rowMatch(inserted) })
  })

  app.delete('/matches/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const db = getDb()
    const deleted = await db
      .delete(portalDotaMatches)
      .where(and(eq(portalDotaMatches.id, id), eq(portalDotaMatches.userId, user.id)))
      .returning({ id: portalDotaMatches.id })
    if (!deleted.length) return c.json({ error: 'not_found' }, 404)
    return c.json({ ok: true })
  })

  return app
}
