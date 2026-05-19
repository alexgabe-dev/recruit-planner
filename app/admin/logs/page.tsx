"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns/format"
import { hu } from "date-fns/locale/hu"
import { Loader2, Download, Search, RefreshCw, Filter, CalendarIcon, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { exportLogsToExcel } from "@/lib/excel-export"

interface LogEntry {
  id: number
  user_id: number | null
  username: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  details: string | null
  created_at: string
}

interface User {
  id: number
  username: string
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: "all",
    action: "all",
    entityType: "all",
    search: "",
    date: undefined as DateRange | undefined
  })

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsers(data))
      .catch(() => { })
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.userId && filters.userId !== "all") params.append("userId", filters.userId)
      if (filters.action !== "all") params.append("action", filters.action)
      if (filters.entityType !== "all") params.append("entityType", filters.entityType)
      if (filters.search) params.append("search", filters.search)
      if (filters.date?.from) params.append("startDate", filters.date.from.toISOString())
      if (filters.date?.to) params.append("endDate", filters.date.to.toISOString())

      params.append("limit", "100")

      const res = await fetch(`/api/admin/logs?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch logs")
      const data = await res.json()
      setLogs(data)
    } catch (error) {
      console.error(error)
      toast.error("Hiba történt a napló betöltésekor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSearch = () => {
    fetchLogs()
  }

  const handleReset = () => {
    setFilters({
      userId: "all",
      action: "all",
      entityType: "all",
      search: "",
      date: undefined
    })
    setTimeout(fetchLogs, 0)
  }

  const handleExport = async () => {
    if (logs.length === 0) {
      toast.error("Nincs exportálható adat")
      return
    }

    await exportLogsToExcel({ logs })
    try {
      await fetch("/api/activity/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "activity_log",
          details: `Tevékenységnapló exportálva (${logs.length} sor)`,
        }),
      })
    } catch {}
    toast.success("Excel fájl sikeresen exportálva!")
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge className="border-[rgb(34_197_94/0.24)] bg-[rgb(34_197_94/0.12)] text-[#86efac]">Létrehozás</Badge>
      case 'update': return <Badge className="border-[rgb(124_58_237/0.24)] bg-[rgb(124_58_237/0.12)] text-[#c4b5fd]">Módosítás</Badge>
      case 'delete': return <Badge className="border-[rgb(239_68_68/0.3)] bg-[rgb(239_68_68/0.12)] text-[#fca5a5]">Törlés</Badge>
      case 'login': return <Badge variant="outline" className="border-success/30 bg-[rgb(34_197_94/0.1)] text-[#86efac]">Belépés</Badge>
      case 'logout': return <Badge variant="outline" className="border-border text-muted-foreground">Kilépés</Badge>
      case 'export': return <Badge className="border-warning/30 bg-[rgb(245_158_11/0.12)] text-[#fbbf24]">Export</Badge>
      default: return <Badge variant="secondary">{action}</Badge>
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 pt-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-[#a78bfa]">Audit trail</p>
            <h1 className="korvo-page-title">Tevékenységnapló</h1>
            <p className="korvo-page-description">A rendszerben történt események részletes listája.</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportálás (CSV)
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Szűrés</CardTitle>
            <CardDescription>Szűkítsd a találatokat a feltételek megadásával.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              {/* Date Range */}
              <div className="grid gap-1.5 w-full md:w-[240px]">
                <label className="text-sm font-medium">Időszak</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.date?.from ? (
                        filters.date.to ? (
                          <>
                            {format(filters.date.from, "yyyy. MM. dd.", { locale: hu })} -{" "}
                            {format(filters.date.to, "yyyy. MM. dd.", { locale: hu })}
                          </>
                        ) : (
                          format(filters.date.from, "yyyy. MM. dd.", { locale: hu })
                        )
                      ) : (
                        <span>Válassz dátumot</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.date?.from}
                      selected={filters.date}
                      onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
                      numberOfMonths={2}
                      locale={hu}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* User */}
              <div className="grid gap-1.5 flex-1 min-w-[140px]">
                <label className="text-sm font-medium">Felhasználó</label>
                <Select
                  value={filters.userId}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, userId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Összes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action */}
              <div className="grid gap-1.5 flex-1 min-w-[140px]">
                <label className="text-sm font-medium">Művelet</label>
                <Select
                  value={filters.action}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Összes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes</SelectItem>
                    <SelectItem value="login">Belépés</SelectItem>
                    <SelectItem value="logout">Kilépés</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="create">Létrehozás</SelectItem>
                    <SelectItem value="update">Módosítás</SelectItem>
                    <SelectItem value="delete">Törlés</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Type */}
              <div className="grid gap-1.5 flex-1 min-w-[140px]">
                <label className="text-sm font-medium">Entitás Típus</label>
                <Select
                  value={filters.entityType}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, entityType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Összes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="ad">Hirdetés</SelectItem>
                    <SelectItem value="user">Felhasználó</SelectItem>
                    <SelectItem value="invite">Meghívó</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="grid gap-1.5 flex-[2] min-w-[200px]">
                <label className="text-sm font-medium">Keresés (részletekben)</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Keresés..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Szűrés
                </Button>
                <Button variant="ghost" onClick={handleReset} size="icon" title="Alaphelyzet">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Időpont</TableHead>
                <TableHead>Felhasználó</TableHead>
                <TableHead>Művelet</TableHead>
                <TableHead>Típus</TableHead>
                <TableHead className="w-[40%]">Részletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Betöltés...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nincs megjeleníthető adat.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-muted-foreground text-xs">
                      {format(new Date(log.created_at), "yyyy. MM. dd. HH:mm:ss", { locale: hu })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.username || "Rendszer"}</div>
                      {log.user_id && <div className="text-xs text-muted-foreground">ID: {log.user_id}</div>}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{log.entity_type || "-"}</Badge>
                      {log.entity_id && <div className="text-xs text-muted-foreground mt-1">ID: {log.entity_id}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  )
}
