"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { KorvoLogo } from "@/components/korvo-logo"
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
        const me = await fetch(`/api/auth/me?t=${Date.now()}`)
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
    <div className="relative w-full flex justify-center">
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
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/80 animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-border bg-card shadow-[0_24px_80px_rgb(0_0_0/0.42)] animate-in zoom-in-95 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Hogy szólíthatunk?</CardTitle>
              <CardDescription>Kérjük, add meg a keresztneved a folytatáshoz</CardDescription>
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

<div className="w-full max-w-6xl border border-[#27272A] rounded-2xl overflow-hidden bg-[#09090B] animate-in fade-in slide-in-from-bottom-4 duration-700" style={{
  backgroundImage: `radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.04) 0%, transparent 50%)`
}}>
  <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] min-h-screen md:min-h-auto md:min-h-[600px]">

    {/* Left Column */}
    <div className="hidden md:flex flex-col justify-between bg-[#09090B] p-16">
      <div className="space-y-4">

        {/* Logo */}
        <KorvoLogo />

        {/* Label */}
        <div>
          {/* Main Headline */}
          <h2 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-[#FAFAFA] mb-6">
            A kampányaid végre{" "}
            <span className="text-[#7C3AED]">
              nem Excelben futnak
            </span>.
          </h2>

          {/* Supporting Text */}
          <p className="text-base text-[#A1A1AA] leading-relaxed max-w-md">
            Egy központi dashboard, ahol a toborzási kampányaid, státuszaid és workflow-jaid egyetlen rendszerben kezelhetők.
          </p>
        </div>
      </div>

            {/* Bottom Indicators */}
            <div className="space-y-4 pt-8 border-t border-[#27272A]">
              <div className="flex items-center gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-[#A1A1AA]">Kampányok szinkronizálva</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-[#A1A1AA]">Státuszok élőben</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-[#A1A1AA]">Workflow-k összekötve</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-center bg-[#111113] px-8 md:px-12 py-12 md:py-0 border-l border-[#27272A]">
            <div className="max-w-sm w-full mx-auto md:mx-0">
              <KorvoLogo className="mb-10 md:hidden" />
              {/* Header */}
              <div className="mb-12">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C3AED] mb-3">Üdv újra.</p>
                <h1 className="text-4xl font-semibold text-[#FAFAFA] mb-3 leading-tight">
                  Lépj be a recruitment dashboardodba.
                </h1>
                <p className="text-sm text-[#A1A1AA]">
                  Használd a fiókodat a kampányok, partnerek és státuszok kezeléséhez.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FAFAFA]">E-mail cím</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] group-focus-within:text-[#7C3AED] transition-colors" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-10 h-11 w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
                      placeholder="hello@ceged.hu"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[#FAFAFA]">Jelszó</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-[#A1A1AA] hover:text-[#7C3AED] transition-colors"
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                    >
                      Elfelejtett jelszó?
                    </Button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] group-focus-within:text-[#7C3AED] transition-colors" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-11 w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  className="w-full h-11 mt-8 bg-[#7C3AED] hover:bg-[#8B5CF6] text-[#FAFAFA] font-semibold rounded-lg transition-colors duration-200"
                  disabled={loading} 
                  type="submit"
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

                {/* Footer */}
                <p className="text-center text-sm text-[#A1A1AA] pt-4">
                  Nincs még fiókod?{" "}
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-[#7C3AED] hover:text-[#8B5CF6] font-medium transition-colors"
                    type="button"
                    onClick={() => router.push("/register")}
                  >
                    Regisztrálj itt
                  </Button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
