import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { logActivity } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const entityType = typeof body.entityType === "string" && body.entityType.trim() ? body.entityType.trim() : "export"
    const details = typeof body.details === "string" ? body.details : "Adat exportálás"

    logActivity(session.userId, session.username, "export", entityType, undefined, details)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Export log error:", error)
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}

