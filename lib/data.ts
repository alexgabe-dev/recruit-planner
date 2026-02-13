import type { Partner, Ad } from "./types"

// Mock data for the recruitment ad management system
export const partners: Partner[] = [
  { id: 1, name: "Bárdi Autó", office: "Budapest" },
  { id: 2, name: "Bárdi Autó", office: "Tatabánya" },
  { id: 3, name: "Tech Solutions Kft.", office: "Debrecen" },
  { id: 4, name: "LogiTrans Zrt.", office: "Győr" },
  { id: 5, name: "MediCare Bt.", office: "Szeged" },
  { id: 6, name: "BuildPro Kft.", office: "Pécs" },
  { id: 7, name: "FoodService Zrt.", office: "Miskolc" },
  { id: 8, name: "AutoParts Hungary", office: "Budapest" },
]

const today = new Date()
const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const ads: Ad[] = [
  {
    id: 1,
    positionName: "Raktári operátor",
    adContent: "Csatlakozz dinamikus csapatunkhoz!",
    type: "kampány",
    businessArea: "Kölcsönzés",
    startDate: addDays(today, -10),
    endDate: addDays(today, 20),
    isActive: true,
    createdAt: addDays(today, -15),
    partnerId: 1,
  },
  {
    id: 2,
    positionName: "Targoncás",
    adContent: "Versenyképes fizetés, stabil munkahely",
    type: "post",
    businessArea: "Kölcsönzés",
    startDate: addDays(today, -5),
    endDate: addDays(today, 10),
    isActive: true,
    createdAt: addDays(today, -7),
    partnerId: 1,
  },
  {
    id: 3,
    positionName: "Szoftver fejlesztő",
    adContent: "Remote munka lehetőség, modern technológiák",
    type: "kiemelt post",
    businessArea: "Közvetítés",
    startDate: addDays(today, 0),
    endDate: addDays(today, 30),
    isActive: true,
    createdAt: addDays(today, -2),
    partnerId: 3,
  },
  {
    id: 4,
    positionName: "Gépkocsivezető",
    adContent: "Nemzetközi fuvarozás, kiváló kondíciók",
    type: "kampány",
    businessArea: "Kölcsönzés",
    startDate: addDays(today, -20),
    endDate: addDays(today, -5),
    isActive: false,
    createdAt: addDays(today, -25),
    partnerId: 4,
  },
  {
    id: 5,
    positionName: "Ápoló",
    adContent: "Segíts másokon, légy a csapat része",
    type: "post",
    businessArea: "Közvetítés",
    startDate: addDays(today, 5),
    endDate: addDays(today, 35),
    isActive: true,
    createdAt: addDays(today, -1),
    partnerId: 5,
  },
  {
    id: 6,
    positionName: "Építőipari szakmunkás",
    adContent: "Folyamatos projektek, jó fizetés",
    type: "kiemelt post",
    businessArea: "Kölcsönzés",
    startDate: addDays(today, -3),
    endDate: addDays(today, 2),
    isActive: true,
    createdAt: addDays(today, -5),
    partnerId: 6,
  },
  {
    id: 7,
    positionName: "Szakács",
    adContent: "Kreativitás a konyhában",
    type: "post",
    businessArea: "Közvetítés",
    startDate: addDays(today, 10),
    endDate: addDays(today, 40),
    isActive: true,
    createdAt: addDays(today, 0),
    partnerId: 7,
  },
  {
    id: 8,
    positionName: "Autószerelő",
    adContent: "Tapasztalt szakembereket keresünk",
    type: "kampány",
    businessArea: "Kölcsönzés",
    startDate: addDays(today, -7),
    endDate: addDays(today, 14),
    isActive: true,
    createdAt: addDays(today, -10),
    partnerId: 8,
  },
  {
    id: 9,
    positionName: "Ügyfélszolgálati munkatárs",
    adContent: "Kommunikálj velünk!",
    type: "post",
    businessArea: "Közvetítés",
    startDate: addDays(today, -1),
    endDate: addDays(today, 0),
    isActive: true,
    createdAt: addDays(today, -3),
    partnerId: 2,
  },
  {
    id: 10,
    positionName: "HR asszisztens",
    adContent: "Fejlődj a HR területen",
    type: "kiemelt post",
    businessArea: "Közvetítés",
    startDate: addDays(today, 3),
    endDate: addDays(today, 33),
    isActive: true,
    createdAt: addDays(today, 0),
    partnerId: 3,
  },
]

// Helper to get ads with partner data
export function getAdsWithPartners(): (Ad & { partner: Partner })[] {
  return ads.map((ad) => ({
    ...ad,
    partner: partners.find((p) => p.id === ad.partnerId)!,
  }))
}
