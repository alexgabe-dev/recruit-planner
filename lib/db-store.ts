"use client"

import { create } from "zustand"
import { useEffect, useState } from "react"
import type { Partner, Ad, DashboardStats } from "./types"

interface Store {
  partners: Partner[]
  ads: Ad[]
  isLoading: boolean
  error: string | null
  
  loadData: () => Promise<void>
  addPartner: (partner: Omit<Partner, "id">) => Promise<void>
  updatePartner: (id: number, partner: Partial<Partner>) => Promise<void>
  deletePartner: (id: number) => Promise<void>
  addAd: (ad: Omit<Ad, "id" | "createdAt">) => Promise<void>
  updateAd: (id: number, ad: Partial<Ad>) => Promise<void>
  deleteAd: (id: number) => Promise<void>
  getDashboardStats: () => Promise<DashboardStats>
}

export const useStore = create<Store>()((set) => ({
  partners: [],
  ads: [],
  isLoading: true,
  error: null,

  loadData: async () => {
    try {
      set({ isLoading: true, error: null })
      const res = await fetch("/api/data")
      if (!res.ok) throw new Error("Failed to fetch data")
      const data = await res.json()
      set({ partners: data.partners, ads: data.ads, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addPartner: async (partner) => {
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner),
      })
      if (!res.ok) throw new Error("Failed to create partner")
      const newPartner = await res.json()
      set((state) => ({ partners: [...state.partners, newPartner] }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  updatePartner: async (id, partner) => {
    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner),
      })
      if (!res.ok) throw new Error("Failed to update partner")
      const updated = await res.json()
      set((state) => ({
        partners: state.partners.map((p) => (p.id === id ? updated : p)),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  deletePartner: async (id) => {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete partner")
      set((state) => ({
        partners: state.partners.filter((p) => p.id !== id),
        ads: state.ads.filter((a) => a.partnerId !== id),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  addAd: async (ad) => {
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ad),
      })
      if (!res.ok) throw new Error("Failed to create ad")
      const created = await res.json()
      set((state) => ({ ads: [created, ...state.ads] }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  updateAd: async (id, ad) => {
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ad),
      })
      if (!res.ok) throw new Error("Failed to update ad")
      const updated = await res.json()
      set((state) => ({
        ads: state.ads.map((a) => (a.id === id ? updated : a)),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  deleteAd: async (id) => {
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete ad")
      set((state) => ({ ads: state.ads.filter((a) => a.id !== id) }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  getDashboardStats: async () => {
    try {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return (await res.json()) as DashboardStats
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
}))

export function useLoadData() {
  const loadData = useStore((s) => s.loadData)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    loadData().finally(() => setIsLoading(false))
  }, [loadData])
  return isLoading
}
