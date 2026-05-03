import { apiFetch } from './api'

export async function portalGet<T>(path: string) {
  return apiFetch<T>(path, { method: 'GET' })
}

export async function portalSend<T>(path: string, init: RequestInit) {
  return apiFetch<T>(path, init)
}
