"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Orb from "@/components/Orb"
import { CheckCircle2, User, Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { hu } from "date-fns/locale/hu"

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isInviteValid, setIsInviteValid] = useState(false)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("invite")
    if (token) {
      setLoading(true)
      fetch(`/api/auth/invite?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setEmail(data.email)
            setInviteToken(token)
            setIsInviteValid(true)
            setInviteExpiresAt(data.expiresAt)
            toast.success("Meghívó érvényesítve")
          } else {
            toast.error(data.error || "Érvénytelen meghívó")
          }
        })
        .catch(() => {
          toast.error("Hiba a meghívó ellenőrzésekor")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [searchParams])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, inviteToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as any).error || "Sikertelen regisztráció")
        setLoading(false)
        return
      }

      // If invited, redirect to login immediately as they are auto-approved
      if (isInviteValid) {
        toast.success("Sikeres regisztráció! Jelentkezz be.")
        router.push("/login")
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
    <div className="relative w-full flex justify-center min-h-screen items-center bg-background p-4">
      <Card className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border-border bg-card/80 backdrop-blur shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Left Column - Form */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-card/50">
          <CardHeader className="space-y-1 text-center pb-2 px-0">
            <CardTitle className="text-3xl font-bold tracking-tight">Regisztráció</CardTitle>
            <CardDescription className="text-base">
              {success ? "Fiók létrehozása sikeres" : "Készíts új fiókot a rendszer használatához"}
              {isInviteValid && inviteExpiresAt && (
                <span className="block mt-2 text-sm text-amber-600 font-medium">
                  A meghívó lejár: {formatDistanceToNow(new Date(inviteExpiresAt), { locale: hu, addSuffix: true })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-0">
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
                  className="w-full h-11 text-base transition-all active:scale-[0.98] font-semibold shadow-lg shadow-primary/20"
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
                        className="pl-9 h-11 transition-all focus:ring-2 focus:ring-primary/20"
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
                        readOnly={isInviteValid}
                        className={cn("pl-9 h-11 transition-all focus:ring-2 focus:ring-primary/20", isInviteValid && "bg-muted text-muted-foreground")}
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
                        className="pl-9 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground pl-1">Legalább 8 karakter hosszú legyen</p>
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
                        Regisztráció...
                      </>
                    ) : "Regisztráció küldése"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => router.push("/login")}
                      className="w-full text-muted-foreground hover:text-foreground transition-colors h-auto p-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Már van fiókom
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </div>

        {/* Right Column - Visual */}
        <div className="hidden md:block">
          <div className="relative flex flex-col justify-end p-8 text-white h-full w-full bg-black/20 min-h-[600px] rounded-l-3xl overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Orb hoverIntensity={0.5} rotateOnHover={true} hue={120} forceHoverState={false} />
            </div>
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 space-y-3 max-w-lg text-right ml-auto">
              <h2 className="text-4xl font-bold leading-tight tracking-tight">Csatlakozz a csapathoz</h2>
              <p className="text-lg text-white/90 leading-relaxed font-normal">
                Regisztrálj és kövesd nyomon hírdetéseid még ma!
              </p>
            </div>
          </div>
        </div>

      </Card>
    </div>
  )
}
