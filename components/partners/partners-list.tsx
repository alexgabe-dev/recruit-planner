"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/db-store"
import { type Partner, getAdStatus } from "@/lib/types"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2 } from "lucide-react"
import { PartnerFormDialog } from "./partner-form-dialog"
import { DeletePartnerDialog } from "./delete-partner-dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PartnersList() {
  const { partners, ads } = useStore()
  const [role, setRole] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const me = await res.json()
        setRole(me.role || 'user')
        if (me.role === 'viewer') {
          const u = await fetch('/api/users', { cache: 'no-store' })
          if (u.ok) {
            const list = await u.json()
            setUsers(list)
            const last = typeof window !== 'undefined' ? window.localStorage.getItem('viewerLastUserId') : null
            if (last) setSelectedUserId(Number(last))
          }
        }
      } catch {}
    })()
  }, [])

  // Partners with ad counts
  const partnersWithStats = useMemo(() => {
    return partners.map((partner) => {
      const partnerAds = ads.filter((ad) => ad.partnerId === partner.id)
      const activeAds = partnerAds.filter((ad) => getAdStatus(ad) === "Aktív").length
      return {
        ...partner,
        totalAds: partnerAds.length,
        activeAds,
      }
    })
  }, [partners, ads])

  // Filtered partners
  const filteredPartners = useMemo(() => {
    if (!searchQuery) return partnersWithStats
    const query = searchQuery.toLowerCase()
    return partnersWithStats.filter(
      (partner) => partner.name.toLowerCase().includes(query) || partner.office.toLowerCase().includes(query),
    )
  }, [partnersWithStats, searchQuery])

  // Group by office
  const partnersByOffice = useMemo(() => {
    const grouped: Record<string, typeof filteredPartners> = {}
    filteredPartners.forEach((partner) => {
      if (!grouped[partner.office]) {
        grouped[partner.office] = []
      }
      grouped[partner.office].push(partner)
    })
    return grouped
  }, [filteredPartners])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Keresés partner vagy iroda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {role !== 'viewer' && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Új partner
          </Button>
        )}
        {role === 'viewer' && (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={(v) => {
              const id = Number(v)
              setSelectedUserId(id)
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('viewerLastUserId', String(id))
              }
              useStore.getState().loadData(id)
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Felhasználó" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-2">
                <Building2 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partners.length}</p>
                <p className="text-sm text-muted-foreground">Összes partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[oklch(0.7_0.15_160/0.1)] p-2">
                <Building2 className="h-5 w-5 text-[oklch(0.7_0.15_160)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{[...new Set(partners.map((p) => p.office))].length}</p>
                <p className="text-sm text-muted-foreground">Irodák száma</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[oklch(0.65_0.2_250/0.1)] p-2">
                <Building2 className="h-5 w-5 text-[oklch(0.65_0.2_250)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partnersWithStats.reduce((acc, p) => acc + p.activeAds, 0)}</p>
                <p className="text-sm text-muted-foreground">Aktív hirdetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Partnerek listája</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/50">Partner neve</TableHead>
                  <TableHead className="bg-muted/50">Iroda</TableHead>
                  <TableHead className="bg-muted/50 text-center">Hirdetések</TableHead>
                  <TableHead className="bg-muted/50 text-center">Aktív</TableHead>
                  <TableHead className="bg-muted/50 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nincs találat
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{partner.office}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{partner.totalAds}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            partner.activeAds > 0
                              ? "bg-[oklch(0.7_0.18_145/0.2)] text-[oklch(0.7_0.18_145)]"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {partner.activeAds}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Műveletek</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {role !== 'viewer' && (
                              <Button
                                variant="ghost"
                                className="w-full justify-start px-2"
                                onClick={() => setEditingPartner(partner)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Szerkesztés
                              </Button>
                            )}
                            {role !== 'viewer' && (
                              <Button
                                variant="ghost"
                                className="w-full justify-start px-2 text-destructive hover:text-destructive"
                                onClick={() => setDeletingPartner(partner)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Törlés
                              </Button>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PartnerFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create" />
      {editingPartner && (
        <PartnerFormDialog
          open={!!editingPartner}
          onOpenChange={(open) => !open && setEditingPartner(null)}
          mode="edit"
          partner={editingPartner}
        />
      )}
      {deletingPartner && (
        <DeletePartnerDialog
          open={!!deletingPartner}
          onOpenChange={(open) => !open && setDeletingPartner(null)}
          partner={deletingPartner}
        />
      )}
    </div>
  )
}
