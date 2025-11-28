"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useStore } from "@/lib/db-store"
import { toast } from "sonner"
import { Trash2, RotateCcw, Database, Info, KeyRound, User } from "lucide-react"
import { useEffect, useState } from "react"

export function SettingsContent() {
  const { partners, ads } = useStore()
  const [confirmText, setConfirmText] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changing, setChanging] = useState(false)
  const [me, setMe] = useState<{ username: string; email: string | null; displayName: string | null } | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setMe({ username: data.username, email: data.email ?? null, displayName: data.displayName ?? null })
        setDisplayName(data.displayName ?? "")
      } catch {}
    })()
  }, [])

  const handleResetData = async () => {
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      })
      if (!res.ok) throw new Error("Failed to reset")
      await useStore.getState().loadData()
      toast.success("Alapértelmezett adatok visszaállítva")
    } catch (e) {
      toast.error("Hiba: nem sikerült visszaállítani az adatokat")
    }
  }

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Adj meg egy nevet")
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as any).error || 'Sikertelen mentés')
      } else {
        toast.success('Megjelenített név frissítve')
        setMe((prev) => prev ? { ...prev, displayName: displayName.trim() } : prev)
      }
    } catch {
      toast.error('Szerver hiba')
    } finally {
      setSavingName(false)
    }
  }

  const handleClearAllData = async () => {
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: false }),
      })
      if (!res.ok) throw new Error("Failed to clear")
      await useStore.getState().loadData()
      toast.success("Összes adat törölve")
    } catch (e) {
      toast.error("Hiba: nem sikerült törölni az adatokat")
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Az új jelszó és megerősítés nem egyezik")
      return
    }
    if (newPassword.length < 8) {
      toast.error("A jelszó legyen legalább 8 karakter")
      return
    }
    setChanging(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as any).error || "Sikertelen jelszócsere")
      } else {
        toast.success("Jelszó frissítve")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      toast.error("Szerver hiba")
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-stretch">
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Fiók
          </CardTitle>
          <CardDescription>Bejelentkezett felhasználó</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src="/placeholder-user.jpg" alt={me?.username ?? "Felhasználó"} />
              <AvatarFallback>{(me?.username?.slice(0, 2)?.toUpperCase()) ?? "TE"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{me ? `Bejelentkezve mint: ${me.username}` : "Bejelentkezés szükséges"}</p>
              {me?.email && <p className="text-xs text-muted-foreground">Email: {me.email}</p>}
              {me?.displayName && <p className="text-xs text-muted-foreground">Megjelenített név: {me.displayName}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Megjelenített név</label>
            <div className="flex items-center gap-2">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Pl. Ádám" />
              <Button onClick={handleSaveDisplayName} disabled={savingName}>{savingName ? 'Mentés…' : 'Mentés'}</Button>
            </div>
            <p className="text-xs text-muted-foreground">Ezt a nevet használjuk az üdvözlésnél és a felületen.</p>
          </div>
          <form
            action="/api/auth/logout"
            method="POST"
            onSubmit={async (e) => {
              e.preventDefault()
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
          >
            <Button variant="outline" className="w-full">Kijelentkezés</Button>
          </form>
        </CardContent>
      </Card>
      {/* Data Info */}
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Adatok
          </CardTitle>
          <CardDescription>Aktuális adatbázis állapot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-2xl font-bold">{partners.length}</p>
              <p className="text-sm text-muted-foreground">Partner</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-2xl font-bold">{ads.length}</p>
              <p className="text-sm text-muted-foreground">Hirdetés</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Adatok SQLite adatbázisban tárolva.</p>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Adatkezelés
          </CardTitle>
          <CardDescription>Adatok visszaállítása vagy törlése</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleResetData}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Alapértelmezett adatok visszaállítása
            </Button>
            <p className="text-xs text-muted-foreground">Visszaállítja a mintaadatokat</p>
          </div>
          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Összes adat törlése
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Biztosan törlöd az összes adatot?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A művelet nem vonható vissza. Minden partner és hirdetés törlődik.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <p className="text-xs text-muted-foreground">Írd be: <span className="font-semibold">ELFOGADOM</span></p>
                  <Input
                    placeholder="ELFOGADOM"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégse</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={handleClearAllData}
                    disabled={confirmText !== "ELFOGADOM"}
                  >
                    Törlés
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">Törli az összes partnert és hirdetést</p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Jelszó módosítás
          </CardTitle>
          <CardDescription>Jelenlegi jelszó ellenőrzése után új jelszó beállítása</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Jelenlegi jelszó</label>
              <Input className="w-full" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Új jelszó</label>
              <Input className="w-full" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Új jelszó megerősítése</label>
              <Input className="w-full" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={changing} className="w-full">
              {changing ? "Frissítés..." : "Jelszó frissítése"}
            </Button>
            <p className="text-xs text-muted-foreground">Minimum 8 karakter. Sikeres módosítás után a munkamenet megmarad.</p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Alkalmazás információ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Verzió</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium">Framework</p>
              <p className="text-sm text-muted-foreground">Next.js 15</p>
            </div>
            <div>
              <p className="text-sm font-medium">UI könyvtár</p>
              <p className="text-sm text-muted-foreground">shadcn/ui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
