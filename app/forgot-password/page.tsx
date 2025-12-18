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
    <div className="relative w-full flex justify-center min-h-screen items-center bg-background p-4">
      <Card className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border-border bg-card/80 backdrop-blur shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Left Column - Visual */}
        <div className="hidden md:block">
          <div className="relative flex flex-col justify-end p-8 text-white h-full w-full bg-black/20 min-h-[600px] rounded-r-3xl overflow-hidden">
            <div className="absolute inset-0 z-0">
               <Orb hoverIntensity={0.5} rotateOnHover={true} hue={280} forceHoverState={false} />
            </div>
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="relative z-10 space-y-3 max-w-lg animate-in slide-in-from-left-8 fade-in duration-1000 delay-200 fill-mode-forwards">
               <h2 className="text-4xl font-bold leading-tight tracking-tight">Elfelejtett jelszó?</h2>
               <p className="text-lg text-white/90 leading-relaxed font-normal">
                 Semmi gond, segítünk visszaállítani a hozzáférésedet.
               </p>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-card/50">
          <CardHeader className="space-y-1 text-center pb-2 px-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100 fill-mode-forwards">
            <CardTitle className="text-3xl font-bold tracking-tight">Helyreállítás</CardTitle>
            <CardDescription className="text-base">
              {sent ? "Email elküldve" : "Add meg a fiókodhoz tartozó email címet vagy felhasználónevet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-200 fill-mode-forwards">
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
                  className="w-full h-11 text-base transition-all active:scale-[0.98] font-semibold shadow-lg shadow-primary/20"
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
                        className="pl-9 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                        placeholder="Email cím vagy felhasználónév"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button 
                    className="w-full h-11 text-base transition-all active:scale-[0.98] font-semibold shadow-lg shadow-primary/20" 
                    disabled={loading} 
                    type="submit"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Küldés...
                      </>
                    ) : "Helyreállító link küldése"}
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <Button 
                      variant="ghost" 
                      type="button" 
                      onClick={() => router.push("/login")} 
                      className="w-full text-muted-foreground hover:text-foreground transition-colors h-auto p-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Vissza a bejelentkezéshez
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </div>

      </Card>
    </div>
  )
}
