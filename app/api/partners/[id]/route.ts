import { NextResponse } from "next/server"
import { updatePartner, deletePartner, logActivity } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'visitor' || session.role === 'viewer') {
        return NextResponse.json({ error: `Nincs jogosultság (Jelenlegi szerepkör: ${session.role})` }, { status: 403 })
    }

    const { id } = await params
    const partnerId = Number(id)
    const body = await request.json()
    
    // Allow 'user' and 'admin' to edit any partner (shared workspace)
    const checkUserId = undefined
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
    if (session.role === 'visitor' || session.role === 'viewer') {
        return NextResponse.json({ error: `Nincs jogosultság (Jelenlegi szerepkör: ${session.role})` }, { status: 403 })
    }

    const { id } = await params
    const partnerId = Number(id)
    
    // Allow 'user' and 'admin' to delete any partner (shared workspace)
    const checkUserId = undefined
    const success = deletePartner(partnerId, checkUserId)

    if (!success) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    logActivity(session.userId, session.username, 'delete', 'partner', partnerId, `Partner törölve (ID: ${partnerId})`)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Partner delete error:", e)
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 })
  }
}
