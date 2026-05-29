import { supabase } from '../../../lib/supabase/client'
import type { MembershipPlan, PlanFormData } from '../../../types/database'

export const planService = {
  async getAll(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('type')
      .order('base_price')
    if (error) throw error
    return data as MembershipPlan[]
  },

  async getActive(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('base_price')
    if (error) throw error
    return data as MembershipPlan[]
  },

  async create(plan: PlanFormData): Promise<MembershipPlan> {
    const { data, error } = await supabase.from('membership_plans').insert(plan).select().single()
    if (error) throw error
    return data as MembershipPlan
  },

  async update(id: string, plan: Partial<PlanFormData>): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .update(plan)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as MembershipPlan
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('membership_plans')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },
}
