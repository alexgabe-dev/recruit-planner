"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/db-store"
import { Bell, Play, Clock } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function NotificationsList() {
  const { t } = useLanguage()
  const { ads, partners } = useStore()

  const today = new Date()
  const sameLocalDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const notifications = ads
    .map((ad) => {
      const partner = partners.find((p) => p.id === ad.partnerId)
      const start = new Date(ad.startDate)
      const end = new Date(ad.endDate)

      if (sameLocalDay(start, today)) {
        return {
          id: `start-${ad.id}`,
          type: "start" as const,
          ad,
          partner,
          date: start,
        }
      }
      if (sameLocalDay(end, today)) {
        return {
          id: `end-${ad.id}`,
          type: "end" as const,
          ad,
          partner,
          date: end,
        }
      }
      return null
    })
    .filter(Boolean)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-foreground">{t("dashboard.todayEvents", "Mai események")}</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.noTodayEvents", "Nincsenek mai események")}</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif!.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                {notif!.type === "start" ? (
                  <Play className="mt-0.5 h-4 w-4 text-[oklch(0.7_0.18_145)]" />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4 text-[oklch(0.75_0.15_45)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{notif!.ad.positionName}</p>
                  <p className="text-xs text-muted-foreground">
                    {notif!.partner?.name} - {notif!.partner?.office}
                  </p>
                  <p className="text-xs text-muted-foreground">{notif!.type === "start" ? t("dashboard.startsToday", "Ma indul") : t("dashboard.endsToday", "Ma lejár")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
