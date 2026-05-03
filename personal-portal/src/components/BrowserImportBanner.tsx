import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  clearLocalPortalData,
  countLocalPortalItems,
  hasLocalPortalData,
  readLocalPortalPayload,
} from '../lib/localPortalStorage'
import { portalSend } from '../lib/portalApi'

export function BrowserImportBanner() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [replace, setReplace] = useState(false)
  const [clearAfter, setClearAfter] = useState(true)

  const counts = countLocalPortalItems()

  if (!user || !hasLocalPortalData()) return null

  async function runImport() {
    setBusy(true)
    setMessage(null)
    const payload = readLocalPortalPayload()
    const { ok, data } = await portalSend<{
      ok?: boolean
      imported?: { notes: number; news: number; matches: number }
      error?: string
      message?: string
    }>('/api/import/local', {
      method: 'POST',
      body: JSON.stringify({
        replace,
        notes: payload.notes,
        newsItems: payload.newsItems,
        readIds: payload.readIds,
        matches: payload.matches,
      }),
    })

    if (!ok) {
      setMessage(data.message ?? data.error ?? 'Import failed.')
      setBusy(false)
      return
    }

    const imp = data.imported
    const summary = imp
      ? `Imported ${imp.notes} notes, ${imp.news} news, ${imp.matches} matches.`
      : 'Import finished.'
    if (clearAfter) {
      clearLocalPortalData()
    }
    setMessage(`${summary}${clearAfter ? ' Browser copy cleared.' : ''}`)
    setBusy(false)
    window.setTimeout(() => {
      window.location.reload()
    }, 900)
  }

  return (
    <section className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] p-5">
      <h2 className="text-sm font-semibold text-amber-100">Import from this browser</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        This device has{' '}
        <strong className="text-white">
          {counts.notes} notes, {counts.news} news, {counts.matches} matches
        </strong>{' '}
        saved locally. While signed in, you can copy them into your account on the server (Postgres).
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
          className="mt-1 rounded border-white/20"
        />
        <span>
          <span className="font-medium text-white">Replace server data first</span> — deletes all notes,
          news, and matches already stored for your account, then imports from this browser. Leave
          unchecked to <strong className="text-white">add</strong> browser items on top of what is already
          in the database (duplicates possible if you run import again).
        </span>
      </label>
      <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={clearAfter}
          onChange={(e) => setClearAfter(e.target.checked)}
          className="mt-1 rounded border-white/20"
        />
        <span>
          <span className="font-medium text-white">Remove local copy after import</span> — clears this
          browser&apos;s portal_* keys so you don&apos;t mix old local data with synced server data.
        </span>
      </label>
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void runImport()}
        className="mt-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 transition hover:brightness-110 disabled:opacity-50"
      >
        {busy ? 'Importing…' : 'Import to my account'}
      </button>
    </section>
  )
}
