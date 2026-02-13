"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PartnersList } from "@/components/partners/partners-list"
import { useLanguage } from "@/components/language-provider"

export default function PartnersPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("page.partnersTitle", "Partnerek")}</h1>
          <p className="text-muted-foreground">{t("page.partnersDesc", "Kezelje a toborzási partnereket és irodákat")}</p>
        </div>
        <PartnersList />
      </div>
    </MainLayout>
  )
}
