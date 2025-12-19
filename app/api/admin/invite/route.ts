import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createInvite, logActivity } from "@/lib/db"
import { sendMail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
    }

    const { email, role, sendEmail: shouldSendEmail } = await req.json()
    
    if (!email || !role) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 })
    }

    const token = createInvite(email, role, session.userId)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invite=${token}`

    if (shouldSendEmail) {
      await sendMail(inviteEmail({
        to: email,
        inviteLink,
        inviterName: session.username,
        role
      }))
    }

    logActivity(session.userId, session.username, 'create', 'invite', undefined, `Meghívó létrehozva: ${email} (${role})`)

    return NextResponse.json({ success: true, inviteLink })
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Hiba történt a meghívó létrehozásakor" }, { status: 500 })
  }
}
