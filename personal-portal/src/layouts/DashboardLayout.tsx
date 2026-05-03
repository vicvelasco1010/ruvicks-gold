import { Menu, PanelLeftClose, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { QUICK_SERVICES } from '../config/services'
import { useAuth } from '../context/AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
      : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200',
  ].join(' ')

export function DashboardLayout() {
  const { user, loading: authLoading, logout } = useAuth()
  const [displayName, setDisplayName] = useLocalStorage('portal_display_name', '')
  const [draftName, setDraftName] = useState(displayName)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false))
  }, [location.pathname])

  useEffect(() => {
    queueMicrotask(() => setDraftName(displayName))
  }, [displayName])

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[oklch(0.12_0.04_270_/_0.5)] px-3 py-6 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
            <Sparkles className="size-4 text-white" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Portal</p>
            <p className="text-sm font-semibold text-white">Dashboard</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Main">
          <NavLink to="/" end className={navLinkClass}>
            <PanelLeftClose className="size-4 opacity-70" aria-hidden />
            Home
          </NavLink>
          {QUICK_SERVICES.map((s) => (
            <NavLink key={s.id} to={s.path} className={navLinkClass}>
              <span className="w-4 text-center text-xs" aria-hidden>
                {s.emoji}
              </span>
              {s.title}
            </NavLink>
          ))}
        </nav>
        <p className="mt-4 px-2 text-[11px] leading-relaxed text-zinc-600">
          Tip: set service URLs in <code className="text-zinc-500">.env</code>
        </p>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,280px)] flex-col border-r border-white/[0.08] bg-[oklch(0.11_0.045_270)] p-4 shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Mobile main">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          {QUICK_SERVICES.map((s) => (
            <NavLink key={s.id} to={s.path} className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <span className="w-4 text-center" aria-hidden>
                {s.emoji}
              </span>
              {s.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[oklch(0.14_0.04_270_/_0.72)] px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-zinc-300 hover:bg-white/10 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <Link to="/" className="text-sm font-semibold text-white md:hidden">
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!authLoading && (
              <>
                {user ? (
                  <>
                    <span className="hidden max-w-[160px] truncate text-xs text-zinc-500 sm:inline">
                      {user.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/25"
                  >
                    Sign in
                  </Link>
                )}
              </>
            )}
            <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-3 pr-2 text-sm text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/[0.09]"
            >
              <span className="max-w-[140px] truncate">
                {displayName.trim() || 'Set name'}
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-fuchsia-600/80 text-xs font-bold text-white">
                {(displayName.trim()[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
              </span>
            </button>
            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close profile"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[oklch(0.18_0.04_270)] p-4 shadow-2xl">
                  <label className="block text-xs font-medium text-zinc-500" htmlFor="dn">
                    Display name
                  </label>
                  <input
                    id="dn"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-violet-500/40 placeholder:text-zinc-600 focus:ring-2"
                  />
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
                    onClick={() => {
                      setDisplayName(draftName.trim())
                      setProfileOpen(false)
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-5xl">
            <Outlet context={{ displayName }} />
          </div>
        </main>
      </div>
    </div>
  )
}
