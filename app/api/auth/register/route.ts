import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createPendingUser } from '@/lib/db'
import { approvalEmail, sendMail } from '@/lib/email'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, email, password } = body as { username?: string; email?: string; password?: string }
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'A jelszó legyen legalább 8 karakter' }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(password, salt)
    const token = crypto.randomBytes(32).toString('hex')
    const created = createPendingUser({ username, email, hashedPassword: hash, approvalToken: token })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const approveUrl = `${baseUrl}/api/auth/approve?token=${token}`
    const mail = approvalEmail({ username, email, approveUrl })
    await sendMail(mail)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Szerver hiba' }, { status: 500 })
  }
}
