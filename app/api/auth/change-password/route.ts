import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDatabase } from "@/lib/db"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const COOKIE_NAME = "session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string }
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "A jelszó legyen legalább 8 karakter" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    }

    const secret = process.env.AUTH_SECRET || "dev-secret"
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)
    const userId = Number(payload.sub)
    if (!userId) {
      return NextResponse.json({ error: "Érvénytelen munkamenet" }, { status: 401 })
    }

    const db = getDatabase()
    const user = db.prepare("SELECT id, username, hashed_password FROM users WHERE id = ?").get(userId) as
      | { id: number; username: string; hashed_password: string }
      | undefined
    if (!user) {
      return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })
    }

    const ok = await bcrypt.compare(currentPassword, user.hashed_password)
    if (!ok) {
      return NextResponse.json({ error: "Hibás jelenlegi jelszó" }, { status: 401 })
    }

    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(newPassword, salt)
    const res = db
      .prepare("UPDATE users SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(hash, user.id)
    if (res.changes !== 1) {
      return NextResponse.json({ error: "Nem sikerült frissíteni" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
