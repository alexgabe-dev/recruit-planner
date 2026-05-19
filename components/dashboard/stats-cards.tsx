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
      color: "text-[#86efac]",
      bgColor: "bg-[rgb(34_197_94/0.12)]",
    },
    {
      title: t("dashboard.startingToday", "Ma indul"),
      value: stats.scheduledToday,
      icon: Calendar,
      color: "text-[#c4b5fd]",
      bgColor: "bg-[rgb(124_58_237/0.12)]",
    },
    {
      title: t("dashboard.expiringSoon", "Hamarosan lejár"),
      value: stats.endingSoon,
      icon: Clock,
      color: "text-[#fbbf24]",
      bgColor: "bg-[rgb(245_158_11/0.12)]",
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
        <Card key={card.title} className="overflow-hidden border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{card.title}</CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
