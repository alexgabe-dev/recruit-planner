import { getDatabase, initializeDatabase, createPartner, createAd } from './db'
import { addDays } from 'date-fns'

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function initializeSampleData() {
  const database = getDatabase()
  
  // Check if we already have data
  const partnerCount = database.prepare('SELECT COUNT(*) as count FROM partners').get() as { count: number }
  
  if (partnerCount.count > 0) {
    console.log('Database already contains data, skipping initialization')
    return
  }
  
  console.log('Initializing database with sample data...')
  
  // Create sample partners
  const partners = [
    { name: "Bárdi Autó", office: "Budapest" },
    { name: "Bárdi Autó", office: "Tatabánya" },
    { name: "Tech Solutions Kft.", office: "Debrecen" },
    { name: "LogiTrans Zrt.", office: "Győr" },
    { name: "MediCare Bt.", office: "Szeged" },
    { name: "BuildPro Kft.", office: "Pécs" },
    { name: "FoodService Zrt.", office: "Miskolc" },
    { name: "AutoParts Hungary", office: "Budapest" },
  ]
  
  const createdPartners = partners.map(partner => createPartner(partner))
  
  // Create sample ads
  const today = new Date()
  const ads = [
    {
      positionName: "Raktári operátor",
      adContent: "Csatlakozz dinamikus csapatunkhoz!",
      type: "kampány" as const,
      startDate: addDaysToDate(today, -10),
      endDate: addDaysToDate(today, 20),
      isActive: true,
      partnerId: createdPartners[0].id,
    },
    {
      positionName: "Targoncás",
      adContent: "Versenyképes fizetés, stabil munkahely",
      type: "post" as const,
      startDate: addDaysToDate(today, -5),
      endDate: addDaysToDate(today, 10),
      isActive: true,
      partnerId: createdPartners[0].id,
    },
    {
      positionName: "Szoftver fejlesztő",
      adContent: "Remote munka lehetőség, modern technológiák",
      type: "kiemelt post" as const,
      startDate: addDaysToDate(today, 0),
      endDate: addDaysToDate(today, 30),
      isActive: true,
      partnerId: createdPartners[2].id,
    },
    {
      positionName: "Gépkocsivezető",
      adContent: "Nemzetközi fuvarozás, kiváló kondíciók",
      type: "kampány" as const,
      startDate: addDaysToDate(today, -20),
      endDate: addDaysToDate(today, -5),
      isActive: false,
      partnerId: createdPartners[3].id,
    },
    {
      positionName: "Ápoló",
      adContent: "Segíts másokon, légy a csapat része",
      type: "post" as const,
      startDate: addDaysToDate(today, 5),
      endDate: addDaysToDate(today, 35),
      isActive: true,
      partnerId: createdPartners[4].id,
    },
    {
      positionName: "Építőipari szakmunkás",
      adContent: "Folyamatos projektek, jó fizetés",
      type: "kiemelt post" as const,
      startDate: addDaysToDate(today, -3),
      endDate: addDaysToDate(today, 2),
      isActive: true,
      partnerId: createdPartners[5].id,
    },
    {
      positionName: "Szakács",
      adContent: "Kreativitás a konyhában",
      type: "post" as const,
      startDate: addDaysToDate(today, 10),
      endDate: addDaysToDate(today, 40),
      isActive: true,
      partnerId: createdPartners[6].id,
    },
    {
      positionName: "Autószerelő",
      adContent: "Tapasztalt szakembereket keresünk",
      type: "kampány" as const,
      startDate: addDaysToDate(today, -7),
      endDate: addDaysToDate(today, 14),
      isActive: true,
      partnerId: createdPartners[7].id,
    },
    {
      positionName: "Ügyfélszolgálati munkatárs",
      adContent: "Kommunikálj velünk!",
      type: "post" as const,
      startDate: addDaysToDate(today, -1),
      endDate: addDaysToDate(today, 0),
      isActive: true,
      partnerId: createdPartners[1].id,
    },
    {
      positionName: "HR asszisztens",
      adContent: "Fejlődj a HR területen",
      type: "kiemelt post" as const,
      startDate: addDaysToDate(today, 3),
      endDate: addDaysToDate(today, 33),
      isActive: true,
      partnerId: createdPartners[2].id,
    },
  ]
  
  ads.forEach(ad => createAd(ad))
  
  console.log('Database initialization completed successfully!')
}