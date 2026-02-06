import Database from 'better-sqlite3'
import path from 'path'
import { Partner, Ad } from './types'

let db: Database.Database | null = null
const globalForDb = globalThis as unknown as { __recruit_db?: Database.Database }

export function getDatabase(): Database.Database {
  if (!db) {
    // Singleton across HMR/route reloads
    if (!globalForDb.__recruit_db) {
      let dbPath: string;

      // Force local database for seeded development environment
      if (process.env.NODE_ENV === 'development' && process.env.SEED_SAMPLE_DATA === 'true') {
        console.warn('⚠️  [DB] Forcing local database because NODE_ENV=development and SEED_SAMPLE_DATA=true')
        dbPath = path.join(process.cwd(), 'database.sqlite')
      } else {
        const defaultPath = path.join(process.cwd(), 'database.sqlite')
        dbPath = process.env.DATABASE_PATH || defaultPath

        // Fix for Windows development using Linux paths in .env (only if not forced above)
        if (process.platform === 'win32' && dbPath.startsWith('/') && !dbPath.match(/^[a-zA-Z]:/)) {
          console.warn('⚠️  [DB] Custom logic: Detected Windows environment with Linux-style path in .env')
          console.warn(`⚠️  [DB] Ignoring DATABASE_PATH="${dbPath}" and falling back to default: "${defaultPath}"`)
          dbPath = defaultPath
        }
      }

      console.log('----------------------------------------')
      console.log('[DB] Initializing database connection')
      console.log('[DB] Target Path:', dbPath)
      console.log('[DB] Resolved Path:', path.resolve(dbPath))
      console.log('[DB] CWD:', process.cwd())
      console.log('----------------------------------------')
      globalForDb.__recruit_db = new Database(dbPath)
      // Enable foreign keys
      globalForDb.__recruit_db.pragma('foreign_keys = ON')
      // Create tables if they don't exist
      db = globalForDb.__recruit_db
      initializeDatabase()
    }
    db = globalForDb.__recruit_db!
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
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create ads table
  database.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_name TEXT NOT NULL,
      ad_content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('kampány', 'post', 'kiemelt post', 'Profession')),
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      partner_id INTEGER NOT NULL,
      user_id INTEGER,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for better performance (basic indexes that don't depend on migrations)
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
      email TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'pending',
      approval_token TEXT,
      reset_token TEXT,
      reset_expires DATETIME,
      display_name TEXT,
      avatar_url TEXT,
      last_seen DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create system settings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Create activity logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  // Create invites table
  database.exec(`
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      expires_at DATETIME,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Ensure new columns exist on older databases
  const columns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  const have = new Set(columns.map((c) => c.name))
  if (!have.has('email')) database.exec("ALTER TABLE users ADD COLUMN email TEXT")
  if (!have.has('role')) database.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
  if (!have.has('status')) database.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'")
  if (!have.has('approval_token')) database.exec("ALTER TABLE users ADD COLUMN approval_token TEXT")
  if (!have.has('reset_token')) database.exec("ALTER TABLE users ADD COLUMN reset_token TEXT")
  if (!have.has('reset_expires')) database.exec("ALTER TABLE users ADD COLUMN reset_expires DATETIME")
  if (!have.has('display_name')) database.exec("ALTER TABLE users ADD COLUMN display_name TEXT")
  if (!have.has('avatar_url')) database.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT")
  if (!have.has('last_seen')) database.exec("ALTER TABLE users ADD COLUMN last_seen DATETIME")
  const partnerCols = database.prepare("PRAGMA table_info(partners)").all() as { name: string }[]
  const havePartner = new Set(partnerCols.map((c) => c.name))
  if (!havePartner.has('user_id')) database.exec('ALTER TABLE partners ADD COLUMN user_id INTEGER')
  const adCols = database.prepare("PRAGMA table_info(ads)").all() as { name: string }[]
  const haveAds = new Set(adCols.map((c) => c.name))
  if (!haveAds.has('user_id')) database.exec('ALTER TABLE ads ADD COLUMN user_id INTEGER')

  // Create indexes that depend on migrated columns
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
    CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
  `)

  // Migration for 'Profession' type in ads table
  const adsTableDef = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='ads'").get() as { sql: string }
  if (adsTableDef && !adsTableDef.sql.includes("'Profession'")) {
    console.log('Migrating ads table to include Profession type...')
    const transaction = database.transaction(() => {
      database.exec("ALTER TABLE ads RENAME TO ads_old")
      database.exec(`
        CREATE TABLE ads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          position_name TEXT NOT NULL,
          ad_content TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('kampány', 'post', 'kiemelt post', 'Profession')),
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          partner_id INTEGER NOT NULL,
          user_id INTEGER,
          FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      // We use explicit columns to ensure safety even if column order differed
      database.exec(`
        INSERT INTO ads (id, position_name, ad_content, type, start_date, end_date, is_active, created_at, updated_at, partner_id, user_id)
        SELECT id, position_name, ad_content, type, start_date, end_date, is_active, created_at, updated_at, partner_id, user_id 
        FROM ads_old
      `)
      database.exec("DROP TABLE ads_old")

      // Recreate indexes
      database.exec("CREATE INDEX IF NOT EXISTS idx_ads_partner_id ON ads(partner_id)")
      database.exec("CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date)")
      database.exec("CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active)")
      database.exec("CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id)")
    })
    transaction()
    console.log('Ads table migration completed.')
  }
}

// Partner operations
export function getAllPartners(userId?: number): Partner[] {
  const database = getDatabase()
  // Now returns ALL partners, regardless of user
  const stmt = database.prepare('SELECT * FROM partners ORDER BY name, office')
  return stmt.all() as Partner[]
}

export function getPartnerById(id: number): Partner | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT * FROM partners WHERE id = ?')
  return stmt.get(id) as Partner | null
}

export function createPartner(partner: Omit<Partner, 'id'>, userId: number): Partner {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO partners (name, office, user_id) VALUES (?, ?, ?)
  `)
  const result = stmt.run(partner.name, partner.office, userId)

  return {
    id: result.lastInsertRowid as number,
    ...partner,
    userId
  }
}

export function updatePartner(id: number, partner: Partial<Omit<Partner, 'id'>>, userId?: number): Partner | null {
  const database = getDatabase()
  const fields = Object.keys(partner).map(key => `${key} = ?`).join(', ')
  const values = Object.values(partner)

  let stmt;
  if (userId) {
    stmt = database.prepare(`
      UPDATE partners SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?
    `)
    stmt.run(...values, id, userId)
  } else {
    // Admin mode or no user check
    stmt = database.prepare(`
      UPDATE partners SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    stmt.run(...values, id)
  }

  return getPartnerById(id)
}

export function deletePartner(id: number, userId?: number): boolean {
  const database = getDatabase()
  let result;
  if (userId) {
    const stmt = database.prepare('DELETE FROM partners WHERE id = ? AND user_id = ?')
    result = stmt.run(id, userId)
  } else {
    const stmt = database.prepare('DELETE FROM partners WHERE id = ?')
    result = stmt.run(id)
  }
  return result.changes > 0
}

// Ad operations
export function getAllAds(userId?: number): (Ad & { partner: Partner })[] {
  const database = getDatabase()
  // Now returns ALL ads, regardless of user
  const stmt = database.prepare(`
    SELECT a.*, p.name as partner_name, p.office as partner_office, p.user_id as partner_user_id
    FROM ads a
    JOIN partners p ON a.partner_id = p.id
    ORDER BY a.is_active DESC, a.start_date ASC
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
    userId: row.user_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      office: row.partner_office,
      userId: row.partner_user_id
    }
  }))
}

export function getAdById(id: number): (Ad & { partner: Partner }) | null {
  const database = getDatabase()
  const stmt = database.prepare(`
    SELECT a.*, p.name as partner_name, p.office as partner_office, p.user_id as partner_user_id
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
    userId: row.user_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      office: row.partner_office,
      userId: row.partner_user_id
    }
  }
}

export function createAd(ad: Omit<Ad, 'id' | 'createdAt'>, userId: number): Ad {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO ads (position_name, ad_content, type, start_date, end_date, is_active, partner_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    ad.positionName,
    ad.adContent,
    ad.type,
    ad.startDate.toISOString(),
    ad.endDate.toISOString(),
    ad.isActive ? 1 : 0,
    ad.partnerId,
    userId
  )

  const createdAd = getAdById(result.lastInsertRowid as number)
  if (!createdAd) throw new Error('Failed to create ad')
  return createdAd
}

export function updateAd(id: number, ad: Partial<Omit<Ad, 'id' | 'createdAt'>>, userId?: number): (Ad & { partner: Partner }) | null {
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

  if (userId) {
    const stmt = database.prepare(`
      UPDATE ads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?
    `)
    stmt.run(...values, id, userId)
  } else {
    const stmt = database.prepare(`
      UPDATE ads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    stmt.run(...values, id)
  }

  return getAdById(id)
}

export function deleteAd(id: number, userId?: number): boolean {
  const database = getDatabase()
  console.log('[DB] Attempting to delete ad:', id)

  let result;
  if (userId) {
    const stmt = database.prepare('DELETE FROM ads WHERE id = ? AND user_id = ?')
    result = stmt.run(id, userId)
  } else {
    const stmt = database.prepare('DELETE FROM ads WHERE id = ?')
    result = stmt.run(id)
  }
  console.log('[DB] Delete result:', result)
  return result.changes > 0
}

// Dashboard statistics
export function getDashboardStats(userId?: number) {
  const database = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Stats should reflect what user sees.
  // If user sees everything, stats should probably be global?
  // But usually dashboard stats are personal. 
  // Requirement: "Admin sees everything... Users see everything but can only edit theirs"
  // So stats like "Active Ads" might be interesting to see globally or personally.
  // Let's keep it personal for now if userId is provided, but maybe we should expose global stats too.
  // Actually, if everyone sees everyone's ads, "Active Ads" count should probably be global.
  // But let's stick to existing logic for stats unless requested otherwise.

  const activeAdsQuery = userId
    ? `SELECT COUNT(*) as count FROM ads WHERE is_active = 1 AND start_date <= ? AND end_date >= ? AND user_id = ?`
    : `SELECT COUNT(*) as count FROM ads WHERE is_active = 1 AND start_date <= ? AND end_date >= ?`
  const activeAdsStmt = database.prepare(activeAdsQuery)
  const activeAds = userId ? (activeAdsStmt.get(today, today, userId) as { count: number }) : (activeAdsStmt.get(today, today) as { count: number })

  const scheduledTodayQuery = userId
    ? `SELECT COUNT(*) as count FROM ads WHERE start_date >= ? AND start_date < ? AND user_id = ?`
    : `SELECT COUNT(*) as count FROM ads WHERE start_date >= ? AND start_date < ?`
  const scheduledTodayStmt = database.prepare(scheduledTodayQuery)
  const scheduledToday = userId ? (scheduledTodayStmt.get(today, tomorrow, userId) as { count: number }) : (scheduledTodayStmt.get(today, tomorrow) as { count: number })

  const endingSoonQuery = userId
    ? `SELECT COUNT(*) as count FROM ads WHERE end_date >= ? AND end_date <= ? AND is_active = 1 AND user_id = ?`
    : `SELECT COUNT(*) as count FROM ads WHERE end_date >= ? AND end_date <= ? AND is_active = 1`
  const endingSoonStmt = database.prepare(endingSoonQuery)
  const endingSoon = userId ? (endingSoonStmt.get(today, sevenDaysLater, userId) as { count: number }) : (endingSoonStmt.get(today, sevenDaysLater) as { count: number })

  const totalPartnersQuery = userId
    ? 'SELECT COUNT(*) as count FROM partners WHERE user_id = ?'
    : 'SELECT COUNT(*) as count FROM partners'
  const totalPartnersStmt = database.prepare(totalPartnersQuery)
  const totalPartners = userId ? (totalPartnersStmt.get(userId) as { count: number }) : (totalPartnersStmt.get() as { count: number })

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
  email?: string | null
  role?: string | null
  status?: string | null
  approval_token?: string | null
  reset_token?: string | null
  reset_expires?: Date | null
  display_name?: string | null
  avatar_url?: string | null
  last_seen?: Date | null
}

export function getUserByUsername(username: string): User | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT id, username, hashed_password, email, role, status, display_name, avatar_url FROM users WHERE username = ?')
  const row = stmt.get(username) as User | undefined
  return row ?? null
}

export function getUserById(id: number): User | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT id, username, hashed_password, email, role, status, display_name, avatar_url FROM users WHERE id = ?')
  const row = stmt.get(id) as User | undefined
  return row ?? null
}

