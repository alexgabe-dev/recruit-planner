"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/db-store"
import { getAdStatus, type Ad, type Partner, type AdStatus } from "@/lib/types"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type AdWithDetails = Ad & { partner?: Partner; status: AdStatus }

export function CampaignCalendar() {
  const { ads, partners } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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
    date.setHours(0, 0, 0, 0)

    return adsInMonth.reduce<Array<AdWithDetails & { isStart: boolean }>>((acc, ad) => {
      const start = new Date(ad.startDate)
      const end = new Date(ad.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      
      const isStart = date.getTime() === start.getTime()
      const isEnd = date.getTime() === end.getTime()

      if (isStart || isEnd) {
        acc.push({ ...ad, isStart })
      }
      return acc
    }, [])
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

  const getTypeTone = (type: Ad["type"]) => {
    if (type === "kampány") {
      return {
        dot: "bg-[#a78bfa]",
        badge: "border-[rgb(124_58_237/0.24)] bg-[rgb(124_58_237/0.12)] text-[#c4b5fd]",
      }
    }
    if (type === "post") {
      return {
        dot: "bg-[#38bdf8]",
        badge: "border-[rgb(56_189_248/0.24)] bg-[rgb(56_189_248/0.1)] text-[#7dd3fc]",
      }
    }
    if (type === "Profession") {
      return {
        dot: "bg-[#22c55e]",
        badge: "border-[rgb(34_197_94/0.24)] bg-[rgb(34_197_94/0.1)] text-[#86efac]",
      }
    }
    return {
      dot: "bg-[#f59e0b]",
      badge: "border-[rgb(245_158_11/0.24)] bg-[rgb(245_158_11/0.1)] text-[#fbbf24]",
    }
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(date)
  }

  const selectedDayAds = useMemo(() => {
    if (!selectedDate) return []
    const day = selectedDate.getDate()
    // Ensure we are looking at the right month if selectedDate is from current view
    // But simplistic check: filter all ads for this specific date timestamp
    return ads
        .map(ad => ({
            ...ad,
            partner: partners.find(p => p.id === ad.partnerId),
            status: getAdStatus(ad)
        }))
        .filter(ad => {
            const start = new Date(ad.startDate)
            const end = new Date(ad.endDate)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)
            const current = new Date(selectedDate)
            current.setHours(0, 0, 0, 0)
            return current >= start && current <= end
        })
  }, [selectedDate, ads, partners])

  return (
    <>
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
                onClick={() => day && handleDayClick(day)}
                className={`min-h-[80px] sm:min-h-[100px] cursor-pointer rounded-lg border p-1 transition-[background-color,border-color] ${
                  day
                    ? isToday(day)
                      ? "border-primary/50 bg-[rgb(124_58_237/0.1)]"
                      : "border-border bg-background hover:bg-accent/50"
                    : "border-transparent"
                }`}
              >
                {day && (
                  <>
                    <div className="mb-1 flex justify-center sm:justify-start">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    {/* Mobile View: Dots */}
                    <div className="flex flex-wrap justify-center gap-1 sm:hidden">
                      {dayAds.map((ad) => (
                        <div
                          key={ad.id}
                          className={`h-1.5 w-1.5 rounded-full ${getTypeTone(ad.type).dot}`}
                        />
                      ))}
                    </div>
                    {/* Desktop View: Text badges */}
                    <div className="hidden space-y-1 sm:block">
                      {dayAds.slice(0, 3).map((ad) => {
                        const tone = getTypeTone(ad.type)
                        return (
                          <div
                            key={ad.id}
                            className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tone.badge}`}
                            title={ad.positionName}
                          >
                            {ad.positionName}
                          </div>
                        )
                      })}
                      {dayAds.length > 3 && (
                        <div className="pl-1 text-[10px] font-medium text-muted-foreground">
                          +{dayAds.length - 3} további
                        </div>
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
            <div className="h-3 w-3 rounded bg-[#a78bfa]" />
            <span className="text-xs text-muted-foreground">Kampány</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[#38bdf8]" />
            <span className="text-xs text-muted-foreground">Post</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[#f59e0b]" />
            <span className="text-xs text-muted-foreground">Kiemelt post</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>
                    {selectedDate && selectedDate.toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long"
                    })}
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
                {selectedDayAds.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Nincs aktív hirdetés ezen a napon.
                    </div>
                ) : (
                    <div className="space-y-3 pt-2">
                        {selectedDayAds.map(ad => (
                            <div key={ad.id} className="rounded-lg border border-border bg-background p-3">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-foreground">{ad.positionName}</h4>
                                    <Badge variant="outline" className={getTypeTone(ad.type).badge}>
                                        {ad.type}
                                    </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">Partner:</span>
                                        {ad.partner?.name} ({ad.partner?.office})
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">Időszak:</span>
                                        {new Date(ad.startDate).toLocaleDateString("hu-HU")} - {new Date(ad.endDate).toLocaleDateString("hu-HU")}
                                    </div>
                                    <div className="mt-2 text-xs">
                                        {ad.adContent.substring(0, 100)}...
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  )
}
