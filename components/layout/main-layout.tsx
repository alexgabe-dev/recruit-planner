"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { useEffect, useState } from "react"
import { useLoadData } from "@/lib/db-store"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const isLoadingData = useLoadData()

  useEffect(() => {
    setMounted(true)
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
      <main className="pl-16 transition-all duration-300 lg:pl-64">
        <div className="min-h-screen p-6">{children}</div>
      </main>
    </div>
  )
}
