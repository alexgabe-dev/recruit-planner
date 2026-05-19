"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SettingsContent } from "@/components/settings/settings-content"
import { useLanguage } from "@/components/language-provider"

export default function SettingsPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <p className="text-xs font-medium uppercase text-[#a78bfa]">Control plane</p>
          <h1 className="korvo-page-title">{t("page.settingsTitle", "Beállítások")}</h1>
          <p className="korvo-page-description">{t("page.settingsDesc", "Alkalmazás beállítások kezelése")}</p>
        </div>
        <SettingsContent />
      </div>
    </MainLayout>
  )
}
