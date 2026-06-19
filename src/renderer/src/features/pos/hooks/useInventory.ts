import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../contexts/TenantContext'
import { inventoryService } from '../services/inventoryService'
import type { InventoryMovement } from '../../../types/database'

export function useInventory(productId?: string) {
  const { activeTenantId } = useTenant()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMovements = useCallback(async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await inventoryService.getMovements(activeTenantId, { productId, limit: 100 })
      setMovements(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching movements'))
    } finally {
      setIsLoading(false)
    }
  }, [activeTenantId, productId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  return { movements, isLoading, error, fetchMovements }
}
