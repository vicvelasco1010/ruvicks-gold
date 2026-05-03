export const SESSION_COOKIE = 'portal_session'

export function sessionCookieOptions() {
  const prod = process.env.NODE_ENV === 'production'
  return {
    path: '/',
    httpOnly: true,
    secure: prod,
    sameSite: 'Lax' as const,
    maxAge: 60 * 60 * 24 * 30,
  }
}
