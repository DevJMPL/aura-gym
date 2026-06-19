import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../contexts/TenantContext'
import { productService } from '../services/productService'
import type { Product } from '../../../types/database'

export function useProducts(categoryId?: string) {
  const { activeTenantId } = useTenant()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await productService.getProducts(activeTenantId, categoryId)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching products'))
    } finally {
      setIsLoading(false)
    }
  }, [activeTenantId, categoryId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, isLoading, error, fetchProducts }
}
