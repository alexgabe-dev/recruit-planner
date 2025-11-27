import Database from 'better-sqlite3'
import path from 'path'
import { Partner, Ad } from './types'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite')
    db = new Database(dbPath)
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    
    // Create tables if they don't exist
    initializeDatabase()
  }
  
  return db
}

export function initializeDatabase() {
  const database = getDatabase()
  
  // Create partners table
  database.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      office TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create ads table
  database.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_name TEXT NOT NULL,
      ad_content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('kampány', 'post', 'kiemelt post')),
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      partner_id INTEGER NOT NULL,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    )
  `)
  
  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_ads_partner_id ON ads(partner_id);
    CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
  `)

  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// Partner operations
export function getAllPartners(): Partner[] {
  const database = getDatabase()
  const stmt = database.prepare('SELECT * FROM partners ORDER BY name, office')
  return stmt.all() as Partner[]
}

export function getPartnerById(id: number): Partner | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT * FROM partners WHERE id = ?')
  return stmt.get(id) as Partner | null
}

export function createPartner(partner: Omit<Partner, 'id'>): Partner {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO partners (name, office) VALUES (?, ?)
  `)
  const result = stmt.run(partner.name, partner.office)
  
  return {
    id: result.lastInsertRowid as number,
    ...partner
  }
}

export function updatePartner(id: number, partner: Partial<Omit<Partner, 'id'>>): Partner | null {
  const database = getDatabase()
  const fields = Object.keys(partner).map(key => `${key} = ?`).join(', ')
  const values = Object.values(partner)
  
  const stmt = database.prepare(`
    UPDATE partners SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  stmt.run(...values, id)
  
  return getPartnerById(id)
}

export function deletePartner(id: number): boolean {
  const database = getDatabase()
  const stmt = database.prepare('DELETE FROM partners WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Ad operations
export function getAllAds(): (Ad & { partner: Partner })[] {
  const database = getDatabase()
  const stmt = database.prepare(`
    SELECT a.*, p.name as partner_name, p.office as partner_office
    FROM ads a
    JOIN partners p ON a.partner_id = p.id
    ORDER BY a.created_at DESC
  `)
  const rows = stmt.all() as any[]
  
  return rows.map(row => ({
    id: row.id,
    positionName: row.position_name,
    adContent: row.ad_content,
    type: row.type,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    partnerId: row.partner_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      office: row.partner_office
    }
  }))
}

export function getAdById(id: number): (Ad & { partner: Partner }) | null {
  const database = getDatabase()
  const stmt = database.prepare(`
    SELECT a.*, p.name as partner_name, p.office as partner_office
    FROM ads a
    JOIN partners p ON a.partner_id = p.id
    WHERE a.id = ?
  `)
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return {
    id: row.id,
    positionName: row.position_name,
    adContent: row.ad_content,
    type: row.type,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    partnerId: row.partner_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      office: row.partner_office
    }
  }
}

export function createAd(ad: Omit<Ad, 'id' | 'createdAt'>): Ad {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO ads (position_name, ad_content, type, start_date, end_date, is_active, partner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    ad.positionName,
    ad.adContent,
    ad.type,
    ad.startDate.toISOString(),
    ad.endDate.toISOString(),
    ad.isActive ? 1 : 0,
    ad.partnerId
  )
  
  const createdAd = getAdById(result.lastInsertRowid as number)
  if (!createdAd) throw new Error('Failed to create ad')
  return createdAd
}

export function updateAd(id: number, ad: Partial<Omit<Ad, 'id' | 'createdAt'>>): (Ad & { partner: Partner }) | null {
  const database = getDatabase()
  const fields = Object.keys(ad).map(key => {
    if (key === 'positionName') return 'position_name = ?'
    if (key === 'adContent') return 'ad_content = ?'
    if (key === 'startDate') return 'start_date = ?'
    if (key === 'endDate') return 'end_date = ?'
    if (key === 'isActive') return 'is_active = ?'
    if (key === 'partnerId') return 'partner_id = ?'
    return `${key} = ?`
  }).join(', ')
  
  const values = Object.entries(ad).map(([key, value]) => {
    if (key === 'startDate' || key === 'endDate') {
      return (value as Date).toISOString()
    }
    if (key === 'isActive') {
      return (value as boolean) ? 1 : 0
    }
    return value
  })
  
  const stmt = database.prepare(`
    UPDATE ads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  stmt.run(...values, id)
  
  return getAdById(id)
}

export function deleteAd(id: number): boolean {
  const database = getDatabase()
  const stmt = database.prepare('DELETE FROM ads WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Dashboard statistics
export function getDashboardStats() {
  const database = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const activeAdsStmt = database.prepare(`
    SELECT COUNT(*) as count FROM ads 
    WHERE is_active = 1 AND start_date <= ? AND end_date >= ?
  `)
  const activeAds = activeAdsStmt.get(today, today) as { count: number }
  
  const scheduledTodayStmt = database.prepare(`
    SELECT COUNT(*) as count FROM ads 
    WHERE start_date >= ? AND start_date < ?
  `)
  const scheduledToday = scheduledTodayStmt.get(today, tomorrow) as { count: number }
  
  const endingSoonStmt = database.prepare(`
    SELECT COUNT(*) as count FROM ads 
    WHERE end_date >= ? AND end_date <= ? AND is_active = 1
  `)
  const endingSoon = endingSoonStmt.get(today, sevenDaysLater) as { count: number }
  
  const totalPartnersStmt = database.prepare('SELECT COUNT(*) as count FROM partners')
  const totalPartners = totalPartnersStmt.get() as { count: number }
  
  return {
    activeAds: activeAds.count,
    scheduledToday: scheduledToday.count,
    endingSoon: endingSoon.count,
    totalPartners: totalPartners.count
  }
}

// User operations
export interface User {
  id: number
  username: string
  hashed_password: string
}

export function getUserByUsername(username: string): User | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT id, username, hashed_password FROM users WHERE username = ?')
  const row = stmt.get(username) as User | undefined
  return row ?? null
}

export function createUser(username: string, hashedPassword: string): User {
  const database = getDatabase()
  const stmt = database.prepare('INSERT INTO users (username, hashed_password) VALUES (?, ?)')
  const result = stmt.run(username, hashedPassword)
  return {
    id: result.lastInsertRowid as number,
    username,
    hashed_password: hashedPassword,
  }
}