export function getUserByEmail(email: string): User | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT id, username, hashed_password, email, role, status FROM users WHERE email = ?')
  const row = stmt.get(email) as User | undefined
  return row ?? null
}

export function createUser(username: string, hashedPassword: string): User {
  const database = getDatabase()
  const stmt = database.prepare('INSERT INTO users (username, hashed_password, status) VALUES (?, ?, ?)')
  const result = stmt.run(username, hashedPassword, 'pending')
  return {
    id: result.lastInsertRowid as number,
    username,
    hashed_password: hashedPassword,
    email: null as any,
    role: 'user',
    status: 'pending',
  }
}

export function createPendingUser({ username, email, hashedPassword, approvalToken }: { username: string; email: string; hashedPassword: string; approvalToken: string }): User {
  const database = getDatabase()
  const stmt = database.prepare('INSERT INTO users (username, email, hashed_password, role, status, approval_token) VALUES (?, ?, ?, ?, ?, ?)')
  const result = stmt.run(username, email, hashedPassword, 'user', 'pending', approvalToken)
  return {
    id: result.lastInsertRowid as number,
    username,
    hashed_password: hashedPassword,
    email,
    role: 'user',
    status: 'pending',
    approval_token: approvalToken,
  }
}

export function approveUserByToken(token: string): User | null {
  const database = getDatabase()
  const user = database.prepare('SELECT id, username, email, role, status, display_name, avatar_url FROM users WHERE approval_token = ?').get(token) as User | undefined
  if (!user) return null
  database.prepare("UPDATE users SET status = 'active', approval_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(user.id)
  const updated = database.prepare('SELECT id, username, email, role, status, display_name, avatar_url FROM users WHERE id = ?').get(user.id) as User
  return updated
}

export function setResetTokenForUser(userId: number, token: string, expires: Date): void {
  const database = getDatabase()
  database.prepare('UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(token, expires.toISOString(), userId)
}

export function getUserByResetToken(token: string): User | null {
  const database = getDatabase()
  const row = database.prepare('SELECT id, username, email, role, reset_token, reset_expires, display_name, avatar_url FROM users WHERE reset_token = ?').get(token) as any
  return row ?? null
}

export function clearResetToken(userId: number): void {
  const database = getDatabase()
  database.prepare('UPDATE users SET reset_token = NULL, reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId)
}

export function setDisplayName(userId: number, displayName: string): void {
  const database = getDatabase()
  database.prepare('UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(displayName, userId)
}

export function setAvatarUrl(userId: number, url: string): void {
  const database = getDatabase()
  database.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(url, userId)
}

export function updateLastSeen(userId: number): void {
  const database = getDatabase()
  database.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(new Date().toISOString(), userId)
}

export function listUsers(): { id: number; username: string; display_name: string | null; role: string | null; last_seen: string | null; email: string | null; status: string | null }[] {
  const database = getDatabase()
  const rows = database.prepare('SELECT id, username, display_name, role, last_seen, email, status FROM users ORDER BY username').all() as any[]
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    display_name: r.display_name ?? null,
    role: r.role ?? 'user',
    last_seen: r.last_seen ?? null,
    email: r.email ?? null,
    status: r.status ?? 'pending'
  }))
}

export function updateUser(id: number, updates: { role?: string; status?: string }): boolean {
  const database = getDatabase()
  const sets: string[] = []
  const values: any[] = []

  if (updates.role) {
    sets.push('role = ?')
    values.push(updates.role)
  }
  if (updates.status) {
    sets.push('status = ?')
    values.push(updates.status)
  }

  if (sets.length === 0) return false

  sets.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  const query = `UPDATE users SET ${sets.join(', ')} WHERE id = ?`
  const result = database.prepare(query).run(...values)
  return result.changes > 0
}

export function deleteUser(id: number): boolean {
  const database = getDatabase()
  // First delete related data if necessary, or rely on foreign keys if configured (SQLite default often OFF)
  // For safety, let's delete sessions or related things if we had a separate session table, but we use JWT.
  // We might want to reassign ads/partners? For now, let's just delete the user.
  // Ads and Partners have user_id. We should probably keep them or reassign them.
  // Simple approach: Set user_id to NULL or delete them? 
  // Let's assume we just delete the user. If ads/partners require user_id, this might fail if FK constraints exist.
  // Checking schema... "user_id INTEGER" usually implies it can be whatever unless "FOREIGN KEY" is explicit.
  // Let's just run DELETE.
  const result = database.prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

// System Settings
export function getSystemSettings() {
  const database = getDatabase()
  const rows = database.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[]
  const settings: Record<string, any> = {}
  rows.forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  })
  return settings
}

