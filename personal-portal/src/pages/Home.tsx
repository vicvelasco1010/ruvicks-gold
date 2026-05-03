import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { BrowserImportBanner } from '../components/BrowserImportBanner'
import { QuickLinkCard } from '../components/QuickLinkCard'
import { QUICK_SERVICES } from '../config/services'
import { useAuth } from '../context/AuthContext'
import { portalGet } from '../lib/portalApi'
import { useLocalStorage } from '../hooks/useLocalStorage'

type OutletCtx = { displayName: string }

type HomeNewsItem = { id: string; title: string; body: string; date: string; read: boolean }

const initialNews = [
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

export function Home() {
  const { displayName } = useOutletContext<OutletCtx>()
  const { user } = useAuth()
  const [localNews] = useLocalStorage('portal_news_items', initialNews)
  const [readIds] = useLocalStorage<string[]>('portal_news_read', [])
  const [remoteLatest, setRemoteLatest] = useState<HomeNewsItem[]>([])
  const [remoteLoading, setRemoteLoading] = useState(false)

  const loadRemoteNews = useCallback(async () => {
    setRemoteLoading(true)
    const { ok, data } = await portalGet<{ items: Array<{ id: string; title: string; body: string; date: string; read: boolean }> }>(
      '/api/news',
    )
    if (ok) {
      const items = (data.items ?? []).map((i) => ({
        id: i.id,
        title: i.title,
        body: i.body,
        date: i.date,
        read: i.read,
      }))
      const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRemoteLatest(sorted.slice(0, 4))
    }
    setRemoteLoading(false)
  }, [])

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setRemoteLatest([]))
      return
    }
    queueMicrotask(() => void loadRemoteNews())
  }, [user, loadRemoteNews])

  const latest: HomeNewsItem[] = user
    ? remoteLatest
    : [...localNews]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          date: item.date,
          read: readIds.includes(item.id),
        }))

  const name = displayName.trim()

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-violet-600/20 via-transparent to-fuchsia-600/15 p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <p className="text-sm font-medium text-violet-200/90">Welcome back{name ? `, ${name}` : ''}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Your personal portal
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-300">
          Everything in one place — quick access to your stack, notes and match history that sync when
          you sign in, and news you control.
        </p>
      </section>

      {user ? <BrowserImportBanner /> : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Quick access</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_SERVICES.map((service) => (
            <li key={service.id}>
              <QuickLinkCard service={service} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Latest news</h2>
        {user && remoteLoading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : latest.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-zinc-500">
            No news yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {latest.map((item) => {
              const unread = !item.read
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border px-5 py-4 transition ${
                    unread
                      ? 'border-violet-400/25 bg-violet-500/[0.07]'
                      : 'border-white/[0.06] bg-white/[0.03]'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <time className="text-xs text-zinc-500" dateTime={item.date}>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-600">
          Manage articles on the{' '}
          <Link to="/news" className="text-violet-400 hover:underline">
            News
          </Link>{' '}
          page.
        </p>
      </section>
    </div>
  )
}
