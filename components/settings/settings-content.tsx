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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/db-store"
import { toast } from "sonner"
import { Trash2, RotateCcw, Database, Info, KeyRound, User, Camera } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export function SettingsContent() {
  const { partners, ads } = useStore()
  const [confirmText, setConfirmText] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changing, setChanging] = useState(false)
  const [me, setMe] = useState<{ username: string; email: string | null; displayName: string | null; role?: string | null; avatarUrl?: string | null } | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [cropEl, setCropEl] = useState<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setMe({ username: data.username, email: data.email ?? null, displayName: data.displayName ?? null, role: data.role ?? null, avatarUrl: data.avatarUrl ?? null })
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

  const openCropperWithFile = (file: File) => {
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    
    const img = document.createElement("img")
    img.src = url
    img.onload = () => {
      const containerSize = 256 // w-64
      const minDim = Math.min(img.naturalWidth, img.naturalHeight)
      const scaleToFit = containerSize / minDim
      setZoom(scaleToFit)
      
      // Center it
      const displayWidth = img.naturalWidth * scaleToFit
      const displayHeight = img.naturalHeight * scaleToFit
      setOffset({
        x: (containerSize - displayWidth) / 2,
        y: (containerSize - displayHeight) / 2
      })
      setCropOpen(true)
    }
  }

  const cropToBlob = async (): Promise<Blob | null> => {
    if (!cropSrc || !cropEl) return null
    const img = document.createElement("img")
    img.src = cropSrc
    await new Promise((resolve) => (img.onload = resolve as any))
    const rect = cropEl.getBoundingClientRect()
    const size = Math.min(rect.width, rect.height)
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    const k = canvas.width / size
    const destScale = zoom * k
    const dx = offset.x * k
    const dy = offset.y * k
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      dx,
      dy,
      img.naturalWidth * destScale,
      img.naturalHeight * destScale,
    )
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
  }

  const handleSaveCropped = async () => {
    setUploading(true)
    try {
      const blob = await cropToBlob()
      if (!blob) throw new Error("crop failed")
      const form = new FormData()
      form.append("avatar", new File([blob], "avatar.png", { type: "image/png" }))
      const res = await fetch("/api/auth/avatar", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as any).error || "Sikertelen feltöltés")
      } else {
        toast.success("Avatar frissítve")
        setMe((prev) => (prev ? { ...prev, avatarUrl: (data as any).avatarUrl } : prev))
        setAvatarFile(null)
        setCropOpen(false)
        if (cropSrc) URL.revokeObjectURL(cropSrc)
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: (data as any).avatarUrl }))
      }
    } catch {
      toast.error("Szerver hiba")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-stretch">
      <Card className="border-border bg-card h-full overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-muted to-muted/50 relative">
          <div className="absolute -bottom-12 left-6">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="size-24 border-4 border-card shadow-sm">
                <AvatarImage src={me?.avatarUrl ?? "/placeholder-user.jpg"} alt={me?.username ?? "Felhasználó"} className="object-cover" />
                <AvatarFallback className="text-2xl">{(me?.username?.slice(0, 2)?.toUpperCase()) ?? "TE"}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
        <CardContent className="pt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold">{me?.displayName || me?.username || "Betöltés..."}</h2>
            <p className="text-muted-foreground">@{me?.username}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {me?.role && <span className="px-2 py-0.5 rounded-full bg-muted font-medium capitalize">{me.role}</span>}
              {me?.email && <span>{me.email}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Megjelenített név</Label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Pl. Ádám"
                />
                <Button onClick={handleSaveDisplayName} disabled={savingName}>
                  {savingName ? 'Mentés...' : 'Mentés'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Ezt a nevet használjuk az üdvözlésnél és a felületen.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f) {
                if (cropSrc) URL.revokeObjectURL(cropSrc)
                openCropperWithFile(f)
              }
            }}
          />

          <Dialog open={cropOpen} onOpenChange={setCropOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Profilkép szerkesztése</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  ref={setCropEl}
                  className="relative mx-auto size-64 overflow-hidden rounded-full bg-muted"
                  onMouseDown={(e) => {
                    setDragging(true)
                    setDragStart({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseMove={(e) => {
                    if (!dragging || !dragStart) return
                    const dx = e.clientX - dragStart.x
                    const dy = e.clientY - dragStart.y
                    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
                    setDragStart({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseUp={() => {
                    setDragging(false)
                    setDragStart(null)
                  }}
                  onMouseLeave={() => {
                    setDragging(false)
                    setDragStart(null)
                  }}
                >
                  {cropSrc && (
                    <img
                      src={cropSrc}
                      alt="crop"
                      className="absolute top-0 left-0 select-none max-w-none max-h-none"
                      style={{ width: 'auto', height: 'auto', transformOrigin: 'top left', transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
                      draggable={false}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Nagyítás</label>
                  <input
                    type="range"
                    min={0.1}
                    max={5}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveCropped} disabled={uploading}>{uploading ? "Mentés…" : "Mentés"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Kijelentkezés</Label>
              <p className="text-xs text-muted-foreground">Kilépés a jelenlegi munkamenetből</p>
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
              <Button variant="destructive" size="sm">Kijelentkezés</Button>
            </form>
          </div>
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
      {me?.role !== 'viewer' && (
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
      )}

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
