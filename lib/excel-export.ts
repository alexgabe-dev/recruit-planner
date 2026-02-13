import { type Ad, type Partner, getAdStatus } from "./types"
import ExcelJS from "exceljs"

interface ExportData {
  ads: (Ad & { partner?: Partner })[]
  includeBusinessArea?: boolean
}

export interface LogEntry {
  id: number
  username: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  details: string | null
  created_at: string
}

export async function exportLogsToExcel({ logs }: { logs: LogEntry[] }) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Tevékenységnapló")

  // Define columns
  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Dátum", key: "date", width: 20 },
    { header: "Felhasználó", key: "username", width: 20 },
    { header: "Művelet", key: "action", width: 15 },
    { header: "Típus", key: "type", width: 15 },
    { header: "Entitás ID", key: "entityId", width: 10 },
    { header: "Részletek", key: "details", width: 50 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" }, // Indigo-600
  }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }
  headerRow.height = 24

  // Map actions to Hungarian
  const getActionName = (action: string) => {
    switch (action) {
      case 'create': return 'Létrehozás'
      case 'update': return 'Módosítás'
      case 'delete': return 'Törlés'
      case 'login': return 'Belépés'
      case 'logout': return 'Kilépés'
      case 'export': return 'Exportálás'
      default: return action
    }
  }

  // Add data
  logs.forEach((log) => {
    const row = sheet.addRow({
      id: log.id,
      date: new Date(log.created_at),
      username: log.username || "Rendszer",
      action: getActionName(log.action),
      type: log.entity_type || "-",
      entityId: log.entity_id || "-",
      details: log.details || "-",
    })

    // Style data row
    row.alignment = { vertical: "middle" }
    row.getCell("id").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("date").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("action").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("type").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("entityId").alignment = { vertical: "middle", horizontal: "center" }

    // Format dates
    row.getCell("date").numFmt = "yyyy-mm-dd hh:mm"
  })

  // Add borders to all cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  // Generate filename
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hour = String(now.getHours()).padStart(2, "0")
  const minute = String(now.getMinutes()).padStart(2, "0")
  const filename = `tevekenysegnaplo_${now.getFullYear()}${month}${day}_${hour}${minute}.xlsx`

  // Write buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Trigger download
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToExcel({ ads, includeBusinessArea = false }: ExportData) {
  // Sort data
  const sorted = [...ads].sort((a, b) => {
    const ao = a.partner?.office?.localeCompare(b.partner?.office || "") || 0
    if (ao !== 0) return ao
    const an = a.partner?.name?.localeCompare(b.partner?.name || "") || 0
    if (an !== 0) return an
    const ap = a.positionName.localeCompare(b.positionName)
    if (ap !== 0) return ap
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Hirdetések")

  // Define columns
  const columns: { header: string; key: string; width: number }[] = [
    { header: "Illetékes iroda", key: "office", width: 20 },
    { header: "Partner", key: "partner", width: 25 },
    { header: "Munkakör", key: "position", width: 25 },
    { header: "Hirdetés", key: "content", width: 40 },
    { header: "Típus", key: "type", width: 15 },
    { header: "Kezdés", key: "start", width: 15 },
    { header: "Vége", key: "end", width: 15 },
    { header: "Státusz", key: "status", width: 15 },
  ]
  if (includeBusinessArea) {
    columns.splice(2, 0, { header: "Üzletág", key: "businessArea", width: 18 })
  }
  sheet.columns = columns

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" }, // Indigo-600-like color
  }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }
  headerRow.height = 24

  // Add data
  sorted.forEach((ad) => {
    const row = sheet.addRow({
      office: ad.partner?.office ?? "",
      partner: ad.partner?.name ?? "",
      businessArea: ad.businessArea,
      position: ad.positionName,
      content: ad.adContent,
      type: ad.type,
      start: new Date(ad.startDate),
      end: new Date(ad.endDate),
      status: getAdStatus(ad),
    })

    // Style data row
    row.alignment = { vertical: "middle" }
    row.getCell("office").alignment = { vertical: "middle", horizontal: "left" }
    row.getCell("partner").alignment = { vertical: "middle", horizontal: "left" }
    if (includeBusinessArea) {
      row.getCell("businessArea").alignment = { vertical: "middle", horizontal: "center" }
    }
    row.getCell("start").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("end").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("status").alignment = { vertical: "middle", horizontal: "center" }
    row.getCell("type").alignment = { vertical: "middle", horizontal: "center" }

    // Format dates
    row.getCell("start").numFmt = "yyyy-mm-dd"
    row.getCell("end").numFmt = "yyyy-mm-dd"
  })

  // Add borders to all cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  // Generate filename
  const now = new Date()
  const filename = `hirdetesek_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`

  // Write buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Trigger download
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
