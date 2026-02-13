import { NextResponse } from "next/server"
import { updateAd, deleteAd, logActivity } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { Ad } from "@/lib/types"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'visitor') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const body = await request.json()
    const updates: Partial<Omit<Ad, "id" | "createdAt">> = {}
    if (body.positionName !== undefined) updates.positionName = body.positionName
    if (body.adContent !== undefined) updates.adContent = body.adContent
    if (body.type !== undefined) updates.type = body.type
    if (body.businessArea !== undefined) updates.businessArea = body.businessArea
    if (body.startDate !== undefined) updates.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updates.endDate = new Date(body.endDate)
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)
    if (body.partnerId !== undefined) updates.partnerId = Number(body.partnerId)
    
    // If admin, pass undefined as userId to skip ownership check
    const checkUserId = session.role === 'admin' ? undefined : session.userId
    const updated = updateAd(id, updates, checkUserId)
    
    if (!updated) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    logActivity(session.userId, session.username, 'update', 'ad', id, `Hirdetés módosítva: ${updated.positionName}`)

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role === 'visitor' || session.role === 'viewer') {
        return NextResponse.json({ error: `Nincs jogosultság (Jelenlegi szerepkör: ${session.role})` }, { status: 403 })
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    
    // Allow 'user' and 'admin' to delete any ad (shared workspace)
    const checkUserId = undefined
    const success = deleteAd(id, checkUserId)
    
    if (!success) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 })
    
    logActivity(session.userId, session.username, 'delete', 'ad', id, `Hirdetés törölve (ID: ${id})`)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 })
  }
}
