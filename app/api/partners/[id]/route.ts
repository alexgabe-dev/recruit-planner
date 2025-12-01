import { NextResponse } from "next/server"
import { updatePartner, deletePartner } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'viewer') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const partnerId = Number(id)
    const body = await request.json()
    
    const updated = updatePartner(partnerId, body, session.userId)
    if (!updated) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    return NextResponse.json(updated)
  } catch (e) {
    console.error("Partner update error:", e)
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'viewer') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const partnerId = Number(id)
    
    const ok = deletePartner(partnerId, session.userId)
    if (!ok) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Partner delete error:", e)
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 })
  }
}
