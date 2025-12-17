"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import SplitText from "@/components/SplitText"
import { User, Lock, LogIn, Loader2 } from "lucide-react"

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameForWelcome, setNameForWelcome] = useState<string>("")
  const [redirectTo, setRedirectTo] = useState<string>("/")
  const approved = params.get('approved') === '1'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as any).error || "Sikertelen bejelentkezés")
        setLoading(false)
        return
      }
      const data = await res.json().catch(() => ({ success: true })) as any
      setLoading(false)
      if (data?.needsDisplayName) {
        setShowNameModal(true)
      } else {
        try {
          const me = await fetch('/api/auth/me')
          const meData = await me.json().catch(() => ({}))
          setNameForWelcome(meData?.displayName || username)
          if (meData?.role === 'viewer') setRedirectTo('/advertisements')
        } catch {
          setNameForWelcome(username)
        }
        setShowWelcome(true)
      }
    } catch {
      setError("Szerver hiba")
      setLoading(false)
    }
  }

  const submitDisplayName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameSaving(true)
    setNameError(null)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setNameError((data as any).error || 'Sikertelen mentés')
        setNameSaving(false)
        return
      }
      setShowNameModal(false)
      setNameForWelcome(displayName || username)
      try {
        const me = await fetch('/api/auth/me')
        const meData = await me.json().catch(() => ({}))
        if (meData?.role === 'viewer') setRedirectTo('/advertisements')
      } catch {}
      setShowWelcome(true)
    } catch {
      setNameError('Szerver hiba')
    } finally {
      setNameSaving(false)
    }
  }

  return (
    <div className="relative">
      {showWelcome && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black animate-in fade-in duration-500">
          <SplitText
            text={`Szia, ${nameForWelcome || username}!`}
            className="text-white text-6xl md:text-8xl font-black tracking-tight text-center"
            delay={80}
            onLetterAnimationComplete={() => {
              setTimeout(() => {
                router.push(redirectTo)
              }, 500)
            }}
          />
        </div>
      )}

      {showNameModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Hogy szólíthatunk?</CardTitle>
              <CardDescription>Kérjük, add meg a teljes neved a folytatáshoz</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitDisplayName} className="space-y-4">
                {nameError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center font-medium">
                    {nameError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teljes név</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    required 
                    placeholder="Pl. Kovács János"
                    className="focus-visible:ring-primary"
                    autoFocus
                  />
                </div>
                <Button className="w-full" disabled={nameSaving} type="submit">
                  {nameSaving ? "Mentés..." : "Tovább"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Bejelentkezés</CardTitle>
          <CardDescription>
            {approved ? "A fiókod jóváhagyva! Jelentkezz be." : "Add meg az adataidat a belépéshez"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Felhasználónév</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="pl-9 transition-all focus:ring-2 focus:ring-primary/20" 
                    placeholder="Felhasználónév"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jelszó</label>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" 
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Elfelejtett jelszó?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="pl-9 transition-all focus:ring-2 focus:ring-primary/20" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                className="w-full transition-all active:scale-[0.98] font-semibold" 
                disabled={loading} 
                type="submit"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Belépés...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Bejelentkezés
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground pt-2">
                Nincs még fiókod?{" "}
                <Button 
                  variant="link" 
                  className="h-auto p-0 font-semibold text-primary hover:underline" 
                  type="button"
                  onClick={() => router.push("/register")}
                >
                  Regisztrálj itt
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
