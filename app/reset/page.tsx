import { Suspense } from "react"
import Orb from "@/components/Orb"
import ResetClient from "./ResetClient"
export const dynamic = "force-dynamic"

export default function ResetPage() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-30">
        <Orb hue={220} hoverIntensity={0.1} />
      </div>
      <Suspense>
        <ResetClient />
      </Suspense>
    </div>
  )
}
