"use client"

import { useStore, useLoadData } from "@/lib/db-store"
import { StatsCards } from "./stats-cards"
import { CampaignCalendar } from "./campaign-calendar"
import { NotificationsList } from "./notifications-list"
import { RecentAds } from "./recent-ads"
import { useEffect, useState } from "react"
import type { DashboardStats } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"

export function DashboardContent() {
  const { t } = useLanguage()
  const { ads, partners, getDashboardStats, isLoading, error } = useStore()
  const [stats, setStats] = useState<DashboardStats>({
    activeAds: 0,
    scheduledToday: 0,
    endingSoon: 0,
    totalPartners: 0,
  })
  const [role, setRole] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const isLoadingData = useLoadData()

  useEffect(() => {
    ;(async () => {
      try {
        // Cache busting for role check
        const meRes = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
        if (meRes.ok) {
          const me = await meRes.json()
          setRole(me.role || 'user')
        }
        
        if (!isLoading && !error) {
          // Always fetch global stats/default stats
          getDashboardStats().then(setStats).catch(console.error)
        }
      } catch {}
    })()
  }, [isLoading, error, getDashboardStats])

  if (isLoadingData || isLoading) {
  return (
      <div className="space-y-6">
        <div>
        <h1 className="text-2xl font-bold text-foreground">{t("page.dashboardTitle", "Dashboard")}</h1>
        <p className="text-muted-foreground">{t("page.dashboardDesc", "Üdvözöljük a toborzási hirdetéskezelő rendszerben")}</p>
      </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted p-6">
              <div className="h-4 w-24 rounded bg-muted-foreground/20 mb-2"></div>
              <div className="h-8 w-16 rounded bg-muted-foreground/20"></div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="animate-pulse rounded-lg bg-muted p-6 h-[400px]"></div>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse rounded-lg bg-muted p-6 h-[200px]"></div>
            <div className="animate-pulse rounded-lg bg-muted p-6 h-[200px]"></div>
          </div>
        </div>
      </div>
    )
  }
 
   if (error) {
     return (
       <div className="space-y-6">
       <div>
           <h1 className="text-2xl font-bold text-foreground">{t("page.dashboardTitle", "Dashboard")}</h1>
           <p className="text-muted-foreground">{t("page.dashboardDesc", "Üdvözöljük a toborzási hirdetéskezelő rendszerben")}</p>
         </div>
         
         <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
           <p className="text-sm text-destructive">Hiba történt az adatok betöltése során: {error}</p>
         </div>
       </div>
     )
   }
 
   return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("page.dashboardTitle", "Dashboard")}</h1>
        <p className="text-muted-foreground">{t("page.dashboardDesc", "Üdvözöljük a toborzási hirdetéskezelő rendszerben")}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CampaignCalendar />
        </div>
        <div className="space-y-6">
          <NotificationsList />
          <RecentAds />
        </div>
      </div>
    </div>
  )
}
