"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/db-store"
import { TypeBadge } from "@/components/ui/type-badge"
import { Clock } from "lucide-react"

export function RecentAds() {
  const { ads, partners } = useStore()

  const recentAds = [...ads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((ad) => ({
      ...ad,
      partner: partners.find((p) => p.id === ad.partnerId),
    }))

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-foreground">Legújabb hirdetések</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAds.map((ad) => (
            <div key={ad.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{ad.positionName}</p>
                <p className="truncate text-xs text-muted-foreground">{ad.partner?.name}</p>
              </div>
              <TypeBadge type={ad.type} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
