"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import { hu } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, Shield, User as UserIcon, Eye, UserX } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User {
  id: number
  username: string
  display_name: string | null
  role: string
  last_seen: string | null
  email: string | null
  status: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const router = useRouter()

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/users')
      .then(res => {
        if (res.status === 403) {
            router.push('/')
            throw new Error('Forbidden')
        }
        if (res.ok) return res.json()
        throw new Error('Failed')
      })
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch((e) => {
        if (e.message !== 'Forbidden') setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsers()
  }, [router])

  const handleUpdateUser = async (role: string, status: string) => {
    if (!editingUser) return
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status })
      })
      
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Nem sikerült a frissítés")
        return
      }

      toast.success("Felhasználó frissítve")
      setEditingUser(null)
      fetchUsers()
    } catch {
      toast.error("Hiba történt")
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Nem sikerült a törlés")
        return
      }

      toast.success("Felhasználó törölve")
      setDeletingUser(null)
      fetchUsers()
    } catch {
      toast.error("Hiba történt")
    }
  }

  const handleQuickApprove = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })
      if (res.ok) {
        toast.success("Regisztráció elfogadva")
        fetchUsers()
      } else {
        toast.error("Hiba történt")
      }
    } catch {
      toast.error("Hiba történt")
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>
      case 'user':
        return <Badge variant="default" className="gap-1"><UserIcon className="h-3 w-3" /> User</Badge>
      case 'viewer':
        return <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> Viewer</Badge>
      case 'visitor':
        return <Badge variant="outline" className="gap-1"><UserX className="h-3 w-3" /> Visitor</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Aktív
        </span>
      )
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">
          <Shield className="mr-1 h-3 w-3" />
          Függőben
        </span>
      )
    }
    return <Badge variant="outline">{status}</Badge>
  }

  if (loading) {
    return (
        <MainLayout>
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Felhasználók kezelése</h1>
          <p className="text-muted-foreground">Felhasználók és jogosultságok áttekintése</p>
        </div>

        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Felhasználónév</TableHead>
                        <TableHead>Név</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Szerepkör</TableHead>
                        <TableHead>Státusz</TableHead>
                        <TableHead>Utoljára aktív</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => {
                        const isOnline = user.last_seen && (new Date().getTime() - new Date(user.last_seen).getTime() < 5 * 60 * 1000)
                        return (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} title={isOnline ? "Online" : "Offline"} />
                                    {user.username}
                                </div>
                            </TableCell>
                            <TableCell>{user.display_name || '-'}</TableCell>
                            <TableCell>{user.email || '-'}</TableCell>
                            <TableCell>
                                {getRoleBadge(user.role)}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(user.status)}
                            </TableCell>
                            <TableCell>
                                {user.last_seen 
                                    ? format(new Date(user.last_seen), "yyyy. MM. dd. HH:mm", { locale: hu })
                                    : 'Soha'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {user.status === 'pending' && (
                                        <Button size="sm" variant="outline" className="h-8 border-green-500 text-green-600 hover:bg-green-50" onClick={() => handleQuickApprove(user)}>
                                            Elfogad
                                        </Button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Menü</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Műveletek</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Szerkesztés
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingUser(user)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Törlés
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditUserDialog 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onSave={handleUpdateUser}
      />

      {/* Delete Dialog */}
      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        user={deletingUser}
        onConfirm={handleDeleteUser}
      />
    </MainLayout>
  )
}

function EditUserDialog({ open, onOpenChange, user, onSave }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    user: User | null;
    onSave: (role: string, status: string) => void;
}) {
    const [role, setRole] = useState(user?.role || 'user')
    const [status, setStatus] = useState(user?.status || 'active')

    useEffect(() => {
        if (user) {
            setRole(user.role)
            setStatus(user.status)
        }
    }, [user])

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Felhasználó szerkesztése</DialogTitle>
                    <DialogDescription>
                        {user.username} adatainak módosítása
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Szerepkör</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Válassz szerepkört" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="visitor">Visitor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Státusz</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Válassz státuszt" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Aktív</SelectItem>
                                <SelectItem value="pending">Függőben</SelectItem>
                                <SelectItem value="disabled">Letiltva</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
                    <Button onClick={() => onSave(role, status)}>Mentés</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteUserDialog({ open, onOpenChange, user, onConfirm }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    onConfirm: () => void;
}) {
    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Felhasználó törlése</DialogTitle>
                    <DialogDescription>
                        Biztosan törölni szeretnéd a következő felhasználót: <strong>{user.username}</strong>?
                        Ez a művelet nem vonható vissza.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
                    <Button variant="destructive" onClick={onConfirm}>Törlés</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
