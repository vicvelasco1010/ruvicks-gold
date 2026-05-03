import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { portalGet, portalSend } from '../lib/portalApi'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type MatchEntry = {
  id: string
  won: boolean
  hero: string
  createdAt: number
}

export function MatchTrackerPage() {
  const { user } = useAuth()
  const [localMatches, setLocalMatches] = useLocalStorage<MatchEntry[]>('portal_dota_matches', [])
  const [remoteMatches, setRemoteMatches] = useState<MatchEntry[]>([])
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [hero, setHero] = useState('')
  const [won, setWon] = useState(true)

  const loadRemote = useCallback(async () => {
    setRemoteLoading(true)
    const { ok, data } = await portalGet<{ matches: MatchEntry[] }>('/api/matches')
    if (ok) setRemoteMatches(data.matches ?? [])
    setRemoteLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => void loadRemote())
  }, [user, loadRemote])

  const matches = user ? remoteMatches : localMatches

  const wins = matches.filter((m) => m.won).length
  const losses = matches.length - wins
  const rate = matches.length ? Math.round((wins / matches.length) * 100) : 0

  async function addMatch(e: React.FormEvent) {
    e.preventDefault()
    const h = hero.trim() || 'Unknown'
    if (user) {
      const { ok, data } = await portalSend<{ match: MatchEntry }>('/api/matches', {
        method: 'POST',
        body: JSON.stringify({ won, hero: h }),
      })
      if (ok && data.match) setRemoteMatches((prev) => [data.match, ...prev])
    } else {
      setLocalMatches((prev) => [
        { id: crypto.randomUUID(), won, hero: h, createdAt: Date.now() },
        ...prev,
      ])
    }
    setHero('')
    setWon(true)
  }

  async function remove(id: string) {
    if (user) {
      const { ok } = await portalSend(`/api/matches/${id}`, { method: 'DELETE' })
      if (ok) setRemoteMatches((prev) => prev.filter((m) => m.id !== id))
    } else {
      setLocalMatches((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-sm text-violet-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">Match tracker</h1>
        <p className="mt-2 text-zinc-400">
          {user
            ? 'Match history saved to your account.'
            : 'Log results in this browser, or sign in to save matches to the server.'}
        </p>
      </div>

      {user && remoteLoading && (
        <p className="text-sm text-zinc-500">Loading matches from server…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Wins', value: wins, tone: 'text-emerald-400' },
          { label: 'Losses', value: losses, tone: 'text-rose-400' },
          { label: 'Win rate', value: `${rate}%`, tone: 'text-violet-300' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={addMatch}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        <h2 className="text-sm font-semibold text-white">Log a match</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm">
            <span className="text-zinc-500">Hero / lineup</span>
            <input
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="e.g. Crystal Maiden"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-violet-500/30 placeholder:text-zinc-600 focus:ring-2"
            />
          </label>
          <fieldset className="flex gap-2 sm:pb-0.5">
            <legend className="sr-only">Result</legend>
            {[
              { v: true, label: 'Win' },
              { v: false, label: 'Loss' },
            ].map((o) => (
              <label
                key={o.label}
                className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  won === o.v
                    ? 'border-violet-400/50 bg-violet-500/20 text-white'
                    : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="won"
                  className="sr-only"
                  checked={won === o.v}
                  onChange={() => setWon(o.v)}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:brightness-110"
          >
            Add
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-sm font-semibold text-zinc-300">Recent matches</h2>
        {matches.length === 0 && !(user && remoteLoading) ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
            No matches logged yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div>
                  <p className="font-medium text-white">{m.hero}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(m.createdAt).toLocaleString()} ·{' '}
                    <span className={m.won ? 'text-emerald-400' : 'text-rose-400'}>
                      {m.won ? 'Victory' : 'Defeat'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(m.id)}
                  className="text-xs text-zinc-500 underline-offset-2 hover:text-rose-400 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
