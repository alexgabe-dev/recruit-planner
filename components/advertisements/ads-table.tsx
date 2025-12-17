"use client"

import { useState, useMemo, useEffect } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/db-store"
import { type Ad, type Partner, getAdStatus, type AdStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { TypeBadge } from "@/components/ui/type-badge"
import { exportToExcel } from "@/lib/excel-export"
import { toast } from "sonner"
import { ArrowUpDown, Download, Search, Filter, Columns, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"
import { AdFormDialog } from "./ad-form-dialog"
import { DeleteAdDialog } from "./delete-ad-dialog"

type AdWithPartner = Ad & { partner: Partner; status: AdStatus }

export function AdsTable() {
  const { ads, partners } = useStore()
  const [role, setRole] = useState<string | null>(null)
  const [me, setMe] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")

  // Filter states
  const [officeFilter, setOfficeFilter] = useState<string>("all")
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [editingAd, setEditingAd] = useState<AdWithPartner | null>(null)
  const [deletingAd, setDeletingAd] = useState<AdWithPartner | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Transform data
  const data: AdWithPartner[] = useMemo(() => {
    return ads.map((ad) => ({
      ...ad,
      partner: partners.find((p) => p.id === ad.partnerId)!,
      status: getAdStatus(ad),
    }))
  }, [ads, partners])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setMe(data)
        setRole(data.role)
        if (data.role === 'admin') {
           // Admin might want to see user list for filtering (if implemented)
           // But existing code had logic for 'viewer' to see users? 
           // Let's just fetch users if admin for potential future use or existing logic
           // The original code: if (me.role === 'viewer') fetch users... 
           // I'll leave it out for now unless needed.
        }
      } catch {}
    })()
  }, [])

  // Get unique values for filters
  const offices = useMemo(() => [...new Set(partners.map((p) => p.office))].sort(), [partners])
  const partnerNames = useMemo(() => [...new Set(partners.map((p) => p.name))].sort(), [partners])
  const adTypes: Ad["type"][] = ["kampány", "post", "kiemelt post", "Profession"]
  const statuses: AdStatus[] = ["Aktív", "Időzített", "Lejárt"]

  // Apply custom filters
  const filteredData = useMemo(() => {
    return data.filter((ad) => {
      if (officeFilter !== "all" && ad.partner?.office !== officeFilter) return false
      if (partnerFilter !== "all" && ad.partner?.name !== partnerFilter) return false
      if (typeFilter !== "all" && ad.type !== typeFilter) return false
      if (statusFilter !== "all" && ad.status !== statusFilter) return false
      if (globalFilter) {
        const search = globalFilter.toLowerCase()
        return (
          ad.positionName.toLowerCase().includes(search) ||
          ad.adContent.toLowerCase().includes(search) ||
          ad.partner?.name.toLowerCase().includes(search) ||
          ad.partner?.office.toLowerCase().includes(search)
        )
      }
      return true
    })
  }, [data, officeFilter, partnerFilter, typeFilter, statusFilter, globalFilter])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const columns: ColumnDef<AdWithPartner>[] = [
    {
      accessorKey: "partner.office",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Iroda
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.partner?.office}</span>,
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      accessorKey: "partner.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Partner
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.partner?.name}</span>,
    },
    {
      accessorKey: "positionName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Munkakör
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("positionName")}</span>,
    },
    {
      accessorKey: "adContent",
      header: "Hirdetés",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.getValue("adContent")}>
          {row.getValue("adContent")}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Típus",
      cell: ({ row }) => <TypeBadge type={row.getValue("type")} />,
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Kezdés
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue("startDate")),
      sortingFn: "datetime",
      meta: {
        className: "hidden lg:table-cell",
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Vége
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue("endDate")),
      sortingFn: "datetime",
      meta: {
        className: "hidden lg:table-cell",
      },
    },
    {
      accessorKey: "status",
      header: "Státusz",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
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
              <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setEditingAd(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Szerkesztés
              </Button>
            )}
            {role !== 'viewer' && (
              <Button
                variant="ghost"
                className="w-full justify-start px-2 text-destructive hover:text-destructive"
                onClick={() => setDeletingAd(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Törlés
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  const handleExport = () => {
    exportToExcel({ ads: filteredData })
    toast.success("Excel fájl sikeresen exportálva!")
  }

  const clearFilters = () => {
    setOfficeFilter("all")
    setPartnerFilter("all")
    setTypeFilter("all")
    setStatusFilter("all")
    setGlobalFilter("")
  }

  const hasActiveFilters =
    officeFilter !== "all" ||
    partnerFilter !== "all" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    globalFilter !== ""

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Keresés munkakör, hirdetés, partner..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {me?.role !== 'viewer' && me?.role !== 'visitor' && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Új hirdetés
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            CSV export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Oszlopok</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnNames: Record<string, string> = {
                    "partner.office": "Iroda",
                    "partner.name": "Partner",
                    positionName: "Munkakör",
                    adContent: "Hirdetés",
                    type: "Típus",
                    startDate: "Kezdés",
                    endDate: "Vége",
                    status: "Státusz",
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={officeFilter} onValueChange={setOfficeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Iroda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes iroda</SelectItem>
            {offices.map((office) => (
              <SelectItem key={office} value={office}>
                {office}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={partnerFilter} onValueChange={setPartnerFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Partner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes partner</SelectItem>
            {partnerNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Típus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes típus</SelectItem>
            {adTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Státusz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes státusz</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Szűrők törlése
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">{filteredData.length} hirdetés</span>
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

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("bg-muted/50", (header.column.columnDef as any).meta?.className)}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={(cell.column.columnDef as any).meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nincs találat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AdFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create" />
      {editingAd && (
        <AdFormDialog
          open={!!editingAd}
          onOpenChange={(open) => !open && setEditingAd(null)}
          mode="edit"
          ad={editingAd}
        />
      )}
      {deletingAd && (
        <DeleteAdDialog open={!!deletingAd} onOpenChange={(open) => !open && setDeletingAd(null)} ad={deletingAd} />
      )}
    </div>
  )
}
