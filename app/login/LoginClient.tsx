"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SplitText from "@/components/SplitText"

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
            duration={0.3}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.05}
            rootMargin="-100px"
            textAlign="center"
          onLetterAnimationComplete={() => {
              setTimeout(() => router.replace(redirectTo), 700)
            }}
          />
        </div>
      )}
      {showNameModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black animate-in fade-in duration-500">
          <div className="w-full max-w-sm rounded-lg border border-border bg-neutral-900/95 text-white p-6 shadow-lg">
            <SplitText
              text="Hogyan szólíthatunk?"
              className="text-white text-2xl md:text-3xl font-bold text-center"
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
            <form onSubmit={submitDisplayName} className="mt-6 space-y-3">
              <label className="text-xs text-white/80">Keresztnév vagy becenév</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
                className="bg-neutral-800 text-white placeholder:text-neutral-400 border-neutral-700 focus-visible:ring-white/50 focus-visible:border-white shadow-sm"
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              <Button type="submit" disabled={nameSaving} className="w-full transition-transform active:scale-[0.98]">
                {nameSaving ? 'Mentés…' : 'Mentés'}
              </Button>
            </form>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-4 rounded-lg border border-border p-6 bg-card/80 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-xl font-semibold">Bejelentkezés</h1>
      {approved && <p className="text-xs text-[oklch(0.7_0.18_145)]">Fiók jóváhagyva. Jelentkezz be.</p>}
      <div className="space-y-2">
        <label className="text-sm">Felhasználónév</label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} required className="transition-colors focus:shadow-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Jelszó</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="transition-colors focus:shadow-sm" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full transition-transform active:scale-[0.98]">
        {loading ? "Belépés..." : "Belépés"}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button type="button" className="text-muted-foreground hover:underline transition-opacity active:opacity-80" onClick={() => router.push('/forgot-password')}>Elfelejtetted a jelszót?</button>
        <button type="button" className="text-muted-foreground hover:underline transition-opacity active:opacity-80" onClick={() => router.push('/register')}>Regisztráció</button>
      </div>
      </form>
    </div>
  )
}
