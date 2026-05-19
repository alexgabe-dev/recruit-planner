"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { AdsTable } from "@/components/advertisements/ads-table"
import { useLanguage } from "@/components/language-provider"

export default function AdvertisementsPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <p className="text-xs font-medium uppercase text-[#a78bfa]">Campaign operations</p>
          <h1 className="korvo-page-title">{t("page.advertisementsTitle", "Hirdetések")}</h1>
          <p className="korvo-page-description">{t("page.advertisementsDesc", "Toborzási kampányok és megjelenések operatív kezelése")}</p>
        </div>
        <AdsTable />
      </div>
    </MainLayout>
  )
}
