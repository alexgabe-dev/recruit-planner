import 'dotenv/config'
import { initializeDatabase, getDatabase } from '../lib/db'
import { initializeSampleData } from '../lib/db-init'

async function main() {
  try {
    console.log('🚀 Initializing database...')
    
    // Initialize database schema
    initializeDatabase()
    console.log('✅ Database schema created')
    
    // Initialize sample data only when enabled
    const shouldSeed = process.env.SEED_SAMPLE_DATA === 'true'
    if (shouldSeed) {
      initializeSampleData()
      console.log('✅ Sample data loaded')
    } else {
      console.log('⏭️ Sample data seeding disabled (SEED_SAMPLE_DATA!=true)')
    }
    
    // Get database stats
    const db = getDatabase()
    const partnerCount = db.prepare('SELECT COUNT(*) as count FROM partners').get() as { count: number }
    const adCount = db.prepare('SELECT COUNT(*) as count FROM ads').get() as { count: number }
    
    console.log(`📊 Database ready with ${partnerCount.count} partners and ${adCount.count} ads`)
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
