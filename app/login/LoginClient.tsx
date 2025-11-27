"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      router.replace("/")
    } catch {
      setError("Szerver hiba")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-4 rounded-lg border border-border p-6 bg-card/80 backdrop-blur">
      <h1 className="text-xl font-semibold">Bejelentkezés</h1>
      {approved && <p className="text-xs text-[oklch(0.7_0.18_145)]">Fiók jóváhagyva. Jelentkezz be.</p>}
      <div className="space-y-2">
        <label className="text-sm">Felhasználónév</label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Jelszó</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Belépés..." : "Belépés"}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button type="button" className="text-muted-foreground hover:underline" onClick={() => router.push('/forgot-password')}>Elfelejtetted a jelszót?</button>
        <button type="button" className="text-muted-foreground hover:underline" onClick={() => router.push('/register')}>Regisztráció</button>
      </div>
    </form>
  )
}
