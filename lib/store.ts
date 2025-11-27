"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Partner, Ad } from "./types"
import { partners as initialPartners, ads as initialAds } from "./data"

interface Store {
  partners: Partner[]
  ads: Ad[]
  addPartner: (partner: Omit<Partner, "id">) => void
  updatePartner: (id: number, partner: Partial<Partner>) => void
  deletePartner: (id: number) => void
  addAd: (ad: Omit<Ad, "id" | "createdAt">) => void
  updateAd: (id: number, ad: Partial<Ad>) => void
  deleteAd: (id: number) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      partners: initialPartners,
      ads: initialAds,
      addPartner: (partner) =>
        set((state) => ({
          partners: [...state.partners, { ...partner, id: Math.max(0, ...state.partners.map((p) => p.id)) + 1 }],
        })),
      updatePartner: (id, partner) =>
        set((state) => ({
          partners: state.partners.map((p) => (p.id === id ? { ...p, ...partner } : p)),
        })),
      deletePartner: (id) =>
        set((state) => ({
          partners: state.partners.filter((p) => p.id !== id),
          ads: state.ads.filter((a) => a.partnerId !== id),
        })),
      addAd: (ad) =>
        set((state) => ({
          ads: [
            ...state.ads,
            {
              ...ad,
              id: Math.max(0, ...state.ads.map((a) => a.id)) + 1,
              createdAt: new Date(),
            },
          ],
        })),
      updateAd: (id, ad) =>
        set((state) => ({
          ads: state.ads.map((a) => (a.id === id ? { ...a, ...ad } : a)),
        })),
      deleteAd: (id) =>
        set((state) => ({
          ads: state.ads.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "recruitment-ads-storage",
    },
  ),
)
