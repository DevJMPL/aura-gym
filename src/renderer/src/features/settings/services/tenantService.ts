import { supabase } from '../../../lib/supabase/client'
import type { Tenant } from '../../../types/database'

export const tenantService = {
  async createTenant(
    appUserId: string,
    data: {
      name: string
      currency: string
      timezone: string
      address?: string
      phone?: string
      email?: string
      logo_url?: string
    }
  ): Promise<Tenant> {
    // 1. Create Tenant
    const slug =
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
        slug,
        owner_user_id: appUserId,
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // 2. Add owner to tenant_users
    const { error: tuError } = await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: appUserId,
      role: 'admin',
    })

    if (tuError) throw tuError

    // 3. Create default gym_settings
    const { error: gsError } = await supabase.from('gym_settings').insert({
      tenant_id: tenant.id,
      name: data.name,
      currency: data.currency,
      timezone: data.timezone,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      logo_url: data.logo_url || null,
      business_days: ['1', '2', '3', '4', '5', '6'],
      opening_time: '06:00',
      closing_time: '22:00',
      is_configured: true,
    })

    if (gsError) throw gsError

    // 4. Record Audit Log for Creation
    try {
      await supabase.from('audit_logs').insert({
        tenant_id: tenant.id,
        user_id: appUserId,
        action: 'Usuario creó un nuevo gimnasio',
        entity_type: 'tenant',
        entity_id: tenant.id,
        description: `Se creó el gimnasio ${data.name}`,
      })
    } catch (e) {
      console.error('Failed to log tenant creation:', e)
    }

    return tenant as Tenant
  },
}
