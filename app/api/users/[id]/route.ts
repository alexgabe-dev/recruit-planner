import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { updateUser, deleteUser } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role !== 'admin') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const userId = Number(id)
    const body = await req.json()
    const { role, status } = body

    if (userId === session.userId) {
       // Prevent admin from changing their own role/status to something locking them out?
       // For now, let's allow it but maybe warn? Or just block removing admin role.
       if (role && role !== 'admin') {
         return NextResponse.json({ error: "Saját admin jogosultság nem vehető el" }, { status: 400 })
       }
    }

    const success = updateUser(userId, { role, status })
    if (!success) return NextResponse.json({ error: "Nem sikerült frissíteni" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
    if (session.role !== 'admin') return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })

    const { id } = await params
    const userId = Number(id)

    if (userId === session.userId) {
      return NextResponse.json({ error: "Saját fiók nem törölhető innen" }, { status: 400 })
    }

    const success = deleteUser(userId)
    if (!success) return NextResponse.json({ error: "Nem sikerült törölni" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
