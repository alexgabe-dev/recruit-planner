import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getNotificationEmails, addNotificationEmail, removeNotificationEmail } from "@/lib/db"

// GET: List all notification emails
export async function GET(request: Request) {
    try {
        const session = await getSession(request)
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const emails = getNotificationEmails()
        return NextResponse.json({ emails })
    } catch (error) {
        console.error("Get notification emails error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// POST: Add a new notification email
export async function POST(request: Request) {
    try {
        const session = await getSession(request)
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { email } = body

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 })
        }

        addNotificationEmail(email.trim().toLowerCase())
        const emails = getNotificationEmails()
        return NextResponse.json({ emails })
    } catch (error) {
        console.error("Add notification email error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// DELETE: Remove a notification email
export async function DELETE(request: Request) {
    try {
        const session = await getSession(request)
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 })
        }

        removeNotificationEmail(email)
        const emails = getNotificationEmails()
        return NextResponse.json({ emails })
    } catch (error) {
        console.error("Remove notification email error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
