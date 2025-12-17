import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { listUsers } from "@/lib/db"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
  if (session.role !== 'admin' && session.role !== 'viewer') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
  const users = listUsers()
  return NextResponse.json(users)
}
