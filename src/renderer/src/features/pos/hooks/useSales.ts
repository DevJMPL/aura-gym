import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../contexts/TenantContext'
import { posService } from '../services/posService'
import type { Sale } from '../../../types/database'

export function useSales(paymentStatus?: string) {
  const { activeTenantId } = useTenant()
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSales = useCallback(async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await posService.getSales(activeTenantId, { payment_status: paymentStatus })
      setSales(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching sales'))
    } finally {
      setIsLoading(false)
    }
  }, [activeTenantId, paymentStatus])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  return { sales, isLoading, error, fetchSales }
}
