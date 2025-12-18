import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserByUsername, getUserByEmail } from "@/lib/db"
import { warningEmail, sendMail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    
    // Optional: restrict to viewer role if required
    const sender = getUserByUsername(session.username)
    if (!sender) return NextResponse.json({ error: "Küldő nem található" }, { status: 404 })

    const body = await req.json()
    const { recipientId, message } = body as { recipientId: number; message: string }

    if (!recipientId || !message) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 })
    }

    // We need to fetch the recipient's email. 
    // Since listUsers returns IDs, we need a way to get user by ID.
    // listUsers() returns all users, so we can filter from there or add a getUserById function.
    // For now, let's use listUsers() to find the email as it's already implemented and cached/fast enough for SQLite.
    // OR just add getUserById to db.ts. 
    // Wait, listUsers returns { id, ... email }. I can import listUsers and find the user.
    // But better to use SQL. db.ts doesn't have getUserById exported.
    // I will add getUserById to db.ts or just query manually here? No, I should stick to db.ts abstraction.
    // Let's modify db.ts to export getUserById or just use listUsers() here since the list is small.
    // Actually, I can use `listUsers()` and find the user.
    
    const { listUsers } = await import("@/lib/db")
    const users = listUsers()
    const recipient = users.find(u => u.id === recipientId)

    if (!recipient || !recipient.email) {
      return NextResponse.json({ error: "Címzett nem található vagy nincs email címe" }, { status: 404 })
    }

    const sentAt = new Date().toLocaleString("hu-HU")
    const mailOptions = warningEmail({
      to: recipient.email,
      message,
      senderName: sender.display_name || sender.username,
      sentAt
    })

    const result = await sendMail(mailOptions)
    
    if (!result.success) {
      return NextResponse.json({ error: "Hiba az email küldésekor" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send warning error:", error)
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
