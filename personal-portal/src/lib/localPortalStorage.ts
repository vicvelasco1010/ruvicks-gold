import type { MatchEntry } from '../pages/MatchTrackerPage'
import type { NewsItem } from '../pages/NewsPage'
import type { Note } from '../pages/NotesPage'

export const LOCAL_KEYS = {
  notes: 'portal_sticky_notes',
  news: 'portal_news_items',
  readIds: 'portal_news_read',
  matches: 'portal_dota_matches',
} as const

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readLocalPortalPayload(): {
  notes: Note[]
  newsItems: NewsItem[]
  readIds: string[]
  matches: MatchEntry[]
} {
  return {
    notes: parseJson<Note[]>(localStorage.getItem(LOCAL_KEYS.notes), []),
    newsItems: parseJson<NewsItem[]>(localStorage.getItem(LOCAL_KEYS.news), []),
    readIds: parseJson<string[]>(localStorage.getItem(LOCAL_KEYS.readIds), []),
    matches: parseJson<MatchEntry[]>(localStorage.getItem(LOCAL_KEYS.matches), []),
  }
}

export function countLocalPortalItems(): { notes: number; news: number; matches: number; total: number } {
  const { notes, newsItems, matches } = readLocalPortalPayload()
  const n = notes.length
  const ne = newsItems.length
  const m = matches.length
  return { notes: n, news: ne, matches: m, total: n + ne + m }
}

export function hasLocalPortalData() {
  return countLocalPortalItems().total > 0
}

export function clearLocalPortalData() {
  localStorage.removeItem(LOCAL_KEYS.notes)
  localStorage.removeItem(LOCAL_KEYS.news)
  localStorage.removeItem(LOCAL_KEYS.readIds)
  localStorage.removeItem(LOCAL_KEYS.matches)
}
