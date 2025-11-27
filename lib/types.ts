// Types for the recruitment ad management system

export interface Partner {
  id: number
  name: string
  office: string
}

export interface Ad {
  id: number
  positionName: string
  adContent: string
  type: "kampány" | "post" | "kiemelt post"
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  partnerId: number
  partner?: Partner
}

export type AdStatus = "Tervezett" | "Aktív" | "Lezárt"

export function getAdStatus(ad: Ad): AdStatus {
  const now = new Date()
  const start = new Date(ad.startDate)
  const end = new Date(ad.endDate)

  if (now < start) return "Tervezett"
  if (now > end) return "Lezárt"
  return "Aktív"
}

export interface DashboardStats {
  activeAds: number
  scheduledToday: number
  endingSoon: number
  totalPartners: number
}
