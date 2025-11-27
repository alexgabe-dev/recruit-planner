import { NextResponse } from "next/server"
import { getAllPartners, createPartner } from "@/lib/db"

export async function GET() {
  try {
    const partners = getAllPartners()
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = createPartner(body)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}
