"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { AdsTable } from "@/components/advertisements/ads-table"
import { useLanguage } from "@/components/language-provider"

export default function AdvertisementsPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("page.advertisementsTitle", "Hirdetések")}</h1>
          <p className="text-muted-foreground">{t("page.advertisementsDesc", "Kezelje a toborzási hirdetéseket")}</p>
        </div>
        <AdsTable />
      </div>
    </MainLayout>
  )
}
