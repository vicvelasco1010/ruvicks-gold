import type { MiddlewareHandler } from 'hono'
import { getCurrentUser } from '../auth/sessionService'
import { hasDatabaseUrl } from '../db/client'

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!hasDatabaseUrl()) {
    return c.json({ error: 'database_not_configured' }, 503)
  }
  const user = await getCurrentUser(c)
  if (!user) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  c.set('user', user)
  await next()
}
