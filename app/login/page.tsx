import { Suspense } from "react"
import Orb from "@/components/Orb"
import LoginClient from "./LoginClient"
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={false} />
      </div>
      <Suspense>
        <LoginClient />
      </Suspense>
    </div>
  )
}
