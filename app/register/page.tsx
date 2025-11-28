"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Orb from "@/components/Orb"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as any).error || "Sikertelen regisztráció")
        setLoading(false)
        return
      }
      setSuccess(true)
    } catch {
      setError("Szerver hiba")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-30">
        <Orb hue={220} hoverIntensity={0.1} />
      </div>
      <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Regisztráció</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                Köszönjük! A regisztráció „jóváhagyásra vár”. Az adminisztrátor értesítést kapott.
              </p>
              <Button onClick={() => router.push("/login")} className="transition-transform active:scale-[0.98]">Vissza a bejelentkezéshez</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-1">
                <label className="text-sm">Felhasználónév</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required className="transition-colors focus:shadow-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="transition-colors focus:shadow-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Jelszó</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="transition-colors focus:shadow-sm" />
                <p className="text-xs text-muted-foreground">Legalább 8 karakter</p>
              </div>
              <Button className="w-full transition-transform active:scale-[0.98]" disabled={loading} type="submit">
                {loading ? "Folyamatban…" : "Regisztráció küldése"}
              </Button>
              <div className="text-center">
                <Button variant="ghost" type="button" onClick={() => router.push("/login")} className="transition-transform active:scale-[0.98]">Mégse</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
