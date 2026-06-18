// ============================================================
// useReports Hook
// Generic async data fetcher with loading/error/data states
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseReportState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook to fetch report data.
 * Re-fetches whenever the deps change (works like useEffect deps).
 *
 * @param fetcher  Async function that returns T
 * @param deps     Dependency array — any serializable values
 */
export function useReport<T>(fetcher: () => Promise<T>, deps: unknown[]): UseReportState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err?.message ?? 'Error al cargar el reporte')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshKey])

  return { data, isLoading, error, refetch }
}
