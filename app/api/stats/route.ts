import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 })
    const url = new URL(req.url)
    const userParam = url.searchParams.get('userId')
    const targetUserId = session.role === 'viewer' ? (userParam ? Number(userParam) || session.userId : undefined) : session.userId
    const stats = getDashboardStats(targetUserId)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
