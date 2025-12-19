"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { Loader2, Download, Search, RefreshCw, Filter } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: "",
    action: "all",
    entityType: "all"
  })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.userId) params.append("userId", filters.userId)
      if (filters.action !== "all") params.append("action", filters.action)
      if (filters.entityType !== "all") params.append("entityType", filters.entityType)
      params.append("limit", "100") // TODO: Implement pagination

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
  }, []) // Initial load

  const handleSearch = () => {
    fetchLogs()
  }

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("Nincs exportálható adat")
      return
    }

    const headers = ["ID", "Dátum", "Felhasználó", "Művelet", "Típus", "Entitás ID", "Részletek"]
    const csvContent = [
      headers.join(";"),
      ...logs.map(log => [
        log.id,
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.username || "Rendszer",
        log.action,
        log.entity_type || "-",
        log.entity_id || "-",
        `"${(log.details || "").replace(/"/g, '""')}"` // Escape quotes
      ].join(";"))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `activity_log_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge className="bg-green-500 hover:bg-green-600">Létrehozás</Badge>
      case 'update': return <Badge className="bg-blue-500 hover:bg-blue-600">Módosítás</Badge>
      case 'delete': return <Badge className="bg-red-500 hover:bg-red-600">Törlés</Badge>
      case 'login': return <Badge variant="outline" className="border-green-500 text-green-500">Belépés</Badge>
      case 'logout': return <Badge variant="outline" className="border-gray-500 text-gray-500">Kilépés</Badge>
      default: return <Badge variant="secondary">{action}</Badge>
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tevékenységnapló</h1>
            <p className="text-muted-foreground">A rendszerben történt események részletes listája.</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportálás (CSV)
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Szűrés</CardTitle>
            <CardDescription>Szűkítsd a találatokat a feltételek megadásával.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1 w-full">
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
                    <SelectItem value="create">Létrehozás</SelectItem>
                    <SelectItem value="update">Módosítás</SelectItem>
                    <SelectItem value="delete">Törlés</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 flex-1 w-full">
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
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 flex-1 w-full">
                 <label className="text-sm font-medium">Felhasználó ID</label>
                 <Input 
                    placeholder="pl. 1" 
                    value={filters.userId}
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                 />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="gap-2">
                    <Search className="h-4 w-4" />
                    Keresés
                </Button>
                <Button variant="ghost" onClick={() => {
                    setFilters({ userId: "", action: "all", entityType: "all" })
                    setTimeout(fetchLogs, 0)
                }} size="icon" title="Alaphelyzet">
                    <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md border bg-card">
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
