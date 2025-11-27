"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Orb from "@/components/Orb"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="relative flex min-h-screen items-center justify-center">
      <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={false} />
      </div>
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-4 rounded-lg border border-border p-6 bg-card">
        <h1 className="text-xl font-semibold">Bejelentkezés</h1>
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
      </form>
    </div>
  )
}
