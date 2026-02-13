// Types for the recruitment ad management system

export interface Partner {
  id: number
  name: string
  office: string
  userId?: number
}

export interface Ad {
  id: number
  positionName: string
  adContent: string
  type: "kampány" | "post" | "kiemelt post" | "Profession"
  businessArea: "Kölcsönzés" | "Közvetítés"
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  partnerId: number
  userId?: number
  partner?: Partner
}

export type AdStatus = "Időzített" | "Aktív" | "Lejárt"

export function getAdStatus(ad: Ad): AdStatus {
  const now = new Date()
  const start = new Date(ad.startDate)
  const end = new Date(ad.endDate)

  if (now < start) return "Időzített"
  if (now > end) return "Lejárt"
  return "Aktív"
}

export interface DashboardStats {
  activeAds: number
  scheduledToday: number
  endingSoon: number
  totalPartners: number
}
