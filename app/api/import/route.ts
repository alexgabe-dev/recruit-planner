import { getSession } from "@/lib/auth"
import { importFromExcel } from "@/lib/import-service"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'viewer') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nincs fájl kiválasztva" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await importFromExcel(buffer, session.userId)

    return NextResponse.json({ success: true, count: result.count })
  } catch (e: any) {
    console.error("Import error:", e)
    return NextResponse.json({ error: e.message || "Hiba az importálás során" }, { status: 500 })
  }
}
