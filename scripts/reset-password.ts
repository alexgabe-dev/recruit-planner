import { getUserByUsername, initializeDatabase } from "../lib/db"
import bcrypt from "bcryptjs"
import { getDatabase } from "../lib/db"

async function main() {
  const args = process.argv.slice(2)
  const usernameArg = args.find((a) => a.startsWith("--username="))
  const passwordArg = args.find((a) => a.startsWith("--password="))

  if (!usernameArg || !passwordArg) {
    console.error("Usage: tsx scripts/reset-password.ts --username=<name> --password=<newpass>")
    process.exit(1)
  }

  const username = usernameArg.split("=")[1]
  const password = passwordArg.split("=")[1]

  initializeDatabase()
  const user = getUserByUsername(username)
  if (!user) {
    console.error("User not found:", username)
    process.exit(1)
  }

  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash(password, salt)

  const db = getDatabase()
  const stmt = db.prepare("UPDATE users SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
  const res = stmt.run(hash, user.id)
  if (res.changes !== 1) {
    console.error("Failed to update password")
    process.exit(1)
  }
  console.log("Password updated for:", username)
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main()
}

