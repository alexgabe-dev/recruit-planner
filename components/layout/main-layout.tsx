"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLoadData } from "@/lib/db-store"
import { Clock as ClockIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const isLoadingData = useLoadData()
  const { setTheme } = useTheme()
  const { setLocale } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (data?.themePreference === "light" || data?.themePreference === "dark") {
          setTheme(data.themePreference)
        }
        if (data?.localePreference === "hu" || data?.localePreference === "en") {
          setLocale(data.localePreference)
        }
      } catch {}
    })()
  }, [setTheme, setLocale])

  if (!mounted || isLoadingData) {
    return (
      <div className="korvo-grid flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="korvo-shell min-h-screen bg-background">
      <Sidebar />
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-[0_1px_0_rgb(255_255_255/0.02)]">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {now.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {now.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" })}
            </span>
          </div>
        </div>,
        document.body
      )}
      <main className="transition-[padding-left] duration-300" style={{ paddingLeft: "var(--sidebar-width, 18rem)" }}>
        <div className="min-h-screen px-5 py-8 md:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  )
}
