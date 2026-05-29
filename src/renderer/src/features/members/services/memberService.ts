import { supabase } from '../../../lib/supabase/client'
import type { Member, MemberFormData } from '../../../types/database'

export const memberService = {
  async getAll(search?: string): Promise<Member[]> {
    let query = supabase.from('members').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,member_code.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data as Member[]
  },

  async getById(id: string): Promise<Member> {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single()
    if (error) throw error
    return data as Member
  },

  async searchMembers(query: string) {
    // If the query is empty, return empty
    if (!query || query.trim().length < 2) return []

    const searchTerm = `%${query.trim()}%`
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(`full_name.ilike.${searchTerm},member_code.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .limit(10)

    if (error) throw error
    return data as Member[]
  },

  async getByIdentifier(identifier: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(`member_code.eq.${identifier},username.eq.${identifier}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Member
  },

  async create(member: MemberFormData): Promise<Member> {
    // Generate member code via DB function
    const { data: codeData, error: codeError } = await supabase.rpc('generate_member_code')
    if (codeError) throw codeError

    const { data, error } = await supabase
      .from('members')
      .insert({ ...member, member_code: codeData as string })
      .select()
      .single()
    if (error) throw error
    return data as Member
  },

  async update(id: string, member: Partial<MemberFormData>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update(member)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Member
  },

  async getTrainingDays(memberId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('member_training_days')
      .select('day_of_week')
      .eq('member_id', memberId)
    if (error) throw error
    return data.map((d: any) => d.day_of_week)
  },

  async saveTrainingDays(memberId: string, days: number[]): Promise<void> {
    const { error: delError } = await supabase
      .from('member_training_days')
      .delete()
      .eq('member_id', memberId)
    if (delError) throw delError

    if (days.length > 0) {
      const { error: insError } = await supabase
        .from('member_training_days')
        .insert(days.map(day => ({ member_id: memberId, day_of_week: day })))
      if (insError) throw insError
    }
  },

  async getCount(): Promise<{ active: number; expired: number; total: number }> {
    const { count: active } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    const { count: total } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
    const { count: expired } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')

    return { active: active || 0, expired: expired || 0, total: total || 0 }
  },
}
