"use client"

import { useStore, useLoadData } from "@/lib/db-store"
import { StatsCards } from "./stats-cards"
import { CampaignCalendar } from "./campaign-calendar"
import { NotificationsList } from "./notifications-list"
import { RecentAds } from "./recent-ads"
import { useEffect, useState } from "react"
import type { DashboardStats } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardContent() {
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
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
        if (meRes.ok) {
          const me = await meRes.json()
          setRole(me.role || 'user')
          if (me.role === 'viewer') {
            const u = await fetch('/api/users', { cache: 'no-store' })
            if (u.ok) {
              const list = await u.json()
              setUsers(list)
              const last = typeof window !== 'undefined' ? window.localStorage.getItem('viewerLastUserId') : null
              const id = last ? Number(last) : undefined
              if (id) setSelectedUserId(id)
              if (!isLoading && !error) {
                getDashboardStats(id).then(setStats).catch(console.error)
              }
              return
            }
          }
        }
        if (!isLoading && !error) {
          getDashboardStats().then(setStats).catch(console.error)
        }
      } catch {}
    })()
  }, [isLoading, error, getDashboardStats])

  if (isLoadingData || isLoading) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Üdvözöljük a toborzási hirdetéskezelő rendszerben</p>
        {role === 'viewer' && (
          <div className="mt-2 flex items-center gap-2">
            <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={(v) => {
              const id = Number(v)
              setSelectedUserId(id)
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('viewerLastUserId', String(id))
              }
              getDashboardStats(id).then(setStats).catch(console.error)
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Felhasználó" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
