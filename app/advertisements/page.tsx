import { MainLayout } from "@/components/layout/main-layout"
import { AdsTable } from "@/components/advertisements/ads-table"

export default function AdvertisementsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hirdetések</h1>
          <p className="text-muted-foreground">Kezelje a toborzási hirdetéseket</p>
        </div>
        <AdsTable />
      </div>
    </MainLayout>
  )
}
