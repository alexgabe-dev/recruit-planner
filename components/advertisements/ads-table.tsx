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
  type RowSelectionState,
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
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/lib/db-store"
import { type Ad, type Partner, getAdStatus, type AdStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { TypeBadge } from "@/components/ui/type-badge"
import { exportToExcel } from "@/lib/excel-export"
import { toast } from "sonner"
import { ArrowUpDown, Download, Search, Filter, Columns, MoreHorizontal, Pencil, Trash2, Plus, X, Ban, Calendar as CalendarIcon } from "lucide-react"
import { AdFormDialog } from "./ad-form-dialog"
import { DeleteAdDialog } from "./delete-ad-dialog"
import { WarningDialog } from "./warning-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns/format"
import { hu } from "date-fns/locale/hu"
import { DateRange } from "react-day-picker"
import { useLanguage } from "@/components/language-provider"

type AdWithPartner = Ad & { partner: Partner; status: AdStatus }

export function AdsTable() {
  const { t, locale } = useLanguage()
  const { ads, partners, updateAd, deleteAd } = useStore()
  const [role, setRole] = useState<string | null>(null)
  const [me, setMe] = useState<any>(null)
  // Default sorting: Status (Active first), which effectively uses our custom logic below
  const [sorting, setSorting] = useState<SortingState>([{ id: "status", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ select: false, businessArea: false })

  // Update visibility based on role
  useEffect(() => {
    if (role === 'viewer') {
      setColumnVisibility(prev => ({ ...prev, select: false }))
    }
  }, [role])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState<number | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")

  // Filter states
  const [officeFilter, setOfficeFilter] = useState<string>("all")
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const [businessAreaFilter, setBusinessAreaFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  // Dialog states
  const [editingAd, setEditingAd] = useState<AdWithPartner | null>(null)
  const [deletingAd, setDeletingAd] = useState<AdWithPartner | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  // Transform data
  const data: AdWithPartner[] = useMemo(() => {
    return ads.map((ad) => ({
      ...ad,
      partner: partners.find((p) => p.id === ad.partnerId)!,
      status: getAdStatus(ad),
    }))
  }, [ads, partners])

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setMe(data)
        setRole(data.role === 'visitor' ? 'viewer' : data.role)
      } catch { }
    })()
  }, [])

  // Bulk Actions
  const handleBulkStatusChange = async (active: boolean) => {
    const selectedIds = Object.keys(rowSelection).map((index) => filteredData[parseInt(index)].id)
    if (selectedIds.length === 0) return

    try {
      const promises = selectedIds.map(id => updateAd(id, { isActive: active }))
      await Promise.all(promises)
      toast.success(`${selectedIds.length} hirdetés státusza módosítva!`)
      setRowSelection({})
    } catch (error) {
      toast.error("Hiba történt a státusz módosítása közben")
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map((index) => filteredData[parseInt(index)].id)
    if (selectedIds.length === 0) return

    try {
      const promises = selectedIds.map(id => deleteAd(id))
      await Promise.all(promises)
      toast.success(`${selectedIds.length} hirdetés törölve!`)
      setRowSelection({})
      setIsBulkDeleteOpen(false)
    } catch (error) {
      toast.error("Hiba történt a törlés közben")
    }
  }


  // Get unique values for filters
  const offices = useMemo(() => [...new Set(partners.map((p) => p.office))].sort(), [partners])
  const partnerNames = useMemo(() => [...new Set(partners.map((p) => p.name))].sort(), [partners])
  const businessAreas: Ad["businessArea"][] = ["Kölcsönzés", "Közvetítés"]
  const adTypes: Ad["type"][] = ["kampány", "post", "kiemelt post", "Profession"]
  const statuses: AdStatus[] = ["Aktív", "Időzített", "Lejárt"]

  // Apply custom filters
  const filteredData = useMemo(() => {
    return data.filter((ad) => {
      if (officeFilter !== "all" && ad.partner?.office !== officeFilter) return false
      if (partnerFilter !== "all" && ad.partner?.name !== partnerFilter) return false
      if (businessAreaFilter !== "all" && ad.businessArea !== businessAreaFilter) return false
      if (typeFilter !== "all" && ad.type !== typeFilter) return false
      if (statusFilter !== "all" && ad.status !== statusFilter) return false

      // Date range filter (Overlap logic)
      if (dateRange?.from) {
        const rangeStart = dateRange.from.getTime()
        const rangeEnd = dateRange.to ? dateRange.to.getTime() : rangeStart
        const adStart = new Date(ad.startDate).getTime()
        const adEnd = new Date(ad.endDate).getTime()

        // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
        if (!(adStart <= rangeEnd && adEnd >= rangeStart)) {
          return false
        }
      }

      if (globalFilter) {
        const search = globalFilter.toLowerCase()
        return (
          ad.positionName.toLowerCase().includes(search) ||
          ad.adContent.toLowerCase().includes(search) ||
          ad.businessArea.toLowerCase().includes(search) ||
          ad.partner?.name.toLowerCase().includes(search) ||
          ad.partner?.office.toLowerCase().includes(search)
        )
      }
      return true
    })
  }, [data, officeFilter, partnerFilter, businessAreaFilter, typeFilter, statusFilter, globalFilter, dateRange])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const columns: ColumnDef<AdWithPartner>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Összes kijelölése"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row, table }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            setLastSelectedRowIndex(row.index)
          }}
          onClick={(e) => {
            if (e.shiftKey && lastSelectedRowIndex !== null) {
              e.preventDefault()
              const { rows } = table.getRowModel()
              const currentIndex = row.index
              const lastIndex = lastSelectedRowIndex

              const start = Math.min(currentIndex, lastIndex)
              const end = Math.max(currentIndex, lastIndex)

              const newSelection = { ...rowSelection }

              for (let i = start; i <= end; i++) {
                const r = rows[i]
                if (r) newSelection[r.id] = true
              }

              setRowSelection(newSelection)
              setLastSelectedRowIndex(currentIndex)
            }
          }}
          aria-label="Sor kijelölése"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "partner_office",
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
      id: "partner_name",
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
      meta: {
        className: "hidden sm:table-cell",
      },
    },
    {
      id: "businessArea",
      accessorKey: "businessArea",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Üzletág
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.getValue("businessArea")}</span>,
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      id: "positionName",
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
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium" title={row.getValue("positionName")}>
          {row.getValue("positionName")}
        </div>
      ),
      meta: {
        className: "max-w-[180px]",
      },
    },
    {
      id: "adContent",
      accessorKey: "adContent",
      header: "Hirdetés",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.getValue("adContent")}>
          {row.getValue("adContent")}
        </div>
      ),
      meta: {
        className: "hidden xl:table-cell max-w-[220px]",
      },
    },
    {
      id: "type",
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs"
        >
          Státusz
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      meta: {
        className: "w-[120px] text-center",
      },
      sortingFn: (rowA, rowB, columnId) => {
        const statusA = rowA.getValue(columnId) as string
        const statusB = rowB.getValue(columnId) as string

        // Priority: Aktív (0) > Időzített (1) > Lejárt (2)
        const getPriority = (s: string) => {
          if (s === "Aktív") return 0
          if (s === "Időzített") return 1
          if (s === "Lejárt") return 2
          return 3
        }

        const priorityA = getPriority(statusA)
        const priorityB = getPriority(statusB)
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }

        // Secondary sort: Start Date Descending (Newest first)
        // This ensures within "Active", the ones starting latest are at the top
        const dateA = new Date(rowA.original.startDate).getTime()
        const dateB = new Date(rowB.original.startDate).getTime()

        return dateB - dateA
      },
    },
    {
      id: "actions",
      header: "",
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
      meta: {
        className: "w-10 px-1 text-center",
      },
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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleExport = async () => {
    await exportToExcel({
      ads: filteredData,
      includeBusinessArea: table.getColumn("businessArea")?.getIsVisible() ?? false,
    })
    try {
      await fetch("/api/activity/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "ad",
          details: `Hirdetések exportálva (${filteredData.length} db)`,
        }),
      })
    } catch {}
    toast.success(t("ads.exportSuccess", "Excel fájl sikeresen exportálva!"))
  }

  const clearFilters = () => {
    setOfficeFilter("all")
    setPartnerFilter("all")
    setBusinessAreaFilter("all")
    setTypeFilter("all")
    setStatusFilter("all")
    setGlobalFilter("")
    setDateRange(undefined)
  }

  const hasActiveFilters = officeFilter !== "all" || partnerFilter !== "all" || businessAreaFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || globalFilter !== "" || dateRange !== undefined

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("ads.searchPlaceholder", "Keresés munkakör, hirdetés, partner...")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {me?.role !== 'viewer' && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("ads.newAd", "Új hirdetés")}
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t("ads.exportCsv", "CSV export")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("ads.optionalColumns", "Opcionális oszlopok")} title={t("ads.optionalColumns", "Opcionális oszlopok")}>
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("ads.optionalColumns", "Opcionális oszlopok")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnNames: Record<string, string> = {
                    select: "Kijelölés",
                    partner_office: "Iroda",
                    partner_name: "Partner",
                    businessArea: "Üzletág",
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 transition-colors duration-200",
            (showFilters || hasActiveFilters) && "border-primary text-primary bg-primary/10"
          )}
          onClick={() => setShowFilters((prev) => !prev)}
          aria-label={t("ads.filters", "Szűrők")}
          title={t("ads.filters", "Szűrők")}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <div
          className={cn(
            "min-w-0 overflow-hidden origin-left transition-[max-width,max-height,opacity,transform] duration-300 ease-in-out",
            showFilters
              ? "max-w-[1100px] max-h-14 opacity-100 translate-x-0"
              : "max-w-0 max-h-0 opacity-0 -translate-x-2 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 whitespace-nowrap pl-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-10 w-10 shrink-0",
                      dateRange && "border-primary text-primary bg-primary/10"
                    )}
                    title={dateRange?.from ? (dateRange.to ? `${format(dateRange.from, 'yyyy. MM. dd.', { locale: hu })} - ${format(dateRange.to, 'yyyy. MM. dd.', { locale: hu })}` : format(dateRange.from, 'yyyy. MM. dd.', { locale: hu })) : t("ads.period", "Időszak választása")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={hu}
                  />
                </PopoverContent>
              </Popover>

              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("ads.office", "Iroda")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ads.allOffice", "Összes iroda")}</SelectItem>
                  {offices.map((office) => (
                    <SelectItem key={office} value={office}>
                      {office}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("ads.partner", "Partner")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ads.allPartner", "Összes partner")}</SelectItem>
                  {partnerNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={businessAreaFilter} onValueChange={setBusinessAreaFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("ads.businessArea", "Üzletág")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ads.allBusinessArea", "Összes üzletág")}</SelectItem>
                  {businessAreas.map((businessArea) => (
                    <SelectItem key={businessArea} value={businessArea}>
                      {businessArea}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("ads.type", "Típus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ads.allType", "Összes típus")}</SelectItem>
                  {adTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("ads.status", "Státusz")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ads.allStatus", "Összes státusz")}</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  {t("ads.clearFilters", "Szűrők törlése")}
                </Button>
              )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filteredData.length} {locale === "en" ? "ads" : "hirdetés"}</span>
          {role === 'viewer' && <WarningDialog />}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table className="w-full table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("bg-muted/50 whitespace-normal break-words", (header.column.columnDef as any).meta?.className)}
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
                    <TableCell key={cell.id} className={cn("whitespace-normal break-words", (cell.column.columnDef as any).meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("ads.noResult", "Nincs találat")}
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

      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg transition-all duration-300 ease-in-out",
          Object.keys(rowSelection).length > 0 && (role === 'admin' || role === 'user')
            ? "translate-y-0 opacity-100"
            : "translate-y-[150%] opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 border-r pr-2 mr-2">
          <span className="text-sm font-medium px-2">
            {Object.keys(rowSelection).length} {t("ads.selectedCount", "kiválasztva")}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setRowSelection({})} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleBulkStatusChange(false)}
          className="text-orange-600 hover:text-orange-700"
        >
          <Ban className="mr-2 h-4 w-4" />
          {t("ads.close", "Lezárás")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsBulkDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("ads.delete", "Törlés")}
        </Button>
      </div>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd a kijelölt hirdetéseket?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem vonható vissza. {Object.keys(rowSelection).length} hirdetés véglegesen törlésre kerül.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ads.cancel", "Mégse")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("ads.delete", "Törlés")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
