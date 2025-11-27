"use client"

import { useStore, useLoadData } from "@/lib/db-store"
import { StatsCards } from "./stats-cards"
import { CampaignCalendar } from "./campaign-calendar"
import { NotificationsList } from "./notifications-list"
import { RecentAds } from "./recent-ads"
import { useEffect, useState } from "react"
import type { DashboardStats } from "@/lib/types"

export function DashboardContent() {
  const { ads, partners, getDashboardStats, isLoading, error } = useStore()
  const [stats, setStats] = useState<DashboardStats>({
    activeAds: 0,
    scheduledToday: 0,
    endingSoon: 0,
    totalPartners: 0,
  })

  const isLoadingData = useLoadData()

  useEffect(() => {
    if (!isLoading && !error) {
      getDashboardStats().then(setStats).catch(console.error)
    }
  }, [isLoading, error, getDashboardStats])

  if (isLoadingData || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Üdvözöljük a toborzási hirdetéskezelő rendszerben</p>
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
           <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
           <p className="text-muted-foreground">Üdvözöljük a toborzási hirdetéskezelő rendszerben</p>
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
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Üdvözöljük a toborzási hirdetéskezelő rendszerben</p>
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
