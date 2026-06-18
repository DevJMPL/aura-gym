import { supabase } from '../../../lib/supabase/client'
import type { MembershipPlan, PlanFormData } from '../../../types/database'

export const planService = {
  async getAll(tenantId: string): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('type')
      .order('base_price')
    if (error) throw error
    return data as MembershipPlan[]
  },

  async getActive(tenantId: string): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('type')
      .order('base_price')
    if (error) throw error
    return data as MembershipPlan[]
  },

  async create(tenantId: string, plan: PlanFormData): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .insert({ ...plan, tenant_id: tenantId })
      .select()
      .single()
    if (error) throw error
    return data as MembershipPlan
  },

  async update(tenantId: string, id: string, plan: Partial<PlanFormData>): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .update(plan)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as MembershipPlan
  },

  async toggleActive(tenantId: string, id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('membership_plans')
      .update({ is_active: isActive })
      .eq('tenant_id', tenantId)
      .eq('id', id)
    if (error) throw error
  },
}
