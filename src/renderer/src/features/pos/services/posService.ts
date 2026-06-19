import { supabase } from '../../../lib/supabase/client'
import type { Sale, SaleItem, SalePayment } from '../../../types/database'

export interface CreateSalePayload {
  tenant_id: string
  member_id?: string
  external_customer_name?: string
  external_customer_phone?: string
  subtotal: number
  discount_total: number
  total: number
  amount_paid: number
  payment_method?: string
  due_date?: string
  notes?: string
  items: {
    product_id: string
    product_name_snapshot: string
    quantity: number
    unit_price: number
    subtotal: number
  }[]
}

export const posService = {
  async createSale(payload: CreateSalePayload) {
    // We use the RPC function we created in the migration for atomicity
    const { data, error } = await supabase.rpc('create_pos_sale', { payload })

    if (error) throw error
    return data as { success: boolean; sale_id: string }
  },

  async registerPayment(saleId: string, amount: number, method: string, notes?: string) {
    const { data, error } = await supabase.rpc('register_sale_payment', {
      p_sale_id: saleId,
      p_amount: amount,
      p_method: method,
      p_notes: notes || null,
    })

    if (error) throw error
    return data as { success: boolean; balance_due: number; payment_status: string }
  },

  async getSales(
    tenantId: string,
    options?: { payment_status?: string; member_id?: string; limit?: number }
  ) {
    let query = supabase
      .from('sales')
      .select('*, member:members(full_name, phone)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (options?.payment_status) {
      query = query.eq('payment_status', options.payment_status)
    }

    if (options?.member_id) {
      query = query.eq('member_id', options.member_id)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Sale[]
  },

  async getSaleDetails(saleId: string) {
    // Get header
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*, member:members(*)')
      .eq('id', saleId)
      .single()

    if (saleError) throw saleError

    // Get items
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*, product:products(sku, barcode, image_url)')
      .eq('sale_id', saleId)

    if (itemsError) throw itemsError

    // Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from('sale_payments')
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: true })

    if (paymentsError) throw paymentsError

    return {
      ...sale,
      items: items as SaleItem[],
      payments: payments as SalePayment[],
    } as Sale
  },

  async cancelSale(saleId: string, reason?: string) {
    // To cancel a sale we'd need another RPC to reverse inventory correctly,
    // but for now we might just update the status if we don't return items to inventory,
    // or if we do, we need a dedicated RPC. This is a placeholder that can be
    // replaced with an RPC if cancellation is strictly required to restore stock.
    const { error } = await supabase
      .from('sales')
      .update({ status: 'cancelled', notes: reason ? `Cancelada: ${reason}` : 'Cancelada' })
      .eq('id', saleId)

    if (error) throw error
  },
}
