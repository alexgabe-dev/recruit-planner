"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KorvoLogo } from "@/components/korvo-logo"
import { Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react"

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
    <div className="korvo-grid relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="relative z-10 grid w-full max-w-6xl grid-cols-1 overflow-hidden border-border bg-card shadow-[0_24px_80px_rgb(0_0_0/0.42)] animate-in fade-in slide-in-from-bottom-8 duration-700 md:grid-cols-2">
        
        {/* Left Column - Visual */}
        <div className="hidden md:block">
          <div className="korvo-grid flex h-full min-h-[600px] flex-col justify-between border-r border-border p-8">
            <KorvoLogo />

            <div className="space-y-7">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase text-[#a78bfa]">Recovery</p>
                <h2 className="text-4xl font-semibold leading-tight text-foreground">Account recovery without noise</h2>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  A hozzáférés visszaállítása kontrollált, egyértelmű folyamatban történik.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-[#a78bfa]" />
                    <span className="text-sm text-muted-foreground">Reset flow</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">Protected</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-[#a78bfa]" />
                    <span className="text-sm text-muted-foreground">Session integrity</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">Checked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col justify-center bg-card p-8 md:p-12">
          <KorvoLogo className="mx-auto mb-8 md:hidden" />
          <CardHeader className="space-y-1 text-center pb-2 px-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100 fill-mode-forwards">
            <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C3AED] text-sm font-semibold text-[#FAFAFA]">
              K
            </div>
            <CardTitle className="text-3xl font-semibold tracking-normal">Helyreállítás</CardTitle>
            <CardDescription className="text-base">
              {sent ? "Email elküldve" : "Add meg a fiókodhoz tartozó email címet vagy felhasználónevet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-200 fill-mode-forwards">
            {sent ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
                <div className="rounded-full border border-primary/30 bg-[rgb(124_58_237/0.12)] p-3">
                  <CheckCircle2 className="h-12 w-12 text-[#c4b5fd]" />
                </div>
                <div className="space-y-2 text-center max-w-xs mx-auto">
                  <h3 className="text-lg font-semibold">Ellenőrizd az email fiókod!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ha létezik ilyen felhasználó, elküldtük a visszaállítási linket.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push("/login")} 
                  className="w-full h-11 text-base font-semibold"
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
                    className="w-full h-11 text-base font-semibold"
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
