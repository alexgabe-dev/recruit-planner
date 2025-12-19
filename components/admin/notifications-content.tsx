"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

export function NotificationsContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Settings
  const [enabled, setEnabled] = useState(false)
  const [types, setTypes] = useState<string[]>(["kampány", "Profession", "kiemelt post"])
  
  // Test Send
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")

  useEffect(() => {
    fetchSettings()
    fetchUsers()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setEnabled(data.weekly_digest_enabled === true)
        if (data.weekly_digest_types) {
          setTypes(data.weekly_digest_types)
        }
      }
    } catch {
      toast.error("Nem sikerült betölteni a beállításokat")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter((u: any) => u.status === 'active' && u.email))
      }
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_digest_enabled: enabled,
          weekly_digest_types: types
        })
      })
      
      if (res.ok) {
        toast.success("Beállítások mentve")
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Hiba a mentés során")
    } finally {
      setSaving(false)
    }
  }

  const handleTestSend = async () => {
    if (!selectedUser) {
      toast.error("Válassz felhasználót a teszthez")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/cron/weekly-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser })
      })

      const data = await res.json()
      
      if (res.ok) {
        if (data.sent > 0) {
          toast.success(`Teszt levél elküldve (${data.sent} db)`)
        } else if (data.skipped > 0) {
          toast.info("Nem küldtünk levelet (nincs lejáró hirdetés vagy hiányzó email)")
        } else if (data.failed > 0) {
          toast.error(`Küldés sikertelen: ${data.errors?.[0] || "Ismeretlen hiba"}`)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || "Hiba a küldés során")
    } finally {
      setSending(false)
    }
  }

  const toggleType = (type: string) => {
    setTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Heti hirdetés emlékeztető</CardTitle>
          <CardDescription>
            Automatikus email küldése minden hétfőn a lejáró hirdetésekről.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="weekly-digest" 
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="weekly-digest">Automatikus küldés engedélyezése</Label>
          </div>

          <div className="space-y-3">
            <Label>Mely hirdetés típusokat figyelje?</Label>
            <div className="grid gap-2">
              {["kampány", "Profession", "kiemelt post"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={types.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="capitalize">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Beállítások mentése
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tesztelés</CardTitle>
          <CardDescription>
            Küldj teszt emlékeztetőt egy kiválasztott felhasználónak azonnal.
            Ez figyelembe veszi a fenti típus beállításokat, de a "kikapcsolt" állapotot figyelmen kívül hagyja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="test-user">Címzett</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Válassz felhasználót" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.display_name || user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTestSend} disabled={sending || !selectedUser} variant="secondary">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Teszt küldése
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
