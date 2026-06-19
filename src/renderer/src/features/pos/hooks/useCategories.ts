import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../contexts/TenantContext'
import { productService } from '../services/productService'
import type { ProductCategory } from '../../../types/database'

export function useCategories() {
  const { activeTenantId } = useTenant()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await productService.getCategories(activeTenantId)
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching categories'))
    } finally {
      setIsLoading(false)
    }
  }, [activeTenantId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, isLoading, error, fetchCategories }
}
