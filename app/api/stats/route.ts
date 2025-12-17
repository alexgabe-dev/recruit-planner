import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 })
    const url = new URL(req.url)
    const userParam = url.searchParams.get('userId')
    
    // Admins and viewers see global stats by default (undefined userId), unless they filter
    // Users see only their own stats
    const targetUserId = (session.role === 'admin' || session.role === 'viewer') 
      ? (userParam ? Number(userParam) : undefined) 
      : session.userId
      
    const stats = getDashboardStats(targetUserId)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
