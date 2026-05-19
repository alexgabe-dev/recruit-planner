import { Suspense } from "react"
import LoginClient from "./LoginClient"
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="korvo-grid relative flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense>
        <LoginClient />
      </Suspense>
    </div>
  )
}
