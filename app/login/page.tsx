import { Suspense } from "react"
import Orb from "@/components/Orb"
import LoginClient from "./LoginClient"
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense>
        <LoginClient />
      </Suspense>
    </div>
  )
}
