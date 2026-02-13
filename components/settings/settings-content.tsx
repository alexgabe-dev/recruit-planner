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
import { Trash2, RotateCcw, Database, Info, KeyRound, User, Camera, Upload, Moon, Sun, Monitor, Bell, Languages, Shield, LogOut } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type SettingsTab = "profile" | "appearance" | "notifications" | "security" | "data" | "about"

export function SettingsContent() {
  const { partners, ads } = useStore()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  
  const [confirmText, setConfirmText] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changing, setChanging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [me, setMe] = useState<{ username: string; email: string | null; displayName: string | null; role?: string | null; avatarUrl?: string | null; themePreference?: "light" | "dark" } | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [savingTheme, setSavingTheme] = useState(false)
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
  const importFileRef = useRef<HTMLInputElement | null>(null)

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
          role: data.role ?? null,
          avatarUrl: data.avatarUrl ?? null,
          themePreference: data.themePreference === "light" ? "light" : "dark",
        })
        setDisplayName(data.displayName ?? "")
        if (data.themePreference === "light" || data.themePreference === "dark") {
          setTheme(data.themePreference)
        }
      } catch {}
    })()
  }, [setTheme])

  const handleThemeChange = async (value: string) => {
    if (value !== "light" && value !== "dark") return
    const previousTheme = theme
    setTheme(value)
    setSavingTheme(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setTheme(previousTheme === "light" ? "light" : "dark")
        toast.error((data as any).error || 'Sikertelen téma mentés')
        return
      }
      setMe((prev) => (prev ? { ...prev, themePreference: value } : prev))
      toast.success('Téma frissítve')
    } catch {
      setTheme(previousTheme === "light" ? "light" : "dark")
      toast.error('Szerver hiba')
    } finally {
      setSavingTheme(false)
    }
  }

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || "Sikertelen importálás")
      } else {
        toast.success(`${data.count} hirdetés sikeresen importálva`)
        await useStore.getState().loadData()
      }
    } catch {
      toast.error("Hiba történt az importálás során")
    } finally {
      setImporting(false)
      if (importFileRef.current) {
        importFileRef.current.value = ""
      }
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

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profil", icon: User },
    { id: "appearance", label: "Megjelenés", icon: Monitor },
    { id: "notifications", label: "Értesítések", icon: Bell },
    { id: "security", label: "Biztonság", icon: Shield },
    { id: "data", label: "Adatok", icon: Database },
    { id: "about", label: "Névjegy", icon: Info },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-3", activeTab === tab.id && "bg-muted font-medium")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </aside>

      {/* Content Area */}
      <main className="flex-1 w-full max-w-3xl">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-medium">Profil beállítások</h3>
              <p className="text-sm text-muted-foreground">Személyes adataid és profilképed kezelése.</p>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="size-24 border-2 border-border">
                  <AvatarImage src={me?.avatarUrl ?? "/placeholder-user.jpg"} alt={me?.username ?? "Felhasználó"} className="object-cover" />
                  <AvatarFallback className="text-2xl">{(me?.username?.slice(0, 2)?.toUpperCase()) ?? "TE"}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </div>
              <div className="space-y-4 flex-1 w-full">
                <div className="grid gap-2">
                  <Label>Felhasználónév</Label>
                  <Input value={`@${me?.username}`} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
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
                  <p className="text-xs text-muted-foreground">Ez a név jelenik meg az üdvözlő képernyőn.</p>
                </div>
                {me?.role && (
                   <div className="grid gap-2">
                     <Label>Szerepkör</Label>
                     <div className="flex">
                      <span className="px-2.5 py-1 rounded-md bg-muted text-sm font-medium capitalize">{me.role}</span>
                     </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-medium">Megjelenés</h3>
              <p className="text-sm text-muted-foreground">A felület testreszabása.</p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Téma</Label>
                  <p className="text-xs text-muted-foreground">Válassz a világos és sötét mód között</p>
                </div>
                <Select value={theme === "light" ? "light" : "dark"} onValueChange={handleThemeChange} disabled={savingTheme}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Válassz témát" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4"/> Világos</span></SelectItem>
                    <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4"/> Sötét</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between opacity-50 pointer-events-none">
                <div className="space-y-0.5">
                  <Label className="text-base">Nyelv</Label>
                  <p className="text-xs text-muted-foreground">Az alkalmazás alapértelmezett nyelve</p>
                </div>
                <Select value="hu" disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Nyelv" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hu"><span className="flex items-center gap-2"><Languages className="h-4 w-4"/> Magyar</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
             <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-start justify-center pt-20 opacity-0 hover:opacity-100 transition-opacity cursor-not-allowed">
              <span className="bg-background/80 px-3 py-1.5 rounded-full text-sm font-medium border border-border shadow-sm">
                Fejlesztés alatt
              </span>
            </div>
            <div className="opacity-50 pointer-events-none">
              <h3 className="text-lg font-medium">Értesítések</h3>
              <p className="text-sm text-muted-foreground">Döntsd el, miről szeretnél emailt kapni.</p>
            </div>
            <Separator className="opacity-50" />
            <div className="space-y-6 opacity-50 pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Heti emlékeztető</Label>
                  <p className="text-xs text-muted-foreground">Összefoglaló a lejáró hirdetésekről minden hétfőn.</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Új hirdetés</Label>
                  <p className="text-xs text-muted-foreground">Azonnali értesítés, ha valaki új hirdetést hoz létre.</p>
                </div>
                <Switch checked={false} disabled />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-medium">Biztonság</h3>
              <p className="text-sm text-muted-foreground">Jelszó módosítása és fiók biztonság.</p>
            </div>
            <Separator />
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Jelenlegi jelszó</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Új jelszó</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Új jelszó megerősítése</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword} disabled={changing}>
                {changing ? "Frissítés..." : "Jelszó frissítése"}
              </Button>
            </div>
            <Separator />
            <div>
               <h4 className="text-sm font-medium text-destructive mb-4">Veszélyzóna</h4>
               <form
                action="/api/auth/logout"
                method="POST"
                onSubmit={async (e) => {
                  e.preventDefault()
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = '/login'
                }}
              >
                <Button variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Kijelentkezés az eszközről
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-medium">Adatok</h3>
              <p className="text-sm text-muted-foreground">Rendszeradatok és adatbázis kezelés.</p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Partnerek</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partners.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hirdetések</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ads.length}</div>
                </CardContent>
              </Card>
            </div>
            
            {me?.role === 'admin' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Adminisztrációs eszközök</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg space-y-3 bg-card">
                      <div className="flex items-center gap-2 font-medium">
                        <Upload className="h-4 w-4" />
                        Importálás
                      </div>
                      <p className="text-xs text-muted-foreground">Adatok tömeges betöltése Excel fájlból.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => importFileRef.current?.click()}
                        disabled={importing}
                      >
                        {importing ? "Feltöltés..." : "Fájl kiválasztása"}
                      </Button>
                      <input
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        ref={importFileRef}
                        onChange={handleImport}
                      />
                    </div>
                    
                    <div className="p-4 border rounded-lg space-y-3 bg-card">
                      <div className="flex items-center gap-2 font-medium">
                        <RotateCcw className="h-4 w-4" />
                        Visszaállítás
                      </div>
                      <p className="text-xs text-muted-foreground">A rendszer visszaállítása a mintaadatokra.</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={handleResetData}>
                        Mintaadatok betöltése
                      </Button>
                    </div>

                    <div className="p-4 border border-destructive/20 rounded-lg space-y-3 bg-destructive/5 sm:col-span-2">
                      <div className="flex items-center gap-2 font-medium text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Adatok törlése
                      </div>
                      <p className="text-xs text-muted-foreground">Minden partner és hirdetés végleges törlése az adatbázisból.</p>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Törlési folyamat indítása</Button>
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
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-medium">Névjegy</h3>
              <p className="text-sm text-muted-foreground">Információk az alkalmazásról.</p>
            </div>
            <Separator />
            <div className="grid gap-6 sm:grid-cols-2">
               <div className="space-y-1">
                 <p className="text-sm font-medium">Verzió</p>
                 <p className="text-sm text-muted-foreground">1.0.0 (Production)</p>
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-medium">Környezet</p>
                 <p className="text-sm text-muted-foreground">{process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-medium">Tech Stack</p>
                 <p className="text-sm text-muted-foreground">Next.js 15, React 19, SQLite, Tailwind</p>
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-medium">Fejlesztő</p>
                 <p className="text-sm text-muted-foreground">Gábor Sándor</p>
               </div>
            </div>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                &copy; pry.hu - Hirdetés rendszerező
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Hidden inputs / dialogs that are shared */}
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
    </div>
  )
}
