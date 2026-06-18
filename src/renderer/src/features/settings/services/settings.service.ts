// ============================================================
// Settings Service
// ============================================================

import { supabase } from '../../../lib/supabase/client'
import type { GymSettings, AppUser } from '../../../types/database'
import { auditService } from './audit.service'

export const settingsService = {
  /**
   * Upload an image to Supabase Storage
   * Returns the public URL of the uploaded image
   */
  async uploadImage(file: File, bucket: string, path: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}-${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  },

  /**
   * Update the Gym Settings
   */
  async updateGymSettings(
    tenantId: string,
    id: string,
    updates: Partial<GymSettings>
  ): Promise<void> {
    // Get old settings for audit
    const { data: oldSettings } = await supabase
      .from('gym_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('gym_settings')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', id)

    if (error) throw error

    // Log the action
    await auditService.logAction(tenantId, {
      action: 'UPDATE_SETTINGS',
      entityType: 'gym_settings',
      entityId: id,
      description: 'Configuración del gimnasio actualizada',
      oldValues: oldSettings as Record<string, unknown>,
      newValues: { ...oldSettings, ...updates } as Record<string, unknown>,
    })
  },

  /**
   * Update the Admin/Staff Profile (AppUser)
   */
  async updateProfile(id: string, updates: Partial<AppUser>): Promise<void> {
    const { error } = await supabase.from('app_users').update(updates).eq('id', id)

    if (error) throw error

    // Also update auth user if email/password changes (though not supported directly here yet)
  },
}
