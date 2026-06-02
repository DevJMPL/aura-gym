// ============================================================
// DateRangeFilter Component
// Preset + custom date range picker for reports
// ============================================================

import { Calendar, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { DateRange, DateRangePreset } from '../types/reports.types'
interface DateRangeFilterProps {
  preset: DateRangePreset
  range: DateRange
  onPresetChange: (preset: DateRangePreset) => void
  onCustomRange: (from: string, to: string) => void
}
export function DateRangeFilter({
  preset,
  range,
  onPresetChange,
  onCustomRange,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(range.from)
  const [customTo, setCustomTo] = useState(range.to)
  const presets: {
    id: DateRangePreset
    label: string
  }[] = [
    {
      id: 'today',
      label: 'Hoy',
    },
    {
      id: 'week',
      label: 'Esta semana',
    },
    {
      id: 'month',
      label: 'Este mes',
    },
    {
      id: 'prev_month',
      label: 'Mes anterior',
    },
  ]
  function handlePresetClick(p: DateRangePreset) {
    if (p === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onPresetChange(p)
    }
  }
  function handleApplyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      onCustomRange(customFrom, customTo)
      setShowCustom(false)
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetClick(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${preset === p.id ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range toggle */}
      <button
        onClick={() => {
          setShowCustom((v) => !v)
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${preset === 'custom' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
      >
        <Calendar className="w-3.5 h-3.5" />
        {preset === 'custom' ? `${range.from} – ${range.to}` : 'Rango'}
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Custom range popover */}
      {showCustom && (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg animate-slide-up">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Desde</label>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Hasta</label>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Aplicar
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="px-2 py-1 text-slate-400 text-xs hover:text-slate-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
