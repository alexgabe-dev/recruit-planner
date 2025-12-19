import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { updateLastSeen } from "./db"

const COOKIE_NAME = "session"

export async function getSession(req?: Request) {
  let session = null
  // Try Next.js cookies() API first
  try {
    const c = await cookies()
    const fromCookies = c.get(COOKIE_NAME)?.value
    if (fromCookies) {
      session = await verifyToken(fromCookies)
    }
  } catch {
    // ignore, fallback to header parsing
  }

  if (!session && req) {
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
    if (token) {
      const secret = process.env.AUTH_SECRET || "dev-secret"
      const key = new TextEncoder().encode(secret)
      session = await verifyToken(token, key)
    }
  }

  if (session) {
    try {
      updateLastSeen(session.userId)
    } catch (e) {
      // Ignore DB errors during session check to prevent blocking
      console.error("Failed to update last seen:", e)
    }
    return session
  }
  return null
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
    const role = typeof (payload as any).role === "string" ? (payload as any).role : undefined
    if (!userId || !username) return null
    return { userId, username, role: role || "user" }
  } catch {
    return null
  }
}
