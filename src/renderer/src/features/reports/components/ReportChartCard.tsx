// ============================================================
// ReportChartCard Component
// Wrapper card for charts with title, subtitle, and content
// ============================================================

import type { ReactNode } from 'react'

interface ReportChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
  minHeight?: number
}

export function ReportChartCard({
  title,
  subtitle,
  children,
  className = '',
  action,
  minHeight = 280,
}: ReportChartCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div style={{ minHeight }} className="flex-1">
        {children}
      </div>
    </div>
  )
}
