import { useEffect, useState } from 'react'

import { memberService } from '../../features/members/services/memberService'
import { attendanceService } from '../../features/attendance/services/attendanceService'
import { membershipService } from '../../features/memberships/services/membershipService'
import { StatsGrid } from '../../features/dashboard/components/StatsGrid'
import { RecentActivity } from '../../features/dashboard/components/RecentActivity'
import { AlertsPanel } from '../../features/dashboard/components/AlertsPanel'
import { LoadingState } from '../../components/ui'
import { useTenant } from '../../contexts/TenantContext'

export function DashboardPage() {
  const { activeTenantId } = useTenant()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    activeMembers: 0,
    todayCheckins: 0,
    monthlyRevenue: 0,
    expiringSoon: 0,
  })
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [expiringMemberships, setExpiringMemberships] = useState<any[]>([])
  useEffect(() => {
    async function loadDashboardData() {
      if (!activeTenantId) return
      try {
        setIsLoading(true)
        const [memberCount, todayCheckins, todayRecords, expiring] = await Promise.all([
          memberService.getCount(activeTenantId),
          attendanceService.getTodayCount(activeTenantId),
          attendanceService.getTodayRecords(activeTenantId),
          membershipService.getExpiringSoon(activeTenantId, 7),
        ])
        setStats({
          activeMembers: memberCount.active,
          todayCheckins,
          monthlyRevenue: 0,
          // Mocked for now, needs payment service sum
          expiringSoon: expiring.length,
        })
        setRecentRecords(todayRecords)
        setExpiringMemberships(expiring)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [activeTenantId])
  if (isLoading) {
    return <LoadingState fullScreen message={'Cargando panel...'} />
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{'Bienvenido'}</h1>
        <p className="text-slate-500 mt-1">{'Este es el resumen de tu gimnasio hoy.'}</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 h-full">
          <RecentActivity records={recentRecords} />
        </div>
        <div className="h-full">
          <AlertsPanel expiringMemberships={expiringMemberships} />
        </div>
      </div>
    </div>
  )
}
