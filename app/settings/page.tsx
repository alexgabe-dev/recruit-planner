import { MainLayout } from "@/components/layout/main-layout"
import { SettingsContent } from "@/components/settings/settings-content"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beállítások</h1>
          <p className="text-muted-foreground">Alkalmazás beállítások kezelése</p>
        </div>
        <SettingsContent />
      </div>
    </MainLayout>
  )
}
