"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Orb from "@/components/Orb"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 opacity-30">
        <Orb hue={220} hoverIntensity={0.1} />
      </div>
      
      <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Elfelejtett jelszó</CardTitle>
          <CardDescription>
            {sent ? "Email elküldve" : "Add meg a fiókodhoz tartozó email címet vagy felhasználónevet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {sent ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                <CheckCircle2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2 text-center max-w-xs mx-auto">
                <h3 className="text-lg font-semibold">Ellenőrizd az email fiókod!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ha létezik ilyen felhasználó, elküldtük a visszaállítási linket.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full transition-all active:scale-[0.98]"
                size="lg"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Vissza a bejelentkezéshez
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
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Felhasználónév vagy email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={identifier} 
                      onChange={(e) => setIdentifier(e.target.value)} 
                      required 
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary/20" 
                      placeholder="Email cím vagy felhasználónév"
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
                      Küldés folyamatban...
                    </>
                  ) : "Visszaállítási link kérése"}
                </Button>
                
                <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={() => router.push("/login")} 
                  className="w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Mégse
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
