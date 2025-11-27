import { getDatabase } from "../lib/db"

function main() {
  const db = getDatabase()
  const rows = db.prepare("SELECT id, username, hashed_password, created_at FROM users ORDER BY id").all() as any[]
  if (!rows.length) {
    console.log("No users found.")
    return
  }
  for (const r of rows) {
    console.log(`${r.id}\t${r.username}\t${r.created_at}`)
  }
}

if (require.main === module) {
  main()
}

