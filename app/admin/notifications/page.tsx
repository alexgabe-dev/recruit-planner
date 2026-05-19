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
        <div className="border-b border-border pb-6">
          <p className="text-xs font-medium uppercase text-[#a78bfa]">Admin control</p>
          <h1 className="korvo-page-title">Értesítések kezelése</h1>
          <p className="korvo-page-description">Automatikus e-mail értesítések beállítása</p>
        </div>
        <NotificationsContent />
      </div>
    </MainLayout>
  )
}
