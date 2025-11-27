"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Orb from "@/components/Orb"

export default function ResetPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const token = params.get("token") || ""

  useEffect(() => {
    if (!token) {
      setError("Hiányzó token")
    }
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as any).error || "Sikertelen visszaállítás")
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
      <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Jelszó visszaállítása</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Sikeres visszaállítás. Bejelentkezhetsz az új jelszóval.</p>
              <Button onClick={() => router.push("/login")}>Bejelentkezés</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-1">
                <label className="text-sm">Új jelszó</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full" disabled={loading || !token} type="submit">
                {loading ? "Folyamatban…" : "Jelszó beállítása"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
