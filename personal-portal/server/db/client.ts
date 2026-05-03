import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let sql: ReturnType<typeof postgres> | undefined
let db: ReturnType<typeof drizzle> | undefined

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!db) {
    sql = postgres(url, { max: 10 })
    db = drizzle(sql, { schema })
  }
  return db
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export async function closeDb() {
  if (sql) {
    await sql.end({ timeout: 5 })
    sql = undefined
    db = undefined
  }
}
