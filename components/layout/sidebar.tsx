"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Table2,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { KorvoLogo } from "@/components/korvo-logo"
import SplitText from "@/components/SplitText"
import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/advertisements", labelKey: "nav.advertisements", icon: Table2 },
  { href: "/partners", labelKey: "nav.partners", icon: Building2 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [me, setMe] = useState<{ username: string; email: string | null; displayName: string | null; avatarUrl?: string | null; role?: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setMe({
          username: data.username,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          avatarUrl: data.avatarUrl ?? null,
          role: data.role,
        })
      } catch {}
    })()
    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent).detail as string
      setMe((prev) => (prev ? { ...prev, avatarUrl: url } : prev))
    }
    window.addEventListener("avatar-updated", onAvatarUpdated as any)
    return () => {
      window.removeEventListener("avatar-updated", onAvatarUpdated as any)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "5rem" : "18rem")
  }, [collapsed])

  const displayedNavItems = [...navItems]
  if (me?.role === "admin") {
    displayedNavItems.push({ href: "/admin/users", labelKey: "nav.users", icon: Users })
    displayedNavItems.push({ href: "/admin/notifications", labelKey: "nav.notifications", icon: Megaphone })
    displayedNavItems.push({ href: "/admin/logs", labelKey: "nav.logs", icon: ClipboardList })
  }

  const userName = me?.displayName || me?.username || t("nav.userFallback", "Felhasználó")
  const userInitials = me?.username?.slice(0, 2)?.toUpperCase() ?? "KO"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-full flex-col">
        {loggingOut && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-background animate-in fade-in duration-300">
            <SplitText
              text={t("nav.goodbye", "Viszlát!")}
              className="text-center text-3xl font-semibold text-foreground md:text-5xl"
              delay={50}
              duration={0.45}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 18 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.05}
              rootMargin="-100px"
              textAlign="center"
            />
          </div>
        )}

        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "h-[92px] flex-col justify-center gap-2 px-0" : "h-[84px] justify-between px-4"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center gap-3",
              collapsed ? "justify-center" : "flex-1"
            )}
          >
            <KorvoLogo compact={collapsed} />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={collapsed ? "Sidebar kinyitása" : "Sidebar összecsukása"}
            title={collapsed ? "Sidebar kinyitása" : "Sidebar összecsukása"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {!collapsed && (
            <div className="px-3 pb-2 text-[11px] font-medium uppercase text-muted-foreground">
              Workflow
            </div>
          )}
          {displayedNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t(item.labelKey) : undefined}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-[background-color,border-color,color]",
                  isActive
                    ? "border-primary/30 bg-[rgb(124_58_237/0.12)] text-sidebar-accent-foreground"
                    : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#c4b5fd]" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-2", collapsed && "justify-center")}>
            <Avatar className="size-9 border border-border">
              <AvatarImage src={me?.avatarUrl ?? "/placeholder-user.jpg"} alt={me?.username ?? t("nav.userFallback", "Felhasználó")} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-sidebar-foreground">{userName}</div>
                <div className="truncate text-xs text-muted-foreground">{me?.email || me?.role || "operator"}</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <form
              action="/api/auth/logout"
              method="POST"
              className="mt-3"
              onSubmit={async (e) => {
                e.preventDefault()
                setLoggingOut(true)
                try {
                  await fetch("/api/auth/logout", { method: "POST" })
                } catch {}
                setTimeout(() => {
                  window.location.href = "/login"
                }, 800)
              }}
            >
              <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                <LogOut className="h-4 w-4" />
                {t("nav.logout", "Kijelentkezés")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </aside>
  )
}
