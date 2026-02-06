import { getDatabase, initializeDatabase, createPartner, createAd, createUser, updateUser } from './db'
import { addDays } from 'date-fns/addDays'

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
  } else {
    console.log('Initializing database with sample data...')

    // Create users FIRST to satisfy foreign keys
    const adminUser = initializeSampleUsers()

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

    // Use dynamic admin ID or fallback to 1 if initialization skipped (though we are in 'else' block)
    const adminId = adminUser ? adminUser.id : 1
    const createdPartners = partners.map(partner => createPartner(partner, adminId))

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

    ads.forEach(ad => createAd(ad, adminId)) // Assign to dynamic admin user
  }

  console.log('Database initialization completed successfully!')
}

function initializeSampleUsers() {
  const database = getDatabase()

  // Check if users already exist
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  console.log('Creating sample users...')

  // Bcrypt hash for "password123"
  // Generated with: require('bcryptjs').hashSync('password123', 10)
  const passwordHash = '$2b$10$qir/H8HqOPKAtvFSApJ.jOUpU513wSkN7p2VoOWmYrCgde2YhVHBG'

  // Admin User
  const admin = createUser('admin', passwordHash)
  updateUser(admin.id, { role: 'admin', status: 'active' })
  // We need to set email manually since createUser in db.ts doesn't take email/role
  database.prepare("UPDATE users SET email = 'admin@example.com', display_name = 'Admin User' WHERE id = ?").run(admin.id)

  // User 1
  const user = createUser('user', passwordHash)
  updateUser(user.id, { role: 'user', status: 'active' })
  database.prepare("UPDATE users SET email = 'user@example.com', display_name = 'Test User' WHERE id = ?").run(user.id)

  console.log('✅ Sample users created:')
  console.log('   👤 admin / password123')
  console.log('   👤 user  / password123')

  return admin
}