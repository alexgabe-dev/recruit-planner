"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Orb from "@/components/Orb"

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as any).error || "Sikertelen kérés")
        setLoading(false)
        return
      }
      setSent(true)
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
          <CardTitle className="text-center text-2xl font-bold">Elfelejtett jelszó</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">Ha létezik ilyen felhasználó/email, elküldtük a visszaállítási linket.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-1">
                <label className="text-sm">Felhasználónév vagy email</label>
                <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="transition-colors focus:shadow-sm" />
              </div>
              <Button className="w-full transition-transform active:scale-[0.98]" disabled={loading} type="submit">
                {loading ? "Folyamatban…" : "Visszaállítási link kérése"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
