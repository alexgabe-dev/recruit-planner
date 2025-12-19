import { NextResponse } from "next/server"
import { getUserByUsername, updateLastSeen, logActivity } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const COOKIE_NAME = "session"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body as { username?: string; password?: string }

    if (!username || !password) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 })
    }

    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "Hibás felhasználónév vagy jelszó" }, { status: 401 })
    }

    if (user.status && user.status !== 'active') {
      return NextResponse.json({ error: "A fiók még nincs aktiválva" }, { status: 403 })
    }

    const ok = await bcrypt.compare(password, user.hashed_password)
    if (!ok) {
      return NextResponse.json({ error: "Hibás felhasználónév vagy jelszó" }, { status: 401 })
    }

    const secret = process.env.AUTH_SECRET
    if (!secret) {
      console.error("CRITICAL ERROR: AUTH_SECRET is not defined in environment variables!")
      // Fallback only for development; ensure AUTH_SECRET is set in production
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Szerver konfigurációs hiba (AUTH_SECRET)" }, { status: 500 })
      }
    }

    // Update last seen and log activity
    updateLastSeen(user.id)
    logActivity(user.id, user.username, 'login', 'auth', undefined, 'Sikeres bejelentkezés')

    const key = new TextEncoder().encode(secret || "dev-secret")
    const token = await new SignJWT({ sub: user.id, username: user.username, role: user.role || 'user' })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(key)

    const res = NextResponse.json({ success: true, needsDisplayName: !user.display_name })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
