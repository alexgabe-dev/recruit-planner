"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Orb from "@/components/Orb"
import { CheckCircle2, User, Mail, Lock, Loader2, ArrowLeft } from "lucide-react"

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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 opacity-30">
        <Orb hue={220} hoverIntensity={0.1} />
      </div>
      
      <Card className="relative z-10 w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Regisztráció</CardTitle>
          <CardDescription>
            {success ? "Fiók létrehozása sikeres" : "Készíts új fiókot a rendszer használatához"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {success ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2 text-center max-w-xs mx-auto">
                <h3 className="text-lg font-semibold">Köszönjük a regisztrációt!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A fiókod jelenleg <span className="font-medium text-foreground">jóváhagyásra vár</span>. 
                  Az adminisztrátor értesítést kapott és hamarosan aktiválja a hozzáférésed.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full transition-all active:scale-[0.98]"
                size="lg"
              >
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
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Felhasználónév</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary/20" 
                      placeholder="jkovacs"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email cím</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary/20" 
                      placeholder="janos@pelda.hu"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jelszó</label>
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
                      Regisztráció...
                    </>
                  ) : "Regisztráció küldése"}
                </Button>
                
                <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={() => router.push("/login")} 
                  className="w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Már van fiókom
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
