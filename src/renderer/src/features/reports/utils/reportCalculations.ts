// ============================================================
// Report Calculations
// Pure functions for grouping and aggregating report data
// ============================================================

import {
  format,
  parseISO,
  startOfWeek,
  getISOWeek,
  getYear,
  differenceInDays,
  isValid,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { ChartDataPoint, TimeSeriesPoint } from '../types/reports.types'

// ── Type helpers ──────────────────────────────────────────────

type AnyRecord = Record<string, unknown>

// ── Grouping ──────────────────────────────────────────────────

/**
 * Groups an array of records by calendar day (YYYY-MM-DD) from a date field.
 * Returns sorted TimeSeriesPoint array.
 */
export function groupByDay<T extends AnyRecord>(
  records: T[],
  dateField: keyof T,
  valueReducer?: (items: T[]) => number
): TimeSeriesPoint[] {
  const map = new Map<string, T[]>()

  for (const record of records) {
    const raw = record[dateField] as string
    if (!raw) continue
    const day = raw.length > 10 ? raw.substring(0, 10) : raw
    const existing = map.get(day) ?? []
    existing.push(record)
    map.set(day, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      value: valueReducer ? valueReducer(items) : items.length,
    }))
}

/**
 * Groups records by ISO week (e.g., "Sem 22 2025").
 */
export function groupByWeek<T extends AnyRecord>(
  records: T[],
  dateField: keyof T,
  valueReducer?: (items: T[]) => number
): TimeSeriesPoint[] {
  const map = new Map<string, { label: string; items: T[] }>()

  for (const record of records) {
    const raw = record[dateField] as string
    if (!raw) continue
    const d = parseISO(raw.length > 10 ? raw.substring(0, 10) : raw)
    if (!isValid(d)) continue
    const week = getISOWeek(d)
    const year = getYear(d)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    const label = format(weekStart, "'Sem' w, MMM", { locale: es })
    const existing = map.get(key) ?? { label, items: [] }
    existing.items.push(record)
    map.set(key, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_key, { label, items }]) => ({
      date: label,
      value: valueReducer ? valueReducer(items) : items.length,
    }))
}

/**
 * Groups records by month (e.g., "Ene 2025").
 */
export function groupByMonth<T extends AnyRecord>(
  records: T[],
  dateField: keyof T,
  valueReducer?: (items: T[]) => number
): TimeSeriesPoint[] {
  const map = new Map<string, T[]>()

  for (const record of records) {
    const raw = record[dateField] as string
    if (!raw) continue
    const d = parseISO(raw.length > 10 ? raw.substring(0, 10) : raw)
    if (!isValid(d)) continue
    const key = format(d, 'yyyy-MM')
    const existing = map.get(key) ?? []
    existing.push(record)
    map.set(key, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const d = parseISO(`${key}-01`)
      return {
        date: format(d, "MMM yy", { locale: es }),
        value: valueReducer ? valueReducer(items) : items.length,
      }
    })
}

/**
 * Groups records by hour of day (0-23).
 */
export function groupByHour<T extends AnyRecord>(
  records: T[],
  timestampField: keyof T
): ChartDataPoint[] {
  const counts = new Array(24).fill(0)

  for (const record of records) {
    const raw = record[timestampField] as string
    if (!raw) continue
    const d = parseISO(raw)
    if (!isValid(d)) continue
    counts[d.getHours()]++
  }

  return counts.map((value, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00`,
    value,
  }))
}

// ── Aggregations ──────────────────────────────────────────────

/**
 * Calculates percentage with zero-division guard.
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 1000) / 10 // one decimal
}

/**
 * Calculates trend percentage between current and previous values.
 * Returns positive = growth, negative = decline.
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * Returns the sum of a numeric field from an array of records.
 */
export function sumField<T extends AnyRecord>(records: T[], field: keyof T): number {
  return records.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)
}

/**
 * Returns the average of a numeric field.
 */
export function avgField<T extends AnyRecord>(records: T[], field: keyof T): number {
  if (records.length === 0) return 0
  return sumField(records, field) / records.length
}

/**
 * Groups records by a string field and counts occurrences.
 * Returns sorted descending by count.
 */
export function countByField<T extends AnyRecord>(
  records: T[],
  field: keyof T
): Array<{ key: string; count: number; percentage: number }> {
  const map = new Map<string, number>()
  const total = records.length

  for (const record of records) {
    const key = String(record[field] ?? 'unknown')
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({
      key,
      count,
      percentage: calculatePercentage(count, total),
    }))
}

/**
 * Returns number of days between two ISO date strings.
 */
export function daysBetween(from: string, to: string): number {
  try {
    return Math.abs(differenceInDays(parseISO(to), parseISO(from)))
  } catch {
    return 0
  }
}

/**
 * Fills in missing days in a time series with 0 values.
 * Useful for bar/line charts with sparse data.
 */
export function fillDateGaps(
  series: TimeSeriesPoint[],
  from: string,
  to: string
): TimeSeriesPoint[] {
  if (series.length === 0) return []

  const map = new Map(series.map((s) => [s.date, s.value]))
  const result: TimeSeriesPoint[] = []

  const start = parseISO(from)
  const end = parseISO(to)
  const totalDays = differenceInDays(end, start) + 1

  // Only fill gaps for periods <= 90 days to avoid huge arrays
  if (totalDays > 90) return series

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = format(d, 'yyyy-MM-dd')
    result.push({ date: key, value: map.get(key) ?? 0 })
  }

  return result
}
