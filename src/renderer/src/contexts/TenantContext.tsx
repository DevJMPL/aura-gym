import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react'
import { supabase } from '../lib/supabase/client'
import { Tenant, TenantUser, UserRole } from '../types/database'
import { useAuth } from './AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { auditService } from '../features/settings/services/audit.service'

interface TenantContextType {
  activeTenantId: string | null
  activeTenant: Tenant | null
  currentTenantRole: UserRole | null
  availableTenants: TenantUser[]
  isLoadingTenants: boolean
  selectTenant: (tenantId: string) => void
  refreshTenants: () => Promise<void>
  clearTenant: () => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export const TenantProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { appUser } = useAuth()
  const queryClient = useQueryClient()

  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    const saved = localStorage.getItem('aura_active_tenant_id')
    return saved || null
  })

  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null)
  const [currentTenantRole, setCurrentTenantRole] = useState<UserRole | null>(null)
  const [availableTenants, setAvailableTenants] = useState<TenantUser[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(true)

  const refreshTenants = async () => {
    if (!appUser) {
      setAvailableTenants([])
      setIsLoadingTenants(false)
      return
    }

    setIsLoadingTenants(true)
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select(
          `
          id, tenant_id, user_id, role, is_active, created_at, updated_at,
          tenant:tenants (
            id, name, slug, owner_user_id, is_active, created_at, updated_at,
            gym_settings (address, logo_url)
          )
        `
        )
        .eq('user_id', appUser.id)
        .eq('is_active', true)

      if (error) throw error

      const validTenants = (data || []).filter(
        (tu: any) => tu.tenant && tu.tenant.is_active
      ) as unknown as TenantUser[]
      setAvailableTenants(validTenants)

      // If activeTenantId is set but not in validTenants, clear it
      if (activeTenantId && !validTenants.some((tu) => tu.tenant_id === activeTenantId)) {
        clearTenant()
      }
      // If we don't have an active tenant but we have tenants available, auto-select the first one
      // (Optional behavior, but good for single-gym owners)
      else if (!activeTenantId && validTenants.length === 1) {
        selectTenant(validTenants[0].tenant_id)
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  useEffect(() => {
    refreshTenants()
  }, [appUser])

  useEffect(() => {
    if (activeTenantId && availableTenants.length > 0) {
      const tu = availableTenants.find((t) => t.tenant_id === activeTenantId)
      if (tu && tu.tenant) {
        setActiveTenant(tu.tenant)
        setCurrentTenantRole(tu.role)
      }
    } else if (!activeTenantId) {
      setActiveTenant(null)
      setCurrentTenantRole(null)
    }
  }, [activeTenantId, availableTenants])

  // Track login history for the active tenant
  useEffect(() => {
    let currentLoginId: string | null = null

    if (activeTenantId && appUser) {
      auditService.recordLogin(activeTenantId, appUser.id, appUser.full_name).then((id) => {
        if (id) currentLoginId = id
      })
    }

    return () => {
      if (currentLoginId && activeTenantId) {
        auditService.recordLogout(activeTenantId, currentLoginId)
      }
    }
  }, [activeTenantId, appUser])

  const selectTenant = (tenantId: string) => {
    localStorage.setItem('aura_active_tenant_id', tenantId)
    setActiveTenantId(tenantId)

    // Invalidate all queries to prevent data leaks between tenants
    queryClient.invalidateQueries()
    queryClient.clear()

    // Audit Log for changing active gym
    if (appUser) {
      supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          user_id: appUser.id,
          action: 'Usuario seleccionó gimnasio',
          entity_type: 'tenant',
          entity_id: tenantId,
          description: `Usuario cambió su gimnasio activo a ${tenantId}`,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to log tenant selection:', error)
        })
    }
  }

  const clearTenant = () => {
    localStorage.removeItem('aura_active_tenant_id')
    setActiveTenantId(null)
    setActiveTenant(null)
    setCurrentTenantRole(null)

    // Invalidate and clear queries
    queryClient.invalidateQueries()
    queryClient.clear()
  }

  return (
    <TenantContext.Provider
      value={{
        activeTenantId,
        activeTenant,
        currentTenantRole,
        availableTenants,
        isLoadingTenants,
        selectTenant,
        refreshTenants,
        clearTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
