// ============================================================
// LineChartReport Component
// Recharts LineChart with area gradient fill
// ============================================================

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import type { TimeSeriesPoint } from '../../types/reports.types'
import { EmptyReportState } from '../EmptyReportState'

interface LineChartReportProps {
  data: TimeSeriesPoint[]
  color?: string
  height?: number
  formatValue?: (value: number) => string
  showArea?: boolean
  label?: string
  secondaryLabel?: string
  secondaryColor?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-slate-400 text-xs mb-1.5">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {formatValue ? formatValue(p.value) : p.value}
          {payload.length > 1 && (
            <span className="font-normal text-slate-500 ml-1 text-xs">{p.name}</span>
          )}
        </p>
      ))}
    </div>
  )
}

export function LineChartReport({
  data,
  color = '#6366f1',
  height = 260,
  formatValue,
  showArea = true,
  label = 'Valor',
  secondaryLabel,
  secondaryColor = '#10b981',
}: LineChartReportProps) {
  if (data.length === 0) return <EmptyReportState />

  const chartData = data.map((d) => ({
    label: d.date,
    value: d.value,
    secondary: d.secondary,
  }))

  const gradientId = `gradient-${color.replace('#', '')}`

  if (showArea) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }}
            name={label}
          />
          {secondaryLabel && (
            <Area
              type="monotone"
              dataKey="secondary"
              stroke={secondaryColor}
              strokeWidth={2}
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: secondaryColor, strokeWidth: 2, stroke: '#fff' }}
              name={secondaryLabel}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
          name={label}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
