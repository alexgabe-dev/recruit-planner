import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getUserByEmail, getUserByUsername, setResetTokenForUser } from '@/lib/db'
import { resetEmail, sendMail } from '@/lib/email'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { identifier } = body as { identifier?: string }
    if (!identifier) return NextResponse.json({ error: 'Hiányzó azonosító' }, { status: 400 })

    const user = identifier.includes('@') ? getUserByEmail(identifier) : getUserByUsername(identifier)
    if (!user || !user.id) return NextResponse.json({ success: true })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    setResetTokenForUser(user.id, token, expires)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset?token=${token}`
    await sendMail(resetEmail({ to: user.email || identifier, resetUrl }))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Szerver hiba' }, { status: 500 })
  }
}
