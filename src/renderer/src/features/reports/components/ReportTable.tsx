// ============================================================
// ReportTable Component
// Generic typed table with configurable columns, empty state,
// loading skeleton, and optional sort
// ============================================================

import type { ReactNode } from 'react'
import type { TableColumn } from '../types/reports.types'
import { EmptyReportState } from './EmptyReportState'

interface ReportTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  keyField?: keyof T
  maxRows?: number
  className?: string
  caption?: string
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-3 bg-slate-200 rounded animate-pulse"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function ReportTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage,
  keyField,
  maxRows,
  className = '',
  caption,
}: ReportTableProps<T>) {
  const displayData = maxRows ? data.slice(0, maxRows) : data

  if (!loading && data.length === 0) {
    return <EmptyReportState message={emptyMessage} />
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 ${className}`}>
      <table className="w-full text-sm">
        {caption && (
          <caption className="text-left text-xs text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-200">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <TableSkeleton rows={5} cols={columns.length} />
          ) : (
            displayData.map((row, i) => (
              <tr
                key={keyField ? String(row[keyField]) : i}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-slate-700 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (((row as any)[col.key as string] as ReactNode) ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {maxRows && data.length > maxRows && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
          Mostrando {maxRows} de {data.length} registros
        </div>
      )}
    </div>
  )
}
