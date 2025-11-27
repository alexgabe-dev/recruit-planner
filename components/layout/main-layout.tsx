"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { useEffect, useState } from "react"
import { useLoadData } from "@/lib/db-store"
import { Clock as ClockIcon } from "lucide-react"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const isLoadingData = useLoadData()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!mounted || isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 shadow-sm backdrop-blur">
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {now.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-xs text-muted-foreground">
          {now.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" })}
        </span>
      </div>
      <main className="pl-16 transition-all duration-300 lg:pl-64">
        <div className="min-h-screen p-6">{children}</div>
      </main>
    </div>
  )
}
