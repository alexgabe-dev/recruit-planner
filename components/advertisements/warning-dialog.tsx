"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Send } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  username: string
  display_name: string | null
  role: string
}

export function WarningDialog() {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)

  useEffect(() => {
    if (open) {
      setFetchingUsers(true)
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUsers(data)
          }
        })
        .catch(() => toast.error("Nem sikerült betölteni a felhasználókat"))
        .finally(() => setFetchingUsers(false))
    }
  }, [open])

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error("Válassz címzettet!")
      return
    }
    if (!message.trim()) {
      toast.error("Írj üzenetet!")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/send-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: parseInt(selectedUser),
          message: message.trim(),
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Hiba a küldés során")
      }

      toast.success("Figyelmeztetés elküldve!")
      setOpen(false)
      setMessage("")
      setSelectedUser("")
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="icon" 
          className="h-8 w-8 ml-2 shadow-sm hover:scale-105 transition-transform"
          title="Figyelmeztetés küldése"
        >
          <AlertTriangle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Figyelmeztetés küldése
          </DialogTitle>
          <DialogDescription>
            Küldj értesítést adminnak vagy felhasználónak lejárt hirdetésekről vagy egyéb fontos ügyekről.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Címzett</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser} disabled={fetchingUsers}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder={fetchingUsers ? "Betöltés..." : "Válassz felhasználót"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.display_name || user.username} ({user.role === 'admin' ? 'Admin' : 'Felhasználó'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Üzenet</Label>
            <Textarea
              id="message"
              placeholder="Pl.: A 'Marketing Manager' hirdetés holnap lejár..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-32 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Mégse
          </Button>
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            {loading ? "Küldés..." : (
              <>
                <Send className="h-4 w-4" />
                Küldés
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
