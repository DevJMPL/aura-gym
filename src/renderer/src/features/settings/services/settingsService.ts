import { supabase } from '../../../lib/supabase/client'
import type { GymSettings, GymSettingsFormData } from '../../../types/database'

export const settingsService = {
  async getSettings(): Promise<GymSettings | null> {
    const { data, error } = await supabase.from('gym_settings').select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data as GymSettings | null
  },

  async createSettings(settings: GymSettingsFormData): Promise<GymSettings> {
    const { data, error } = await supabase
      .from('gym_settings')
      .insert({ ...settings, is_configured: true })
      .select()
      .single()
    if (error) throw error
    return data as GymSettings
  },

  async updateSettings(id: string, settings: Partial<GymSettingsFormData>): Promise<GymSettings> {
    const { data, error } = await supabase
      .from('gym_settings')
      .update(settings)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as GymSettings
  },
}
