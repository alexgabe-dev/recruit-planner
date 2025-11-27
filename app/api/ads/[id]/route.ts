import { NextResponse } from "next/server"
import { updateAd, deleteAd } from "@/lib/db"
import type { Ad } from "@/lib/types"

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const body = await request.json()
    const updates: Partial<Omit<Ad, "id" | "createdAt">> = {}
    if (body.positionName !== undefined) updates.positionName = body.positionName
    if (body.adContent !== undefined) updates.adContent = body.adContent
    if (body.type !== undefined) updates.type = body.type
    if (body.startDate !== undefined) updates.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updates.endDate = new Date(body.endDate)
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)
    if (body.partnerId !== undefined) updates.partnerId = Number(body.partnerId)
    const updated = updateAd(id, updates)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    console.log("DELETE /api/ads", { id })
    const ok = deleteAd(id)
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.log("Deleted ad", { id })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 })
  }
}
