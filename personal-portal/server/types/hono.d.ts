import type { User } from '../db/schema'

declare module 'hono' {
  interface ContextVariableMap {
    user: User
  }
}
