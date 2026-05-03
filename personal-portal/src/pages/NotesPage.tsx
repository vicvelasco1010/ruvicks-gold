import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { portalGet, portalSend } from '../lib/portalApi'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type Note = {
  id: string
  title: string
  body: string
  accent: string
  createdAt: number
}

const ACCENTS = [
  'from-amber-500/30 to-orange-600/10 border-amber-400/20',
  'from-sky-500/30 to-blue-600/10 border-sky-400/20',
  'from-emerald-500/30 to-teal-600/10 border-emerald-400/20',
  'from-fuchsia-500/30 to-violet-600/10 border-fuchsia-400/20',
  'from-rose-500/30 to-pink-600/10 border-rose-400/20',
]

function pickAccent() {
  return ACCENTS[Math.floor(Math.random() * ACCENTS.length)]!
}

export function NotesPage() {
  const { user } = useAuth()
  const [localNotes, setLocalNotes] = useLocalStorage<Note[]>('portal_sticky_notes', [])
  const [remoteNotes, setRemoteNotes] = useState<Note[]>([])
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const loadRemote = useCallback(async () => {
    setRemoteLoading(true)
    const { ok, data } = await portalGet<{ notes: Note[] }>('/api/notes')
    if (ok) setRemoteNotes(data.notes ?? [])
    setRemoteLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => void loadRemote())
  }, [user, loadRemote])

  const notes = user ? remoteNotes : localNotes

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim() || 'Untitled'
    const b = body.trim()
    if (!b) return
    const accent = pickAccent()
    if (user) {
      const { ok, data } = await portalSend<{ note: Note }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: t, body: b, accent }),
      })
      if (ok && data.note) setRemoteNotes((prev) => [data.note, ...prev])
    } else {
      setLocalNotes((prev) => [
        { id: crypto.randomUUID(), title: t, body: b, accent, createdAt: Date.now() },
        ...prev,
      ])
    }
    setTitle('')
    setBody('')
  }

  async function remove(id: string) {
    if (user) {
      const { ok } = await portalSend(`/api/notes/${id}`, { method: 'DELETE' })
      if (ok) setRemoteNotes((prev) => prev.filter((n) => n.id !== id))
    } else {
      setLocalNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-sm text-violet-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">Notes</h1>
        <p className="mt-2 text-zinc-400">
          {user
            ? 'Sticky notes saved to your account (Postgres).'
            : 'Sticky notes saved in this browser only. Sign in to sync to your account.'}
        </p>
      </div>

      {user && remoteLoading && (
        <p className="text-sm text-zinc-500">Loading notes from server…</p>
      )}

      <form
        onSubmit={addNote}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="size-4 text-violet-400" aria-hidden />
          New note
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 placeholder:text-zinc-600 focus:ring-2"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something…"
          rows={4}
          required
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 placeholder:text-zinc-600 focus:ring-2"
        />
        <button
          type="submit"
          className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:brightness-110"
        >
          Pin to board
        </button>
      </form>

      {notes.length === 0 && !(user && remoteLoading) ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center text-sm text-zinc-500">
          No notes yet. Add your first one above.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-lg ${n.accent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{n.title}</h3>
                <button
                  type="button"
                  onClick={() => void remove(n.id)}
                  className="rounded-lg p-1.5 text-zinc-300 hover:bg-black/20 hover:text-rose-300"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-100/90">
                {n.body}
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-wider text-white/40">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
