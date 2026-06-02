// ============================================================
// Audit & Login History Service
// ============================================================

import { supabase } from '../../../lib/supabase/client'
import type { AuditLog, UserLoginHistory } from '../../../types/database'

export interface LogActionParams {
  action: string
  entityType: string
  entityId?: string
  description?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export const auditService = {
  /**
   * Logs a user action into the audit_logs table
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Get app_user id
      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single()

      if (!appUser) return

      await supabase.from('audit_logs').insert({
        user_id: appUser.id,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        description: params.description,
        old_values: params.oldValues,
        new_values: params.newValues,
      })
    } catch (error) {
      console.error('Failed to write audit log:', error)
      // Do not throw, audit logging shouldn't break the main app flow
    }
  },

  /**
   * Records a user login into the history table
   * Uses basic browser APIs for device detection if available
   */
  async recordLogin(userId: string, userName: string): Promise<string | null> {
    try {
      // Basic OS detection
      let os = 'Unknown'
      if (window.navigator) {
        const ua = window.navigator.userAgent
        if (ua.includes('Win')) os = 'Windows'
        else if (ua.includes('Mac')) os = 'MacOS'
        else if (ua.includes('Linux')) os = 'Linux'
      }

      // Inside Electron, we might be able to get version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appVersion = (window as any).api?.appVersion || '1.0.0'

      const { data, error } = await supabase
        .from('user_login_history')
        .insert({
          user_id: userId,
          user_name: userName,
          operating_system: os,
          app_version: appVersion,
          device_name: 'Aura Desktop', // Fixed for desktop app
        })
        .select('id')
        .single()

      if (error) throw error
      return data?.id || null
    } catch (error) {
      console.error('Failed to record login:', error)
      return null
    }
  },

  /**
   * Updates a login record with logout time
   */
  async recordLogout(historyId: string): Promise<void> {
    if (!historyId) return
    try {
      await supabase
        .from('user_login_history')
        .update({ logout_at: new Date().toISOString() })
        .eq('id', historyId)
    } catch (error) {
      console.error('Failed to record logout:', error)
    }
  },

  /**
   * Fetches recent audit logs (Admin only)
   */
  async getAuditLogs(limit = 100): Promise<{ data: AuditLog[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id(id, full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data as any, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  /**
   * Fetches recent login history (Admin only)
   */
  async getLoginHistory(limit = 100): Promise<{ data: UserLoginHistory[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data as any, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}
