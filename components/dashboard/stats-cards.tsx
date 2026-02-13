import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardStats } from "@/lib/types"
import { Activity, Calendar, Clock, Building2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useLanguage()
  const cards = [
    {
      title: t("dashboard.activeCampaigns", "Aktív kampányok"),
      value: stats.activeAds,
      icon: Activity,
      color: "text-[oklch(0.7_0.18_145)]",
      bgColor: "bg-[oklch(0.7_0.18_145/0.1)]",
    },
    {
      title: t("dashboard.startingToday", "Ma indul"),
      value: stats.scheduledToday,
      icon: Calendar,
      color: "text-[oklch(0.65_0.2_250)]",
      bgColor: "bg-[oklch(0.65_0.2_250/0.1)]",
    },
    {
      title: t("dashboard.expiringSoon", "Hamarosan lejár"),
      value: stats.endingSoon,
      icon: Clock,
      color: "text-[oklch(0.75_0.15_45)]",
      bgColor: "bg-[oklch(0.75_0.15_45/0.1)]",
    },
    {
      title: t("dashboard.partners", "Partnerek"),
      value: stats.totalPartners,
      icon: Building2,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
