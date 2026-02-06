import { NextResponse } from "next/server"
import { getSystemSettings, listUsers, getAllExpiringAds, getNotificationEmails, logActivity } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { sendMail, weeklyDigestEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET method for easier cron job setup (curl-friendly)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  const CRON_SECRET = process.env.CRON_SECRET || 'changeme_in_production'
  if (key !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return handleWeeklyDigest(null, false)
}

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
    return handleWeeklyDigest(body.userId || null, !!body.userId)
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function handleWeeklyDigest(targetUserId: number | null, isManualTest: boolean) {
  try {
    const settings = getSystemSettings()

    const enabled = settings.weekly_digest_enabled === true
    const types = settings.weekly_digest_types || ["kampány", "Profession", "kiemelt post"]

    // If disabled and not a manual test, skip
    if (!enabled && !isManualTest) {
      return NextResponse.json({ skipped: true, reason: "Feature disabled" })
    }

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startStr = today.toLocaleDateString('hu-HU')
    const endStr = nextWeek.toLocaleDateString('hu-HU')

    // 1. Get ALL expiring ads for the next 7 days matching criteria
    const allAds = getAllExpiringAds(7, types)

    // 2. Determine recipients
    let recipientEmails: string[] = []

    if (targetUserId) {
      // Manual test for specific user
      const allUsers = listUsers()
      const target = allUsers.find(u => u.id === Number(targetUserId))
      if (target?.email) recipientEmails.push(target.email)
    } else {
      // Bulk send to ALL active users with email
      const users = listUsers().filter(u => u.status === 'active' && u.email)
      recipientEmails = users.map(u => u.email!)

      // Add extra notification emails
      const extraEmails = getNotificationEmails()
      recipientEmails = [...recipientEmails, ...extraEmails]
    }

    // Deduplicate
    recipientEmails = Array.from(new Set(recipientEmails))

    const results = {
      totalRecipients: recipientEmails.length,
      totalAds: allAds.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 3. Send emails
    for (const email of recipientEmails) {
      const emailData = weeklyDigestEmail({
        to: email,
        ads: allAds,
        start: startStr,
        end: endStr
      })

      const res = await sendMail(emailData)
      if (res.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`Failed to send to ${email}: ${res.error}`)
      }
    }

    // 4. Log activity
    const logMessage = allAds.length > 0
      ? `Heti összesítő kiküldve: ${results.sent}/${recipientEmails.length} címzettnek. ${allAds.length} lejáró hirdetés.`
      : `Heti összesítő kiküldve: ${results.sent}/${recipientEmails.length} címzettnek. Nincs lejáró hirdetés ezen a héten.`

    logActivity(
      null,
      isManualTest ? 'Admin (Teszt)' : 'Rendszer (Cron)',
      'cron',
      'notification',
      undefined,
      logMessage
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
