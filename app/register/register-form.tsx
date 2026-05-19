"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KorvoLogo } from "@/components/korvo-logo"
import { cn } from "@/lib/utils"
import { CheckCircle2, User, Mail, Lock, Loader2, ArrowLeft, Activity, ShieldCheck, Network } from "lucide-react"
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
    <div className="korvo-grid relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="relative z-10 grid w-full max-w-6xl grid-cols-1 overflow-hidden border-border bg-card shadow-[0_24px_80px_rgb(0_0_0/0.42)] animate-in fade-in slide-in-from-bottom-4 duration-700 md:grid-cols-2">

        {/* Left Column - Form */}
        <div className="flex flex-col justify-center bg-card p-8 md:p-12">
          <CardHeader className="space-y-1 text-center pb-2 px-0">
            <CardTitle className="text-3xl font-semibold tracking-normal">Regisztráció</CardTitle>
            <CardDescription className="text-base">
              {success ? "Fiók létrehozása sikeres" : "Készíts új fiókot a rendszer használatához"}
              {isInviteValid && inviteExpiresAt && (
                <span className="mt-2 block text-sm font-medium text-warning">
                  A meghívó lejár: {formatDistanceToNow(new Date(inviteExpiresAt), { locale: hu, addSuffix: true })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-0">
            {success ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
                <div className="rounded-full border border-success/30 bg-[rgb(34_197_94/0.12)] p-3">
                  <CheckCircle2 className="h-12 w-12 text-[#86efac]" />
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
                  className="w-full h-11 text-base font-semibold"
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
                    className="w-full h-11 text-base font-semibold"
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
          <div className="korvo-grid flex h-full min-h-[600px] flex-col justify-between border-l border-border p-8">
            <KorvoLogo className="ml-auto" />

            <div className="ml-auto max-w-md space-y-7 text-right">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase text-[#a78bfa]">Team access</p>
                <h2 className="text-4xl font-semibold leading-tight text-foreground">Operational access, cleanly managed</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Jóváhagyott felhasználók, szerepkörök és kampány workflow-k egy kontrollált felületen.
                </p>
              </div>

              <div className="grid gap-3 text-left">
                {[
                  { label: "Invite flow", value: "Controlled", icon: ShieldCheck },
                  { label: "Campaign view", value: "Unified", icon: Activity },
                  { label: "Partner data", value: "Ready", icon: Network },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-[#a78bfa]" />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </Card>
    </div>
  )
}
