// ============================================================
// ReportSummaryGrid Component
// Responsive grid of ReportCards with staggered animation
// ============================================================

import type { ReactNode } from 'react'

interface ReportSummaryGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
}

const colsMap: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}

export function ReportSummaryGrid({ children, columns = 4 }: ReportSummaryGridProps) {
  return <div className={`grid gap-4 ${colsMap[columns]}`}>{children}</div>
}
