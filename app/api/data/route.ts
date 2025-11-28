import { NextResponse } from "next/server"
import { getAllPartners, getAllAds } from "@/lib/db"
import { getSession } from "@/lib/auth"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    const partners = getAllPartners(session.userId)
    const ads = getAllAds(session.userId)
    return NextResponse.json({ partners, ads })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
