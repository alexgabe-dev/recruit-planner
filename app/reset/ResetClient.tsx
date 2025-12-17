"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Loader2, CheckCircle2, ArrowRight } from "lucide-react"

export default function ResetClient() {
  const params = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const token = params.get("token") || ""

  useEffect(() => {
    if (!token) {
      setError("Hiányzó vagy érvénytelen visszaállítási token")
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
    <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="space-y-1 text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">Jelszó visszaállítása</CardTitle>
        <CardDescription>
          {success ? "Jelszó sikeresen frissítve" : "Add meg az új jelszavadat"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {success ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2 text-center max-w-xs mx-auto">
              <h3 className="text-lg font-semibold">Sikeres visszaállítás!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A jelszavad sikeresen megváltozott. Most már bejelentkezhetsz az új jelszóval.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/login")} 
              className="w-full transition-all active:scale-[0.98]"
              size="lg"
            >
              Bejelentkezés
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Új jelszó</label>
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
                <p className="text-[0.8rem] text-muted-foreground pl-1">Legalább 8 karakter hosszú legyen</p>
              </div>
            </div>

            <Button 
              className="w-full transition-all active:scale-[0.98] font-semibold" 
              disabled={loading || !token} 
              type="submit"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mentés folyamatban...
                </>
              ) : "Jelszó beállítása"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
