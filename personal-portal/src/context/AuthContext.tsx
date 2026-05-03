import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ApiUser } from '../lib/api'
import { apiFetch, type MeResponse } from '../lib/api'

type AuthState = {
  user: ApiUser | null
  loading: boolean
  database: boolean | null
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [database, setDatabase] = useState<boolean | null>(null)

  const refresh = useCallback(async () => {
    const { ok, data } = await apiFetch<MeResponse>('/api/me')
    if (!ok) {
      setUser(null)
      setDatabase(null)
      return
    }
    setUser(data.user)
    setDatabase(data.database ?? null)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await refresh()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const { ok, data } = await apiFetch<{ user?: ApiUser; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (!ok) {
      const d = data as { error?: string; message?: string }
      return { ok: false as const, error: d.message ?? d.error ?? 'login_failed' }
    }
    if (data.user) setUser(data.user)
    setDatabase(true)
    return { ok: true as const }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { ok, data } = await apiFetch<{ user?: ApiUser; error?: string; message?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    if (!ok) {
      const d = data as { error?: string; message?: string }
      return { ok: false as const, error: d.message ?? d.error ?? 'register_failed' }
    }
    if (data.user) setUser(data.user)
    setDatabase(true)
    return { ok: true as const }
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      database,
      refresh,
      login,
      register,
      logout,
    }),
    [user, loading, database, refresh, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
