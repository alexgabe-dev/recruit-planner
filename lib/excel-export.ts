import { type Ad, type Partner, getAdStatus } from "./types"

interface ExportData {
  ads: (Ad & { partner?: Partner })[]
}

export function exportToExcel({ ads }: ExportData) {
  const sorted = [...ads].sort((a, b) => {
    const ao = a.partner?.office?.localeCompare(b.partner?.office || "") || 0
    if (ao !== 0) return ao
    const an = a.partner?.name?.localeCompare(b.partner?.name || "") || 0
    if (an !== 0) return an
    const ap = a.positionName.localeCompare(b.positionName)
    if (ap !== 0) return ap
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
  const headers = [
    "Illetékes iroda",
    "Partner",
    "Munkakör",
    "Hirdetés",
    "Típus",
    "Kezdés",
    "Vége",
    "Státusz",
  ]

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${year}-${month}-${day}`
  }

  const sanitize = (value: unknown) => {
    const s = String(value ?? "")
    if (/^[=+\-@]/.test(s)) return `'${s}`
    return s
  }

  const sep = ";"
  const escape = (value: unknown) => {
    const s = sanitize(value)
    const needsQuote = s.includes("\n") || s.includes("\r") || s.includes("\"") || s.includes(sep)
    const escaped = s.replace(/\"/g, '""')
    return needsQuote ? `"${escaped}"` : escaped
  }

  const dataLines = sorted.map((ad) => {
    const cols = [
      escape(ad.partner?.office ?? ""),
      escape(ad.partner?.name ?? ""),
      escape(ad.positionName),
      escape(ad.adContent),
      escape(ad.type),
      escape(formatDate(ad.startDate)),
      escape(formatDate(ad.endDate)),
      escape(getAdStatus(ad)),
    ]
    return cols.join(sep)
  })

  const headerLine = headers.join(sep)
  const excelSepHint = `sep=${sep}`
  const csv = [excelSepHint, headerLine, ...dataLines].join("\r\n")

  const now = new Date()
  const filename = `hirdetesek_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.csv`

  const toUtf16Le = (str: string) => {
    const bytes = new Uint8Array(2 + str.length * 2)
    bytes[0] = 0xff
    bytes[1] = 0xfe
    let i = 0
    for (let c = 0; c < str.length; c++) {
      const code = str.charCodeAt(c)
      bytes[2 + i++] = code & 0xff
      bytes[2 + i++] = code >> 8
    }
    return bytes
  }

  const blob = new Blob([toUtf16Le(csv)], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
