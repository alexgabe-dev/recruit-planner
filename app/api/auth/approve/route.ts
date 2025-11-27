import { NextResponse } from 'next/server'
import { approveUserByToken } from '@/lib/db'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token') || ''
    if (!token) return NextResponse.json({ error: 'Hiányzó token' }, { status: 400 })
    const user = approveUserByToken(token)
    if (!user) return NextResponse.json({ error: 'Érvénytelen vagy lejárt token' }, { status: 400 })
    return NextResponse.redirect(new URL('/login?approved=1', req.url))
  } catch {
    return NextResponse.json({ error: 'Szerver hiba' }, { status: 500 })
  }
}
