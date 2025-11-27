"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/db-store"
import { getAdStatus } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useMemo } from "react"

export function CampaignCalendar() {
  const { ads, partners } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const daysInMonth = monthEnd.getDate()
  const startDay = monthStart.getDay()

  const adsInMonth = useMemo(() => {
    return ads
      .filter((ad) => {
        const start = new Date(ad.startDate)
        const end = new Date(ad.endDate)
        return (
          (start >= monthStart && start <= monthEnd) ||
          (end >= monthStart && end <= monthEnd) ||
          (start <= monthStart && end >= monthEnd)
        )
      })
      .map((ad) => ({
        ...ad,
        partner: partners.find((p) => p.id === ad.partnerId),
        status: getAdStatus(ad),
      }))
  }, [ads, partners, currentDate])

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDay + 1
    if (day < 1 || day > daysInMonth) return null
    return day
  })

  const getAdsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return adsInMonth.filter((ad) => {
      const start = new Date(ad.startDate)
      const end = new Date(ad.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthNames = [
    "Január",
    "Február",
    "Március",
    "Április",
    "Május",
    "Június",
    "Július",
    "Augusztus",
    "Szeptember",
    "Október",
    "November",
    "December",
  ]

  const dayNames = ["V", "H", "K", "Sze", "Cs", "P", "Szo"]

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Kampány naptár</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayAds = day ? getAdsForDay(day) : []
            return (
              <div
                key={i}
                className={`min-h-[80px] rounded-lg border p-1 ${
                  day
                    ? isToday(day)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                    : "border-transparent"
                }`}
              >
                {day && (
                  <>
                    <div className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayAds.slice(0, 2).map((ad) => (
                        <div
                          key={ad.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                            ad.type === "kampány"
                              ? "bg-[oklch(0.7_0.15_160/0.2)] text-[oklch(0.7_0.15_160)]"
                              : ad.type === "post"
                                ? "bg-[oklch(0.65_0.18_250/0.2)] text-[oklch(0.65_0.18_250)]"
                                : "bg-[oklch(0.75_0.15_45/0.2)] text-[oklch(0.75_0.15_45)]"
                          }`}
                          title={ad.positionName}
                        >
                          {ad.positionName}
                        </div>
                      ))}
                      {dayAds.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{dayAds.length - 2} más</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[oklch(0.7_0.15_160)]" />
            <span className="text-xs text-muted-foreground">Kampány</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[oklch(0.65_0.18_250)]" />
            <span className="text-xs text-muted-foreground">Post</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[oklch(0.75_0.15_45)]" />
            <span className="text-xs text-muted-foreground">Kiemelt post</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
