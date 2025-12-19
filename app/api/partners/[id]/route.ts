import { NextResponse } from "next/server"
import { updatePartner, deletePartner, logActivity } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'visitor') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const partnerId = Number(id)
    const body = await request.json()
    
    // If admin, pass undefined as userId to skip ownership check
    const checkUserId = session.role === 'admin' ? undefined : session.userId
    const updated = updatePartner(partnerId, body, checkUserId)

    if (!updated) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    logActivity(session.userId, session.username, 'update', 'partner', partnerId, `Partner módosítva: ${updated.name} (${updated.office})`)

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
    if (session.role === 'visitor') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const partnerId = Number(id)
    
    const checkUserId = session.role === 'admin' ? undefined : session.userId
    const success = deletePartner(partnerId, checkUserId)

    if (!success) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    logActivity(session.userId, session.username, 'delete', 'partner', partnerId, `Partner törölve (ID: ${partnerId})`)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Partner delete error:", e)
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    
    // Only admins can delete
    if (session.role !== 'admin') return NextResponse.json({ error: 'Csak admin törölhet' }, { status: 403 })

    const { id } = await params
    const partnerId = Number(id)
    
    const ok = deletePartner(partnerId)
    if (!ok) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Partner delete error:", e)
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 })
  }
}
