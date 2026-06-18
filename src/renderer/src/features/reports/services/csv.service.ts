// ============================================================
// CSV Export Service
// Converts report data arrays to downloadable CSV files
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CsvRow = Record<string, any>

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function arrayToCsv(headers: string[], rows: CsvRow[]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(','))
  return [headerLine, ...dataLines].join('\n')
}

function downloadCsv(csvString: string, filename: string): void {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Public export functions ───────────────────────────────────

export const csvService = {
  /**
   * Exports an array of objects as a CSV download.
   * @param columns  Array of { key, header } defining column order and labels
   * @param data     Array of row objects
   * @param filename Desired filename (without .csv extension)
   */
  export<T extends CsvRow>(
    columns: Array<{ key: string; header: string }>,
    data: T[],
    filename: string
  ): void {
    const headers = columns.map((c) => c.header)
    const rows = data.map((row) => {
      const mapped: CsvRow = {}
      for (const col of columns) {
        mapped[col.header] = row[col.key]
      }
      return mapped
    })
    const csv = arrayToCsv(headers, rows)
    downloadCsv(csv, `${filename}.csv`)
  },
}
