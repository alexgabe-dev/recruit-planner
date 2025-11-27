import { jwtVerify } from "jose"

const COOKIE_NAME = "session"

export async function getSession(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  const token = match[1]
  const secret = process.env.AUTH_SECRET || "dev-secret"
  const key = new TextEncoder().encode(secret)
  try {
    const { payload } = await jwtVerify(token, key)
    const userId = typeof payload.sub === "string" ? Number(payload.sub) : undefined
    const username = typeof payload.username === "string" ? payload.username : undefined
    if (!userId || !username) return null
    return { userId, username }
  } catch {
    return null
  }
}
