import { createUser, getUserByUsername, initializeDatabase, getDatabase } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
  try {
    const args = process.argv.slice(2)
    const usernameArg = args.find((a) => a.startsWith("--username="))
    const passwordArg = args.find((a) => a.startsWith("--password="))
    const roleArg = args.find((a) => a.startsWith("--role="))
    const statusArg = args.find((a) => a.startsWith("--status="))
    const emailArg = args.find((a) => a.startsWith("--email="))

    if (!usernameArg || !passwordArg) {
      console.error("Usage: npx tsx scripts/add-user.ts --username=<name> --password=<pass> [--role=<role>] [--status=<status>] [--email=<email>]")
      console.error("Default role: user")
      console.error("Default status: active")
      process.exit(1)
    }

    const username = usernameArg.split("=")[1]
    const password = passwordArg.split("=")[1]
    const role = roleArg ? roleArg.split("=")[1] : "user"
    const status = statusArg ? statusArg.split("=")[1] : "active"
    const email = emailArg ? emailArg.split("=")[1] : null

    if (!username || !password) {
      console.error("Username and password are required")
      process.exit(1)
    }

    initializeDatabase()

    const existing = getUserByUsername(username)
    if (existing) {
      console.error("User already exists:", username)
      process.exit(1)
    }

    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(password, salt)

    // Create user (defaults to role='user', status='pending')
    const user = createUser(username, hash)

    // Update with provided role, status and email
    const db = getDatabase()
    db.prepare("UPDATE users SET role = ?, status = ?, email = ? WHERE id = ?")
      .run(role, status, email, user.id)

    console.log(`User created successfully:`)
    console.log(`  Username: ${username}`)
    console.log(`  Role:     ${role}`)
    console.log(`  Status:   ${status}`)
    console.log(`  Email:    ${email || "N/A"}`)
    
    process.exit(0)
  } catch (err) {
    console.error("Error creating user:", (err as Error).message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
