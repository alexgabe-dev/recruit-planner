import type { Partner, Ad, DashboardStats } from "./types"
import { 
  getAllPartners as getPartnersFromDb,
  getAllAds as getAdsFromDb,
  createPartner as createPartnerInDb,
  updatePartner as updatePartnerInDb,
  deletePartner as deletePartnerInDb,
  createAd as createAdInDb,
  updateAd as updateAdInDb,
  deleteAd as deleteAdInDb,
  getDashboardStats as getStatsFromDb
} from "./db"

// Server-side data fetching functions
export async function getPartners() {
  return await getPartnersFromDb()
}

export async function getAds() {
  return await getAdsFromDb()
}

export async function createPartner(partner: Omit<Partner, "id">) {
  return await createPartnerInDb(partner)
}

export async function updatePartner(id: number, partner: Partial<Partner>) {
  return await updatePartnerInDb(id, partner)
}

export async function deletePartner(id: number) {
  return await deletePartnerInDb(id)
}

export async function createAd(ad: Omit<Ad, "id" | "createdAt">) {
  return await createAdInDb(ad)
}

export async function updateAd(id: number, ad: Partial<Ad>) {
  return await updateAdInDb(id, ad)
}

export async function deleteAd(id: number) {
  return await deleteAdInDb(id)
}

export async function getDashboardStats() {
  return await getStatsFromDb()
}