import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { initializeSampleData } from "@/lib/db-init"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 })
    if (session.role === 'viewer') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
    const { seed } = await request.json()
    const db = getDatabase()
    db.prepare("DELETE FROM ads").run()
    db.prepare("DELETE FROM partners").run()
    if (seed) {
      initializeSampleData()
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to reset database" }, { status: 500 })
  }
}
