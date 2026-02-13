import { Suspense } from "react"
import LoginClient from "./LoginClient"
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars"
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <GravityStarsBackground className="absolute inset-0" />
      <Suspense>
        <LoginClient />
      </Suspense>
    </div>
  )
}