export function saveSystemSettings(settings: Record<string, any>) {
  const database = getDatabase()
  const insert = database.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)')

  const transaction = database.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      insert.run(key, JSON.stringify(value))
    })
  })

  transaction()
}

export function getAllExpiringAds(days: number = 7, types: string[] = []) {
  const database = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let query = `
    SELECT a.*, p.name as partner_name, p.office as partner_office 
    FROM ads a
    JOIN partners p ON a.partner_id = p.id
    WHERE a.is_active = 1 
    AND a.end_date >= ? 
    AND a.end_date <= ?
  `

  if (types.length > 0) {
    const placeholders = types.map(() => '?').join(',')
    query += ` AND a.type IN (${placeholders})`
  }

  query += ` ORDER BY a.end_date ASC`

  const stmt = database.prepare(query)
  const args = [today, future, ...types]

  const rows = stmt.all(...args) as any[]

  return rows.map(row => ({
    id: row.id,
    positionName: row.position_name,
    type: row.type,
    endDate: new Date(row.end_date),
    partner: {
      name: row.partner_name,
      office: row.partner_office
    }
  }))
}

// Activity Logging
export function logActivity(userId: number | null, username: string, action: string, entityType: string, entityId?: number, details?: string) {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  stmt.run(userId, username, action, entityType, entityId, details)
}

