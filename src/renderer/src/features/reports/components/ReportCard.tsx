// ============================================================
// ReportCard Component
// Metric summary card used in report dashboards
// ============================================================

import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type ReportCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface ReportCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color?: ReportCardColor
  trend?: { value: number; label: string }
  loading?: boolean
  className?: string
}

const colorConfig: Record<
  ReportCardColor,
  { bg: string; iconBg: string; iconText: string; border: string }
> = {
  primary: {
    bg: 'bg-white',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    border: 'border-slate-200',
  },
  success: {
    bg: 'bg-white',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    border: 'border-slate-200',
  },
  warning: {
    bg: 'bg-white',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    border: 'border-slate-200',
  },
  danger: {
    bg: 'bg-white',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    border: 'border-slate-200',
  },
  info: {
    bg: 'bg-white',
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-600',
    border: 'border-slate-200',
  },
  neutral: {
    bg: 'bg-white',
    iconBg: 'bg-slate-50',
    iconText: 'text-slate-500',
    border: 'border-slate-200',
  },
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
        <Minus className="w-3 h-3" />
        Sin cambio
      </span>
    )
  }
  const isPositive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? '+' : ''}{value}% {label}
    </span>
  )
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-20" />
    </div>
  )
}

export function ReportCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  loading = false,
  className = '',
}: ReportCardProps) {
  const cfg = colorConfig[color]

  return (
    <div
      className={`${cfg.bg} rounded-2xl border ${cfg.border} shadow-sm p-5 flex flex-col gap-3 transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 leading-tight truncate">{value}</p>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
              )}
            </>
          )}
        </div>
        <div
          className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconText}`}
        >
          {icon}
        </div>
      </div>
      {!loading && trend && (
        <div className="pt-1 border-t border-slate-100">
          <TrendBadge value={trend.value} label={trend.label} />
        </div>
      )}
    </div>
  )
}
