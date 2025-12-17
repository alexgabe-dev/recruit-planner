import { getDatabase } from "../lib/db"
import path from "path"
import fs from "fs"

function main() {
  // Check for command line argument for database path
  const args = process.argv.slice(2)
  if (args.length > 0) {
    const dbPath = args[0]
    if (fs.existsSync(dbPath)) {
      console.log(`Using database: ${dbPath}`)
      process.env.DATABASE_PATH = dbPath
    } else {
      console.error(`Database file not found: ${dbPath}`)
      process.exit(1)
    }
  }

  const db = getDatabase()
  const rows = db.prepare("SELECT id, username, email, role, status, created_at FROM users ORDER BY id").all() as any[]
  
  if (!rows.length) {
    console.log("No users found.")
    return
  }

  // Print header
  console.log("ID\tUsername\tEmail\t\t\tRole\tStatus\tCreated At")
  console.log("-".repeat(80))

  for (const r of rows) {
    // Basic padding for alignment (simple tab-based)
    const email = r.email || "N/A"
    const role = r.role || "N/A"
    const status = r.status || "N/A"
    
    console.log(`${r.id}\t${r.username}\t${email}\t${role}\t${status}\t${r.created_at}`)
  }
}

if (require.main === module) {
  main()
}

