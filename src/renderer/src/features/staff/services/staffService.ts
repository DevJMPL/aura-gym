import { supabase } from '../../../lib/supabase/client'
import { adminAuthClient } from '../../../lib/supabase/adminClient'
import type { AppUser } from '../../../types/database'

export interface CreateStaffData {
  email: string
  password: string
  fullName: string
  photoUrl?: string
}

export const staffService = {
  /**
   * Obtiene la lista de empleados (rol: staff)
   */
  async getStaff() {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as AppUser[]
  },

  /**
   * Crea un nuevo empleado.
   * Utiliza adminAuthClient para no cerrar la sesión del admin actual.
   */
  async createStaff(data: CreateStaffData) {
    // 1. Create auth user with the secondary client and pass metadata for the DB trigger
    const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: 'staff',
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user data returned from Supabase Auth')

    // If there is a photo, we update the created app_user record
    if (data.photoUrl) {
      await supabase.from('app_users').update({ photo_url: data.photoUrl }).eq('auth_id', authData.user.id)
    }

    // Fetch the inserted record to return
    const { data: userData, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single()

    if (fetchError) throw fetchError

    return userData as AppUser
  },

  /**
   * Activa o desactiva a un empleado
   */
  async toggleStaffStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('app_users')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Elimina un empleado (Normalmente se recomienda solo desactivar)
   * Nota: Para eliminar completamente, también se necesitaría un service_role para auth.users.
   * Por eso usamos desactivar.
   */
  async deleteStaff(id: string) {
    const { error } = await supabase.from('app_users').delete().eq('id', id)
    if (error) throw error
  },
}
