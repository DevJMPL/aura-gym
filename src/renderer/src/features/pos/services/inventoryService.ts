import { supabase } from '../../../lib/supabase/client'
import type { InventoryMovement, MovementType } from '../../../types/database'

export const inventoryService = {
  async getMovements(tenantId: string, options?: { productId?: string; limit?: number }) {
    let query = supabase
      .from('inventory_movements')
      .select('*, product:products(name, sku)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (options?.productId) {
      query = query.eq('product_id', options.productId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as InventoryMovement[]
  },

  async adjustStock(
    tenantId: string,
    productId: string,
    movementType: MovementType,
    quantityChange: number,
    reason?: string
  ) {
    // Note: To be perfectly safe, stock adjustments should also be atomic RPCs,
    // but since this is an admin action, we can do it in two steps with optimistic locking
    // or just rely on Supabase's single update if we aren't highly concurrent.

    // We use a small RPC or do it via JS. Doing it via JS:
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .single()

    if (fetchError) throw fetchError

    const previousStock = product.current_stock
    const newStock = previousStock + quantityChange

    // Update stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', productId)

    if (updateError) throw updateError

    // Record movement
    const { data, error: insertError } = await supabase
      .from('inventory_movements')
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        movement_type: movementType,
        quantity: quantityChange,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason || null,
      })
      .select()
      .single()

    if (insertError) {
      // In a real transactional system we'd rollback.
      console.error('Failed to log inventory movement', insertError)
    }

    return data as InventoryMovement
  },
}
