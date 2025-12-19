import { NextResponse } from "next/server"
import { getActivityLogs } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    // Check for admin role? The user said "Adj az adminnak egy Naplózás rendszert".
    // Assuming only admins should see this.
    if (session.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit")) || 100
    const offset = Number(searchParams.get("offset")) || 0
    const userId = searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined
    const action = searchParams.get("action") || undefined
    const entityType = searchParams.get("entityType") || undefined

    const logs = getActivityLogs(limit, offset, { userId, action, entityType })
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
