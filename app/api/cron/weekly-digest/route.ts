import { NextResponse } from "next/server"
import { getSystemSettings, listUsers, getAllExpiringAds } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { sendMail, weeklyDigestEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    const authHeader = request.headers.get('authorization')
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isAdmin = session?.role === 'admin'

    if (!isCron && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const settings = getSystemSettings()
    
    const enabled = settings.weekly_digest_enabled === true
    const types = settings.weekly_digest_types || ["kampány", "Profession", "kiemelt post"]
    
    // If disabled and not a manual test (userId provided), skip
    if (!enabled && !body.userId) {
      return NextResponse.json({ skipped: true, reason: "Feature disabled" })
    }

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startStr = today.toLocaleDateString('hu-HU')
    const endStr = nextWeek.toLocaleDateString('hu-HU')

    // 1. Get ALL expiring ads for the next 7 days matching criteria
    const allAds = getAllExpiringAds(7, types)

    if (allAds.length === 0) {
      return NextResponse.json({ skipped: true, reason: "No expiring ads found" })
    }

    // 2. Determine recipients
    let users = []
    if (body.userId) {
      // Manual test for specific user
      const allUsers = listUsers()
      const target = allUsers.find(u => u.id === Number(body.userId))
      if (target) users.push(target)
    } else {
      // Bulk send to ALL active users with email
      users = listUsers().filter(u => u.status === 'active' && u.email)
    }

    const results = {
      totalRecipients: users.length,
      totalAds: allAds.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 3. Send the SAME list to everyone
    for (const user of users) {
      if (!user.email) {
        results.skipped++
        continue
      }

      const emailData = weeklyDigestEmail({
        to: user.email,
        ads: allAds, // Everyone gets the full list
        start: startStr,
        end: endStr
      })

      const res = await sendMail(emailData)
      if (res.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`Failed to send to ${user.username}: ${res.error}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
