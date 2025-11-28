import { NextResponse } from "next/server"
import { getAllPartners, createPartner } from "@/lib/db"
import { getSession } from "@/lib/auth"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    const partners = getAllPartners(session.userId)
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    const body = await request.json()
    const created = createPartner(body, session.userId)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}
