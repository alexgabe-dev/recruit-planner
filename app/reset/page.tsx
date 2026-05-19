import { Suspense } from "react"
import ResetClient from "./ResetClient"
export const dynamic = "force-dynamic"

export default function ResetPage() {
  return (
    <div className="korvo-grid relative grid min-h-screen place-items-center overflow-hidden bg-background p-4">
      <Suspense>
        <ResetClient />
      </Suspense>
    </div>
  )
}
