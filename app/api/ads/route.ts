import { NextResponse } from "next/server"
import { getAllAds, createAd } from "@/lib/db"
import type { Ad } from "@/lib/types"

export async function GET() {
  try {
    const ads = getAllAds()
    return NextResponse.json(ads)
  } catch {
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload: Omit<Ad, "id" | "createdAt"> = {
      positionName: body.positionName,
      adContent: body.adContent,
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: Boolean(body.isActive),
      partnerId: Number(body.partnerId),
    }
    const created = createAd(payload)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 })
  }
}
