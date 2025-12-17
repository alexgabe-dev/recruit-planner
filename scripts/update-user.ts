import { getUserByUsername, initializeDatabase, getDatabase } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
  try {
    const args = process.argv.slice(2)
    const usernameArg = args.find((a) => a.startsWith("--username="))
    
    // Optional update fields
    const roleArg = args.find((a) => a.startsWith("--role="))
    const statusArg = args.find((a) => a.startsWith("--status="))
    const emailArg = args.find((a) => a.startsWith("--email="))
    const passwordArg = args.find((a) => a.startsWith("--password="))

    if (!usernameArg) {
      console.error("Usage: npx tsx scripts/update-user.ts --username=<name> [options]")
      console.error("Options:")
      console.error("  --role=<role>       Set user role (admin, user, viewer)")
      console.error("  --status=<status>   Set user status (active, pending, suspended)")
      console.error("  --email=<email>     Set email address")
      console.error("  --password=<pass>   Reset password")
      process.exit(1)
    }

    const username = usernameArg.split("=")[1]
    
    // Parse optional values
    const role = roleArg ? roleArg.split("=")[1] : undefined
    const status = statusArg ? statusArg.split("=")[1] : undefined
    const email = emailArg ? emailArg.split("=")[1] : undefined
    const password = passwordArg ? passwordArg.split("=")[1] : undefined

    if (!role && !status && !email && !password) {
      console.log("No updates requested. Provide at least one of --role, --status, --email, or --password.")
      process.exit(0)
    }

    initializeDatabase()

    const user = getUserByUsername(username)
    if (!user) {
      console.error("User not found:", username)
      process.exit(1)
    }

    const db = getDatabase()
    const updates: string[] = []
    const values: any[] = []

    if (role) {
      updates.push("role = ?")
      values.push(role)
    }
    if (status) {
      updates.push("status = ?")
      values.push(status)
    }
    if (email) {
      updates.push("email = ?")
      values.push(email)
    }
    if (password) {
      const salt = await bcrypt.genSalt(12)
      const hash = await bcrypt.hash(password, salt)
      updates.push("hashed_password = ?")
      values.push(hash)
    }

    // Add updated_at timestamp
    updates.push("updated_at = CURRENT_TIMESTAMP")

    // Add user ID to values for the WHERE clause
    values.push(user.id)

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    
    db.prepare(query).run(...values)

    console.log(`User '${username}' updated successfully:`)
    if (role) console.log(`  Role:     ${role}`)
    if (status) console.log(`  Status:   ${status}`)
    if (email) console.log(`  Email:    ${email}`)
    if (password) console.log(`  Password: [updated]`)
    
    process.exit(0)
  } catch (err) {
    console.error("Error updating user:", (err as Error).message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
