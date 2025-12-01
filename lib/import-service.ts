import { getDatabase } from "@/lib/db"
import { Partner } from "@/lib/types"
import ExcelJS from "exceljs"

function normalize(str: string): string {
  return str.trim().toLowerCase()
}

export async function importFromExcel(buffer: Buffer, userId: number) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.getWorksheet(1)
  if (!sheet) {
    throw new Error("Üres Excel fájl")
  }

  // Column header detection logic
  const headerRow = sheet.getRow(1)
  const headers: Record<string, number> = {}
  
  headerRow.eachCell((cell, colNumber) => {
    const val = cell.value?.toString().trim().toLowerCase() || ""
    if (val.includes("iroda")) headers.office = colNumber
    else if (val.includes("partner")) headers.partner = colNumber
    else if (val.includes("munkakör") || val.includes("pozíció")) headers.position = colNumber
    else if (val.includes("hirdetés") || val.includes("szöveg")) headers.content = colNumber
    else if (val.includes("típus")) headers.type = colNumber
    else if (val.includes("kezdés")) headers.start = colNumber
    else if (val.includes("vége")) headers.end = colNumber
  })

  // Required column validation
  const required = ["partner", "position", "type", "start", "end"]
  const missing = required.filter(k => !headers[k])
  if (missing.length > 0) {
    throw new Error(`Hiányzó oszlopok: ${missing.join(", ")}`)
  }

  // Partner caching and ad creation logic
  const db = getDatabase()
  let importedCount = 0
  let partnerCache: Record<string, Partner> = {}

  const existingPartners = db.prepare("SELECT * FROM partners WHERE user_id = ?").all(userId) as Partner[]
  existingPartners.forEach(p => {
    const key = `${normalize(p.name)}|${normalize(p.office)}`
    partnerCache[key] = p
  })

  // Prepare statements
  const insertPartnerStmt = db.prepare("INSERT INTO partners (name, office, user_id) VALUES (?, ?, ?)")
  const checkAdStmt = db.prepare(`
    SELECT id FROM ads 
    WHERE partner_id = ? AND position_name = ? AND type = ? AND start_date = ? AND end_date = ? AND user_id = ?
  `)
  const insertAdStmt = db.prepare(`
    INSERT INTO ads (position_name, ad_content, type, start_date, end_date, is_active, partner_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header

      const partnerName = row.getCell(headers.partner).value?.toString().trim() || ""
      const office = headers.office ? (row.getCell(headers.office).value?.toString().trim() || "") : ""
      const position = row.getCell(headers.position).value?.toString().trim() || ""
      const content = headers.content ? (row.getCell(headers.content).value?.toString().trim() || "") : ""
      
      // Type mapping
      let typeStr = row.getCell(headers.type).value?.toString().trim() || "post"
      const typeLower = typeStr.toLowerCase()
      let type = "post"
      if (typeLower.includes("kampány")) type = "kampány"
      else if (typeLower.includes("kiemelt")) type = "kiemelt post"
      else if (typeLower.includes("profession")) type = "Profession"
      else type = "post" // default

      // Date parsing
      const getJsDate = (cell: ExcelJS.Cell): Date => {
        const val = cell.value
        if (val instanceof Date) return val
        // Try parsing string
        const d = new Date(val as string | number)
        if (!isNaN(d.getTime())) return d
        return new Date() // fallback
      }

      const startDate = getJsDate(row.getCell(headers.start))
      const endDate = getJsDate(row.getCell(headers.end))

      if (!partnerName || !position) return // Skip invalid rows

      // Get or create partner
      const partnerKey = `${normalize(partnerName)}|${normalize(office)}`
      let partner = partnerCache[partnerKey]

      if (!partner) {
        const res = insertPartnerStmt.run(partnerName, office, userId)
        partner = {
          id: res.lastInsertRowid as number,
          name: partnerName,
          office: office
        }
        partnerCache[partnerKey] = partner
      }

      // Check for duplicates
      const existing = checkAdStmt.get(
        partner.id,
        position,
        type,
        startDate.toISOString(),
        endDate.toISOString(),
        userId
      )

      if (existing) return // Skip duplicate

      // Create Ad
      insertAdStmt.run(
        position,
        content,
        type,
        startDate.toISOString(),
        endDate.toISOString(),
        1, // is_active
        partner.id,
        userId
      )

      importedCount++
    })
  })

  transaction()

  return { count: importedCount }
}
