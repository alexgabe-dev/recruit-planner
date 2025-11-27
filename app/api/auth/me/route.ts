import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserByUsername } from "@/lib/db"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
  const user = getUserByUsername(session.username)
  if (!user) return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })
  return NextResponse.json({ id: user.id, username: user.username, email: user.email ?? null })
}
