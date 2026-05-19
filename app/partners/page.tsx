"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PartnersList } from "@/components/partners/partners-list"
import { useLanguage } from "@/components/language-provider"

export default function PartnersPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <p className="text-xs font-medium uppercase text-[#a78bfa]">Network</p>
          <h1 className="korvo-page-title">{t("page.partnersTitle", "Partnerek")}</h1>
          <p className="korvo-page-description">{t("page.partnersDesc", "Kezelje a toborzási partnereket és irodákat")}</p>
        </div>
        <PartnersList />
      </div>
    </MainLayout>
  )
}
