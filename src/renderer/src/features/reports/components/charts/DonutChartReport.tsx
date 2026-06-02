// ============================================================
// DonutChartReport Component
// Recharts PieChart with innerRadius (donut style)
// ============================================================

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ChartDataPoint } from '../../types/reports.types'
import { EmptyReportState } from '../EmptyReportState'

const CHART_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#84cc16', // lime
  '#ec4899', // pink
]

interface DonutChartReportProps {
  data: ChartDataPoint[]
  height?: number
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
  formatValue?: (value: number) => string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, formatValue }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-slate-500 text-xs mb-0.5">{entry.name}</p>
      <p className="font-bold text-slate-900">
        {formatValue ? formatValue(entry.value) : entry.value}
      </p>
      <p className="text-xs text-slate-400">
        {entry.payload.percentage !== undefined
          ? `${entry.payload.percentage}%`
          : `${Math.round((entry.value / (payload[0]?.payload?.total ?? 1)) * 100)}%`}
      </p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
      {payload.map(
        (entry: { color: string; value: string; payload: { value: number } }, i: number) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
            <span className="text-slate-400 font-medium">({entry.payload.value})</span>
          </div>
        )
      )}
    </div>
  )
}

export function DonutChartReport({
  data,
  height = 260,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  formatValue,
}: DonutChartReportProps) {
  if (data.length === 0) return <EmptyReportState />

  const total = data.reduce((acc, d) => acc + d.value, 0)

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.value,
    color: d.color,
    percentage: Math.round((d.value / total) * 100),
    total,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  )
}
