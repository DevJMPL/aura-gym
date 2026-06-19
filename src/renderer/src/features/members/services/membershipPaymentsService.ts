import { supabase } from '../../../lib/supabase/client'
import type { MembershipCharge, PaymentMethod } from '../../../types/database'

export interface CreateMembershipChargePayload {
  tenant_id: string
  member_id: string
  plan_id: string
  membership_id?: string | null
  subtotal: number
  discount_total: number
  total: number
  amount_paid: number
  payment_method?: PaymentMethod
  due_date?: string | null
  notes?: string
}

export const membershipPaymentsService = {
  // Create a charge (and initial payment if amount_paid > 0)
  async createCharge(
    payload: CreateMembershipChargePayload
  ): Promise<{ success: boolean; charge_id: string }> {
    const { data, error } = await supabase.rpc('create_membership_charge', { payload })
    if (error) throw error
    return data as { success: boolean; charge_id: string }
  },

  // Register a subsequent payment
  async registerPayment(
    chargeId: string,
    amount: number,
    method: PaymentMethod,
    notes?: string
  ): Promise<{ success: boolean; balance_due: number; payment_status: string }> {
    const { data, error } = await supabase.rpc('register_membership_payment', {
      p_charge_id: chargeId,
      p_amount: amount,
      p_method: method,
      p_notes: notes || null,
    })
    if (error) throw error
    return data as { success: boolean; balance_due: number; payment_status: string }
  },

  // Get charges for a specific member
  async getMemberCharges(tenantId: string, memberId: string): Promise<MembershipCharge[]> {
    const { data, error } = await supabase
      .from('membership_charges')
      .select(
        '*, plan:membership_plans(*), membership:memberships(*), payments:membership_payments(*)'
      )
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as MembershipCharge[]
  },

  // Get all pending/overdue charges for the entire tenant
  async getPendingCharges(tenantId: string): Promise<MembershipCharge[]> {
    const { data, error } = await supabase
      .from('membership_charges')
      .select('*, member:members(*), plan:membership_plans(*)')
      .eq('tenant_id', tenantId)
      .in('payment_status', ['pending', 'partially_paid'])
      .eq('status', 'active')
      .order('due_date', { ascending: true })

    if (error) throw error
    return data as MembershipCharge[]
  },
}
