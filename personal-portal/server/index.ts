import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createSession, destroySession, getCurrentUser } from './auth/sessionService'
import { hashPassword, verifyPassword } from './auth/password'
import { ensureSchema } from './db/bootstrap'
import { closeDb, getDb, hasDatabaseUrl } from './db/client'
import { users } from './db/schema'
import { importLocalApp } from './routes/importLocal'
import { portalDataApp } from './routes/portalData'

function registrationAllowed() {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ALLOW_OPEN_REGISTRATION === 'true'
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sessionSecretReady() {
  const s = process.env.SESSION_SECRET
  return Boolean(s && s.length >= 16)
}

const api = new Hono()

api.get('/health', (c) => c.json({ ok: true }))

api.get('/db-health', async (c) => {
  if (!hasDatabaseUrl()) {
    return c.json({ ok: true, database: false, message: 'DATABASE_URL not set' })
  }
  try {
    const db = getDb()
    await db.execute(sql`select 1`)
    return c.json({ ok: true, database: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    return c.json({ ok: false, database: true, message }, 503)
  }
})

api.get('/me', async (c) => {
  if (!hasDatabaseUrl()) {
    return c.json({ user: null, database: false })
  }
  try {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ user: null, database: true })
    return c.json({
      user: { id: user.id, email: user.email },
      database: true,
    })
  } catch {
    return c.json({ user: null, database: true, error: 'session_lookup_failed' }, 500)
  }
})

api.post('/auth/register', async (c) => {
  if (!hasDatabaseUrl()) {
    return c.json({ error: 'database_not_configured' }, 503)
  }
  if (!sessionSecretReady()) {
    return c.json(
      {
        error: 'server_misconfigured',
        message: 'Set SESSION_SECRET to at least 16 characters in your environment.',
      },
      503,
    )
  }
  if (!registrationAllowed()) {
    return c.json(
      {
        error: 'registration_closed',
        message:
          'Open registration is disabled in production. Set ALLOW_OPEN_REGISTRATION=true on Railway to create the first account, then turn it off.',
      },
      403,
    )
  }
  let body: { email?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!isValidEmail(email)) {
    return c.json({ error: 'invalid_email' }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: 'password_too_short', message: 'Use at least 8 characters.' }, 400)
  }
  const passwordHash = await hashPassword(password)
  const db = getDb()
  try {
    const inserted = await db.insert(users).values({ email, passwordHash }).returning({
      id: users.id,
      email: users.email,
    })
    const user = inserted[0]
    if (!user) return c.json({ error: 'create_failed' }, 500)
    await createSession(c, user.id)
    return c.json({ user: { id: user.id, email: user.email } })
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : ''
    if (code === '23505') {
      return c.json({ error: 'email_in_use' }, 409)
    }
    console.error(e)
    return c.json({ error: 'server_error' }, 500)
  }
})

api.post('/auth/login', async (c) => {
  if (!hasDatabaseUrl()) {
    return c.json({ error: 'database_not_configured' }, 503)
  }
  if (!sessionSecretReady()) {
    return c.json(
      {
        error: 'server_misconfigured',
        message: 'Set SESSION_SECRET to at least 16 characters in your environment.',
      },
      503,
    )
  }
  let body: { email?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return c.json({ error: 'missing_credentials' }, 400)
  }
  const db = getDb()
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = found[0]
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'invalid_credentials' }, 401)
  }
  await destroySession(c)
  await createSession(c, user.id)
  return c.json({ user: { id: user.id, email: user.email } })
})

api.post('/auth/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

api.route('/import', importLocalApp())
api.route('/', portalDataApp())

const app = new Hono()
app.route('/api', api)

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  const distRoot = join(process.cwd(), 'dist')
  app.use('*', serveStatic({ root: distRoot }))
  app.notFound(async (c) => {
    if (c.req.path.startsWith('/api')) {
      return c.json({ error: 'Not Found' }, 404)
    }
    try {
      const html = await readFile(join(distRoot, 'index.html'), 'utf-8')
      return c.html(html, 200)
    } catch {
      return c.text('UI not built. Run npm run build.', 500)
    }
  })
} else {
  app.notFound((c) => c.json({ error: 'not_found', hint: 'Dev UI is on the Vite port; API lives here.' }, 404))
}

const port = Number(process.env.PORT) || 8787

async function main() {
  if (hasDatabaseUrl()) {
    await ensureSchema(process.env.DATABASE_URL!)
    console.info('[db] schema ready')
  } else {
    console.warn('[db] DATABASE_URL missing — auth and /api/db-health DB checks disabled')
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.warn('[auth] SESSION_SECRET missing or short — set a 32+ char secret before using login in production')
  }
  serve({ fetch: app.fetch, port }, (info) => {
    console.info(`[server] listening on http://127.0.0.1:${info.port}`)
  })
}

main().catch(async (err) => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
