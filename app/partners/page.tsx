import { MainLayout } from "@/components/layout/main-layout"
import { PartnersList } from "@/components/partners/partners-list"

export default function PartnersPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partnerek</h1>
          <p className="text-muted-foreground">Kezelje a toborzási partnereket és irodákat</p>
        </div>
        <PartnersList />
      </div>
    </MainLayout>
  )
}
