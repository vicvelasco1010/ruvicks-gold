export type ApiUser = { id: string; email: string }

export type MeResponse = {
  user: ApiUser | null
  database?: boolean
  error?: string
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const baseHeaders = { ...(init?.headers as Record<string, string> | undefined) }
  if (init?.body != null) {
    baseHeaders['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: baseHeaders,
  })
  const text = await res.text()
  let data: T
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T)
  } catch {
    data = {} as T
  }
  return { ok: res.ok, status: res.status, data }
}
