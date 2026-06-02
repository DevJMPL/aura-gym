// ============================================================
// BarChartReport Component
// Recharts BarChart wrapper with responsive container
// ============================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TimeSeriesPoint, ChartDataPoint } from '../../types/reports.types'
import { EmptyReportState } from '../EmptyReportState'

interface BarChartReportProps {
  data: (TimeSeriesPoint | ChartDataPoint)[]
  color?: string
  height?: number
  formatValue?: (value: number) => string
  formatLabel?: (label: string) => string
  highlightMax?: boolean
}

const DEFAULT_COLOR = '#6366f1'
const HIGHLIGHT_COLOR = '#4f46e5'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-slate-900">
        {formatValue ? formatValue(payload[0].value) : payload[0].value}
      </p>
    </div>
  )
}

export function BarChartReport({
  data,
  color = DEFAULT_COLOR,
  height = 260,
  formatValue,
  formatLabel,
  highlightMax = false,
}: BarChartReportProps) {
  if (data.length === 0) return <EmptyReportState />

  const maxValue = Math.max(...data.map((d) => d.value))

  const chartData = data.map((d) => ({
    label: 'date' in d ? d.date : d.label,
    value: d.value,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatLabel}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: '#f8fafc', radius: 4 }}
        />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={48}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={highlightMax && entry.value === maxValue ? HIGHLIGHT_COLOR : color}
              fillOpacity={highlightMax && entry.value !== maxValue ? 0.6 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
