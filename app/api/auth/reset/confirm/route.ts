import { NextResponse } from 'next/server'
import { getUserByResetToken, clearResetToken, getDatabase } from '@/lib/db'
import bcrypt from 'bcryptjs'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, newPassword } = body as { token?: string; newPassword?: string }
    if (!token || !newPassword) return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ error: 'A jelszó legyen legalább 8 karakter' }, { status: 400 })

    const user = getUserByResetToken(token)
    if (!user || !user.id || !user.reset_expires) return NextResponse.json({ error: 'Érvénytelen token' }, { status: 400 })
    const expires = new Date(user.reset_expires as any)
    if (Date.now() > expires.getTime()) return NextResponse.json({ error: 'Token lejárt' }, { status: 400 })

    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(newPassword, salt)
    const db = getDatabase()
    const res = db.prepare('UPDATE users SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, user.id)
    if (res.changes !== 1) return NextResponse.json({ error: 'Nem sikerült frissíteni' }, { status: 500 })
    clearResetToken(user.id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Szerver hiba' }, { status: 500 })
  }
}
