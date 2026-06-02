import { supabase } from '../../../lib/supabase/client'
import type { Membership, MembershipFormData } from '../../../types/database'
import { addDays, format } from 'date-fns'

export const membershipService = {
  async getAll(status?: string): Promise<Membership[]> {
    let query = supabase
      .from('memberships')
      .select('*, member:members(*), plan:membership_plans(*)')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Membership[]
  },

  async getByMember(memberId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, plan:membership_plans(*)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Membership[]
  },

  async getActiveMembership(memberId: string): Promise<Membership | null> {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('memberships')
      .select('*, plan:membership_plans(*)')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('start_date', today)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return (data as Membership) ?? null
  },

  async create(
    formData: MembershipFormData,
    durationDays: number,
    price: number,
    basePrice: number,
    discountType?: 'percentage' | 'fixed' | 'none',
    discountValue?: number
  ): Promise<Membership> {
    const startDate = new Date(formData.start_date + 'T12:00:00')
    const endDate = addDays(startDate, durationDays)

    // Ensure we don't have overlapping active memberships by expiring the old ones
    await supabase
      .from('memberships')
      .update({ status: 'expired' })
      .eq('member_id', formData.member_id)
      .eq('status', 'active')

    const { data, error } = await supabase
      .from('memberships')
      .insert({
        member_id: formData.member_id,
        plan_id: formData.plan_id,
        start_date: formData.start_date,
        end_date: format(endDate, 'yyyy-MM-dd'),
        base_price: basePrice,
        discount_type: discountType !== 'none' ? discountType : null,
        discount_value: discountType !== 'none' ? discountValue : null,
        price_paid: price,
        status: 'active',
        payment_method: formData.payment_method,
        notes: formData.notes,
      })
      .select('*, plan:membership_plans(*)')
      .single()
    if (error) throw error

    // Update member status to active
    await supabase.from('members').update({ status: 'active' }).eq('id', formData.member_id)

    return data as Membership
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) throw error
  },

  async getExpiringSoon(days: number = 7): Promise<Membership[]> {
    const today = format(new Date(), 'yyyy-MM-dd')
    const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('memberships')
      .select('*, member:members(*), plan:membership_plans(*)')
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', futureDate)
      .order('end_date')
    if (error) throw error
    return data as Membership[]
  },
}
