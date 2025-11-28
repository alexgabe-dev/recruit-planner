import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { setAvatarUrl, getUserByUsername } from "@/lib/db"
import path from "path"
import fs from "fs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })

  const user = getUserByUsername(session.username)
  if (!user) return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })

  try {
    const form = await req.formData()
    const file = form.get("avatar") as File | null
    if (!file) return NextResponse.json({ error: "Hiányzó fájl" }, { status: 400 })

    const type = file.type || ""
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "Csak képfájl tölthető fel" }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Legfeljebb 5MB lehet a fájl" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = (type.split("/")[1] || "png").toLowerCase()
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    let avatarUrl: string | null = null
    try {
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const prefix = `user-${user.id}-`
      const existing = fs.readdirSync(uploadsDir).filter((f) => f.startsWith(prefix))
      for (const f of existing) {
        try { fs.unlinkSync(path.join(uploadsDir, f)) } catch {}
      }
      const filename = `user-${user.id}-${Date.now()}.${ext}`
      const targetPath = path.join(uploadsDir, filename)
      fs.writeFileSync(targetPath, buffer)
      avatarUrl = `/uploads/${filename}`
    } catch {
      const base64 = buffer.toString("base64")
      avatarUrl = `data:${type || "image/png"};base64,${base64}`
    }
    setAvatarUrl(user.id, avatarUrl)
    return NextResponse.json({ success: true, avatarUrl })
  } catch (e) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
