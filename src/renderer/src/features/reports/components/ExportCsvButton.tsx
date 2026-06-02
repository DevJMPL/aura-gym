// ============================================================
// ExportCsvButton Component
// ============================================================

import { Download } from 'lucide-react'
import { csvService } from '../services/csv.service'

interface ExportCsvButtonProps<T extends object> {
  columns: Array<{ key: string; header: string }>
  data: T[]
  filename: string
  disabled?: boolean
}

export function ExportCsvButton<T extends object>({
  columns,
  data,
  filename,
  disabled = false,
}: ExportCsvButtonProps<T>) {
  function handleExport() {
    csvService.export(columns, data, filename)
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
    >
      <Download className="w-4 h-4" />
      CSV
    </button>
  )
}
