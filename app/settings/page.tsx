"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SettingsContent } from "@/components/settings/settings-content"
import { useLanguage } from "@/components/language-provider"

export default function SettingsPage() {
  const { t } = useLanguage()
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("page.settingsTitle", "Beállítások")}</h1>
          <p className="text-muted-foreground">{t("page.settingsDesc", "Alkalmazás beállítások kezelése")}</p>
        </div>
        <SettingsContent />
      </div>
    </MainLayout>
  )
}
