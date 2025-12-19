import { NextResponse } from "next/server"
import { getAllPartners, createPartner, logActivity } from "@/lib/db"
import { getSession } from "@/lib/auth"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    
    // Return all partners
    const partners = getAllPartners()
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'visitor') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
    const body = await request.json()
    const created = createPartner(body, session.userId)
    
    logActivity(session.userId, session.username, 'create', 'partner', created.id, `Partner létrehozva: ${created.name} (${created.office})`)
    
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}
