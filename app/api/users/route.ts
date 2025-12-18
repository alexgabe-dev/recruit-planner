import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { listUsers } from "@/lib/db"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
  
  // Allow any logged in user to see the list of users (needed for the warning dialog)
  // In a stricter system, we might limit this to admin/viewer, but viewer needs it.
  
  const users = listUsers()
  // Filter out sensitive info if necessary, but listUsers already returns a safe subset (no password hash)
  return NextResponse.json(users)
}
