import { createUser, getUserByUsername, initializeDatabase } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
  try {
    const args = process.argv.slice(2)
    const usernameArg = args.find((a) => a.startsWith("--username="))
    const passwordArg = args.find((a) => a.startsWith("--password="))

    if (!usernameArg || !passwordArg) {
      console.error("Usage: tsx scripts/register-admin.ts --username=<name> --password=<pass>")
      process.exit(1)
    }

    const username = usernameArg.split("=")[1]
    const password = passwordArg.split("=")[1]

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

    const user = createUser(username, hash)

    const verify = getUserByUsername(username)
    if (!verify) {
      console.error("Failed to verify inserted user")
      process.exit(1)
    }

    console.log("Admin user created:", user.username)
    console.log("Please delete or disable this script after use.")
    process.exit(0)
  } catch (err) {
    console.error("Error creating admin:", (err as Error).message)
    process.exit(1)
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main()
}

