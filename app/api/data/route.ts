import { NextResponse } from "next/server"
import { getAllPartners, getAllAds } from "@/lib/db"

export async function GET() {
  try {
    const partners = getAllPartners()
    const ads = getAllAds()
    return NextResponse.json({ partners, ads })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
