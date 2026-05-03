import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { portalGet, portalSend } from '../lib/portalApi'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type NewsItem = {
  id: string
  title: string
  body: string
  date: string
}

type NewsRow = NewsItem & { read: boolean }

const seed: NewsItem[] = [
  {
    id: 'n1',
    title: 'Portal upgraded',
    body: 'New UI, working notes, match log, and configurable service links.',
    date: new Date().toISOString(),
  },
  {
    id: 'n2',
    title: 'Configure your apps',
    body: 'Copy .env.example to .env and set VITE_PLEX_URL and friends for one-click open.',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
]

export function NewsPage() {
  const { user } = useAuth()
  const [localItems, setLocalItems] = useLocalStorage<NewsItem[]>('portal_news_items', seed)
  const [readIds, setReadIds] = useLocalStorage<string[]>('portal_news_read', [])
  const [remoteRows, setRemoteRows] = useState<NewsRow[]>([])
  const [remoteLoading, setRemoteLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const loadRemote = useCallback(async () => {
    setRemoteLoading(true)
    const { ok, data } = await portalGet<{ items: NewsRow[] }>('/api/news')
    if (ok) setRemoteRows(data.items ?? [])
    setRemoteLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => void loadRemote())
  }, [user, loadRemote])

  const sortedLocal = [...localItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const sortedRemote = [...remoteRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  async function addArticle(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const b = body.trim()
    if (!t || !b) return
    if (user) {
      const { ok, data } = await portalSend<{ item: NewsRow }>('/api/news', {
        method: 'POST',
        body: JSON.stringify({ title: t, body: b }),
      })
      if (ok && data.item) setRemoteRows((prev) => [data.item, ...prev])
    } else {
      setLocalItems((prev) => [
        { id: crypto.randomUUID(), title: t, body: b, date: new Date().toISOString() },
        ...prev,
      ])
    }
    setTitle('')
    setBody('')
  }

  async function remove(id: string) {
    if (user) {
      const { ok } = await portalSend(`/api/news/${id}`, { method: 'DELETE' })
      if (ok) setRemoteRows((prev) => prev.filter((x) => x.id !== id))
    } else {
      setLocalItems((prev) => prev.filter((x) => x.id !== id))
      setReadIds((prev) => prev.filter((x) => x !== id))
    }
  }

  async function toggleRead(id: string, currentRead: boolean) {
    if (user) {
      const { ok, data } = await portalSend<{ item: NewsRow }>(`/api/news/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ read: !currentRead }),
      })
      if (ok && data.item) {
        setRemoteRows((prev) => prev.map((x) => (x.id === id ? data.item : x)))
      }
    } else {
      setReadIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-sm text-violet-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">Server news</h1>
        <p className="mt-2 text-zinc-400">
          {user
            ? 'Announcements stored in your account database.'
            : 'Post updates for yourself — stored in this browser until you sign in.'}
        </p>
      </div>

      {user && remoteLoading && (
        <p className="text-sm text-zinc-500">Loading news from server…</p>
      )}

      <form
        onSubmit={addArticle}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        <h2 className="text-sm font-semibold text-white">New announcement</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 placeholder:text-zinc-600 focus:ring-2"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body"
          rows={4}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 placeholder:text-zinc-600 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:brightness-110"
        >
          Publish
        </button>
      </form>

      {user && !remoteLoading && sortedRemote.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-zinc-500">
          No announcements yet. Publish one above — it will be stored in your database.
        </p>
      ) : null}
      {!user && sortedLocal.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-zinc-500">
          No announcements yet.
        </p>
      ) : null}

      <ul className="space-y-3">
        {user && remoteLoading
          ? null
          : user
          ? sortedRemote.map((item) => {
              const read = item.read
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border px-5 py-4 ${
                    read ? 'border-white/[0.06] bg-white/[0.02]' : 'border-violet-400/20 bg-violet-500/[0.06]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <time className="mt-1 block text-xs text-zinc-500" dateTime={item.date}>
                        {new Date(item.date).toLocaleString()}
                      </time>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {item.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleRead(item.id, read)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                      >
                        {read ? 'Mark unread' : 'Mark read'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            })
          : sortedLocal.map((item) => {
              const read = readIds.includes(item.id)
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border px-5 py-4 ${
                    read ? 'border-white/[0.06] bg-white/[0.02]' : 'border-violet-400/20 bg-violet-500/[0.06]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <time className="mt-1 block text-xs text-zinc-500" dateTime={item.date}>
                        {new Date(item.date).toLocaleString()}
                      </time>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {item.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleRead(item.id, read)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                      >
                        {read ? 'Mark unread' : 'Mark read'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
      </ul>
    </div>
  )
}
