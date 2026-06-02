// ============================================================
// useDateRange Hook
// Manages date range state for report filters
// ============================================================

import { useState, useCallback } from 'react'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns'
import type { DateRange, DateRangePreset } from '../types/reports.types'

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function getRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        from: toDateStr(startOfDay(now)),
        to: toDateStr(endOfDay(now)),
      }
    case 'week':
      return {
        from: toDateStr(startOfWeek(now, { weekStartsOn: 1 })),
        to: toDateStr(endOfWeek(now, { weekStartsOn: 1 })),
      }
    case 'month':
      return {
        from: toDateStr(startOfMonth(now)),
        to: toDateStr(endOfMonth(now)),
      }
    case 'prev_month': {
      const prev = subMonths(now, 1)
      return {
        from: toDateStr(startOfMonth(prev)),
        to: toDateStr(endOfMonth(prev)),
      }
    }
    case 'custom':
      // Keep current range unchanged when switching to custom
      return {
        from: toDateStr(startOfMonth(now)),
        to: toDateStr(endOfMonth(now)),
      }
    default:
      return {
        from: toDateStr(startOfMonth(now)),
        to: toDateStr(endOfMonth(now)),
      }
  }
}

export interface UseDateRangeReturn {
  preset: DateRangePreset
  range: DateRange
  setPreset: (preset: DateRangePreset) => void
  setCustomRange: (from: string, to: string) => void
}

export function useDateRange(
  defaultPreset: DateRangePreset = 'month'
): UseDateRangeReturn {
  const [preset, setPresetState] = useState<DateRangePreset>(defaultPreset)
  const [range, setRange] = useState<DateRange>(() => getRangeForPreset(defaultPreset))

  const setPreset = useCallback((newPreset: DateRangePreset) => {
    setPresetState(newPreset)
    if (newPreset !== 'custom') {
      setRange(getRangeForPreset(newPreset))
    }
  }, [])

  const setCustomRange = useCallback((from: string, to: string) => {
    setPresetState('custom')
    setRange({ from, to })
  }, [])

  return { preset, range, setPreset, setCustomRange }
}
