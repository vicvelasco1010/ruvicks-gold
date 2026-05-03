import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const errLabel: Record<string, string> = {
  invalid_credentials: 'Email or password is wrong.',
  email_in_use: 'That email is already registered.',
  invalid_email: 'Enter a valid email.',
  password_too_short: 'Password must be at least 8 characters.',
  registration_closed: 'Registration is closed on the server. Ask the admin to enable it temporarily.',
  server_misconfigured: 'Server is missing SESSION_SECRET or database config.',
  database_not_configured: 'Database is not connected yet.',
}

export function LoginPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <p className="text-zinc-400">You are signed in as</p>
        <p className="text-lg font-semibold text-white">{user.email}</p>
        <Link
          to="/"
          className="inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const res =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password)
      if (!res.ok) {
        setMessage(errLabel[res.error] ?? res.error)
        return
      }
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight text-white">Account</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign in to link this browser to your portal user.</p>

        <div className="mt-6 flex rounded-xl bg-black/30 p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setMessage(null)
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === m ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-zinc-500">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none ring-violet-500/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500">Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none ring-violet-500/30 focus:ring-2"
            />
          </label>
          {message && <p className="text-sm text-rose-300">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link to="/" className="text-violet-400 hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
