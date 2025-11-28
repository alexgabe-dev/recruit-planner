import { jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "session"

export async function getSession(req: Request) {
  // Try Next.js cookies() API first
  try {
    const c = cookies()
    const fromCookies = c.get(COOKIE_NAME)?.value
    if (fromCookies) {
      const session = await verifyToken(fromCookies)
      if (session) return session
    }
  } catch {
    // ignore, fallback to header parsing
  }

  // Fallback: parse Cookie header
  const cookie = req.headers.get("cookie") || ""
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  let token = match ? match[1] : undefined

  // Also allow Authorization: Bearer <token>
  if (!token) {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/)
    if (m) token = m[1]
  }
  if (!token) return null
  const secret = process.env.AUTH_SECRET || "dev-secret"
  const key = new TextEncoder().encode(secret)
  return verifyToken(token, key)
}

async function verifyToken(token: string, key?: Uint8Array) {
  try {
    if (!key) {
      const secret = process.env.AUTH_SECRET || "dev-secret"
      key = new TextEncoder().encode(secret)
    }
    const { payload } = await jwtVerify(token, key)
    const sub = payload.sub
    const userId = typeof sub === "string" ? Number(sub) : typeof sub === "number" ? sub : undefined
    const username = typeof payload.username === "string" ? payload.username : undefined
    if (!userId || !username) return null
    return { userId, username }
  } catch {
    return null
  }
}
