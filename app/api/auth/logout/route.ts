import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { logActivity } from "@/lib/db"

const COOKIE_NAME = "session"

export async function POST(req: Request) {
  // Try to get session before logging out to log the action
  const session = await getSession(req)
  if (session) {
    logActivity(session.userId, session.username, 'logout', 'auth', undefined, 'Kijelentkezés')
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}

