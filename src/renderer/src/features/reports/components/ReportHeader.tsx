// ============================================================
// ReportHeader Component
// Page header for report pages with title, period badge, and actions
// ============================================================

import type { ReactNode } from 'react'
import type { DateRange, DateRangePreset } from '../types/reports.types'
import { formatDateRangeLabel } from '../utils/reportFormatters'
import { Calendar } from 'lucide-react'

interface ReportHeaderProps {
  title: string
  subtitle?: string
  preset: DateRangePreset
  range: DateRange
  actions?: ReactNode
}

export function ReportHeader({ title, subtitle, preset, range, actions }: ReportHeaderProps) {
  const rangeLabel = formatDateRangeLabel(range, preset)

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        <div className="flex items-center gap-1.5 mt-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {rangeLabel}
          </span>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
