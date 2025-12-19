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
      await sendMail({
        to: email,
        subject: "Meghívó a Hirdetéskezelő rendszerbe",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Meghívó érkezett</h2>
            <p>Kedves Felhasználó!</p>
            <p><strong>${session.username}</strong> meghívott, hogy csatlakozz a Hirdetéskezelő rendszerhez <strong>${role}</strong> jogosultsággal.</p>
            <p>A meghívó link <strong>15 percig</strong> érvényes.</p>
            <p>A regisztrációhoz kattints az alábbi linkre:</p>
            <p>
              <a href="${inviteLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Regisztráció
              </a>
            </p>
            <p>Vagy másold be ezt a linket a böngésződbe:</p>
            <p style="color: #666; word-break: break-all;">${inviteLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px; margin-bottom: 5px;">Készítette: Gábor Sándor, 2025 | <a href="https://github.com/alexgabe-dev" style="color: #0070f3; text-decoration: none;">További munkáim</a></p>
            <p style="color: #888; font-size: 12px; margin-top: 0;">Ez egy automatikus üzenet, kérjük ne válaszolj rá.</p>
          </div>
        `
      })
    }

    logActivity(session.userId, session.username, 'create', 'invite', undefined, `Meghívó létrehozva: ${email} (${role})`)

    return NextResponse.json({ success: true, inviteLink })
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Hiba történt a meghívó létrehozásakor" }, { status: 500 })
  }
}
