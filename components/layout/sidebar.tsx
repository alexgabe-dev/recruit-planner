"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Table2, Building2, Settings, ChevronLeft, ChevronRight, Megaphone, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import SplitText from "@/components/SplitText"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advertisements", label: "Hirdetések", icon: Table2 },
  { href: "/partners", label: "Partnerek", icon: Building2 },
  { href: "/settings", label: "Beállítások", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
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
            role: data.role
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


  const displayedNavItems = [...navItems]
  if (me?.role === 'admin') {
    displayedNavItems.push({ href: "/admin/users", label: "Felhasználók", icon: Users })
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {loggingOut && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 animate-in fade-in duration-300">
            <SplitText
              text="Viszlát!"
              className="text-white text-3xl md:text-5xl font-bold text-center"
              delay={60}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.05}
              rootMargin="-100px"
              textAlign="center"
            />
          </div>
        )}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={me?.avatarUrl ?? "/placeholder-user.jpg"} alt={me?.username ?? "Felhasználó"} />
                <AvatarFallback>{(me?.username?.slice(0, 2)?.toUpperCase()) ?? "TE"}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sidebar-foreground">{me?.displayName || me?.username || "Felhasználó"}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {displayedNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="space-y-3 border-t border-sidebar-border p-4">
            <form
              action="/api/auth/logout"
              method="POST"
              className="flex"
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
              <Button variant="outline" className="w-full">Kijelentkezés</Button>
            </form>
            <p className="text-xs text-sidebar-foreground/50">© Gábor Sándor - 2025</p>
          </div>
        )}
      </div>
    </aside>
  )
}