export function getActivityLogs(limit = 100, offset = 0, filters?: {
  userId?: number,
  action?: string,
  entityType?: string,
  startDate?: string,
  endDate?: string,
  search?: string
}) {
  const database = getDatabase()
  let query = `SELECT * FROM activity_logs WHERE 1=1`
  const params: any[] = []

  if (filters?.userId) {
    query += ` AND user_id = ?`
    params.push(filters.userId)
  }
  if (filters?.action && filters.action !== 'all') {
    query += ` AND action = ?`
    params.push(filters.action)
  }
  if (filters?.entityType && filters.entityType !== 'all') {
    query += ` AND entity_type = ?`
    params.push(filters.entityType)
  }
  if (filters?.startDate) {
    query += ` AND created_at >= ?`
    params.push(filters.startDate)
  }
  if (filters?.endDate) {
    query += ` AND created_at <= ?`
    params.push(filters.endDate)
  }
  if (filters?.search) {
    query += ` AND details LIKE ?`
    params.push(`%${filters.search}%`)
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  return database.prepare(query).all(...params) as any[]
}

// Invite operations
export interface Invite {
  id: number
  token: string
  email: string
  role: string
  created_by: number
  created_at: string
  used_at: string | null
  expires_at: string
}

export function createInvite(email: string, role: string, createdBy: number, expiresInMinutes = 15): string {
  const database = getDatabase()
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()

  const stmt = database.prepare(`
    INSERT INTO invites (token, email, role, created_by, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(token, email, role, createdBy, expiresAt)
  return token
}

export function getInviteByToken(token: string): Invite | null {
  const database = getDatabase()
  // Use 'now' in single quotes for SQLite datetime function string literal
  // Also wrap expires_at in datetime() to ensure correct comparison with ISO strings
  const stmt = database.prepare("SELECT * FROM invites WHERE token = ? AND used_at IS NULL AND datetime(expires_at) > datetime('now')")
  const invite = stmt.get(token) as Invite | undefined
  return invite ?? null
}

export function markInviteUsed(token: string): void {
  const database = getDatabase()
  const stmt = database.prepare('UPDATE invites SET used_at = CURRENT_TIMESTAMP WHERE token = ?')
  stmt.run(token)
}
