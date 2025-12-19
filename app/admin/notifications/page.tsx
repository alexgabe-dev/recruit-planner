import { MainLayout } from "@/components/layout/main-layout"
import { NotificationsContent } from "@/components/admin/notifications-content"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    redirect('/')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Értesítések kezelése</h1>
          <p className="text-muted-foreground">Automatikus e-mail értesítések beállítása</p>
        </div>
        <NotificationsContent />
      </div>
    </MainLayout>
  )
}
