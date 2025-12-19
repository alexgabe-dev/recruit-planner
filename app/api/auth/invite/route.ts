import { NextResponse } from 'next/server'
import { getInviteByToken } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const invite = getInviteByToken(token)

  if (!invite) {
    return NextResponse.json({ valid: false, error: 'Érvénytelen vagy lejárt meghívó' }, { status: 404 })
  }

  return NextResponse.json({ 
    valid: true, 
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expires_at
  })
}
