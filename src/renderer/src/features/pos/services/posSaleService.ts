import { supabase } from '../../../lib/supabase/client'
import type { PaymentMethod, PosCreateSaleData, PosSale } from '../../../types/database'

export const posSaleService = {
  async createSale(sale: PosCreateSaleData): Promise<PosSale> {
    if (sale.items.length === 0) {
      throw new Error('Agrega al menos un producto al carrito.')
    }

    const total = roundMoney(
      sale.items.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0)
    )
    const tenderedAmount = roundMoney(Math.max(0, sale.paid_amount || 0))
    const paidAmount = roundMoney(Math.max(0, Math.min(tenderedAmount, total)))
    const balanceDue = roundMoney(total - paidAmount)
    const changeAmount = roundMoney(Math.max(0, tenderedAmount - total))

    if (sale.customer_type === 'guest' && balanceDue > 0) {
      throw new Error('Los invitados deben liquidar el total de la venta.')
    }

    if (sale.customer_type === 'member' && !sale.member_id) {
      throw new Error('Selecciona un miembro para dejar saldo pendiente.')
    }

    const { data: saleNumber, error: numberError } = await supabase.rpc('generate_pos_sale_number')
    if (numberError) throw numberError

    const salePayload = {
      sale_number: saleNumber as string,
      member_id: sale.customer_type === 'member' ? sale.member_id : null,
      customer_name:
        sale.customer_type === 'guest' ? sale.customer_name?.trim() || 'Invitado' : null,
      customer_type: sale.customer_type,
      status: balanceDue > 0 ? 'partial' : 'completed',
      total_amount: total,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      tendered_amount: tenderedAmount,
      change_amount: changeAmount,
      payment_method: paidAmount > 0 ? sale.payment_method : null,
      notes: sale.notes?.trim() || null,
      sold_by: sale.sold_by || null,
    }

    let { data: createdSale, error: saleError } = await supabase
      .from('pos_sales')
      .insert(salePayload)
      .select()
      .single()

    if (saleError && saleError.code === 'PGRST204') {
      const legacyPayload: Record<string, unknown> = { ...salePayload }
      delete legacyPayload.tendered_amount
      delete legacyPayload.change_amount
      const legacyResult = await supabase.from('pos_sales').insert(legacyPayload).select().single()
      createdSale = legacyResult.data
      saleError = legacyResult.error
    }

    if (saleError) throw saleError

    const saleId = createdSale.id as string
    const saleItems = sale.items.map((item) => ({
      sale_id: saleId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.sale_price,
      line_total: roundMoney(item.product.sale_price * item.quantity),
    }))

    const { error: itemsError } = await supabase.from('pos_sale_items').insert(saleItems)
    if (itemsError) throw itemsError

    for (const item of sale.items) {
      if (!item.product.track_inventory) continue

      const nextStock = Math.max(0, item.product.stock_quantity - item.quantity)
      const { error: stockError } = await supabase
        .from('pos_products')
        .update({ stock_quantity: nextStock })
        .eq('id', item.product.id)

      if (stockError) throw stockError
    }

    if (paidAmount > 0) {
      const { error: paymentError } = await supabase.from('pos_sale_payments').insert({
        sale_id: saleId,
        amount: paidAmount,
        payment_method: sale.payment_method,
        received_by: sale.sold_by || null,
        notes: 'Pago inicial',
      })

      if (paymentError) throw paymentError
    }

    return this.getById(saleId)
  },

  async getById(id: string): Promise<PosSale> {
    const { data, error } = await supabase
      .from('pos_sales')
      .select(
        `
        *,
        member:members(*),
        seller:app_users(*),
        items:pos_sale_items(*),
        payments:pos_sale_payments(*)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as PosSale
  },

  async getRecent(limit = 30): Promise<PosSale[]> {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('*, member:members(*), seller:app_users(*)')
      .order('sold_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as PosSale[]
  },

  async getByDateRange(from: string, to: string): Promise<PosSale[]> {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('*, member:members(*), seller:app_users(*)')
      .gte('sold_at', from)
      .lt('sold_at', to)
      .order('sold_at', { ascending: false })

    if (error) throw error
    return data as PosSale[]
  },

  async getPendingBalances(): Promise<PosSale[]> {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('*, member:members(*), seller:app_users(*)')
      .gt('balance_due', 0)
      .neq('status', 'cancelled')
      .order('sold_at', { ascending: false })

    if (error) throw error
    return data as PosSale[]
  },

  async addPayment(
    sale: PosSale,
    amount: number,
    paymentMethod: PaymentMethod,
    receivedBy?: string | null
  ): Promise<PosSale> {
    const paymentAmount = roundMoney(Math.max(0, Math.min(amount, sale.balance_due)))
    if (paymentAmount <= 0) {
      throw new Error('Ingresa un pago mayor a cero.')
    }

    const nextPaid = roundMoney(sale.paid_amount + paymentAmount)
    const nextBalance = roundMoney(Math.max(0, sale.total_amount - nextPaid))

    const { error: paymentError } = await supabase.from('pos_sale_payments').insert({
      sale_id: sale.id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      received_by: receivedBy || null,
      notes: 'Abono a saldo pendiente',
    })

    if (paymentError) throw paymentError

    const { error: saleError } = await supabase
      .from('pos_sales')
      .update({
        paid_amount: nextPaid,
        balance_due: nextBalance,
        status: nextBalance > 0 ? 'partial' : 'completed',
      })
      .eq('id', sale.id)

    if (saleError) throw saleError
    return this.getById(sale.id)
  },
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}
