import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserByUsername, setDisplayName, setThemePreference, setLocalePreference } from "@/lib/db"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
  const user = getUserByUsername(session.username)
  if (!user) return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })
  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    displayName: user.display_name ?? null,
    role: user.role ?? 'user',
    avatarUrl: user.avatar_url ?? null,
    themePreference: user.theme_preference ?? 'dark',
    localePreference: user.locale_preference ?? 'hu',
  })
}

export async function PATCH(req: Request) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 })
  const user = getUserByUsername(session.username)
  if (!user) return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })
  try {
    const body = await req.json()
    const { displayName, themePreference, localePreference } = body as {
      displayName?: string
      themePreference?: string
      localePreference?: string
    }

    if (themePreference !== undefined) {
      if (themePreference !== "light" && themePreference !== "dark") {
        return NextResponse.json({ error: "Érvénytelen téma" }, { status: 400 })
      }
      setThemePreference(user.id, themePreference)
    }

    if (localePreference !== undefined) {
      if (localePreference !== "hu" && localePreference !== "en") {
        return NextResponse.json({ error: "Érvénytelen nyelv" }, { status: 400 })
      }
      setLocalePreference(user.id, localePreference)
    }

    if (displayName !== undefined) {
      if (!displayName || displayName.trim().length < 1) {
        return NextResponse.json({ error: "Hiányzó név" }, { status: 400 })
      }
      setDisplayName(user.id, displayName.trim())
    }

    if (displayName === undefined && themePreference === undefined && localePreference === undefined) {
      return NextResponse.json({ error: "Nincs módosítandó mező" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 })
  }
}
