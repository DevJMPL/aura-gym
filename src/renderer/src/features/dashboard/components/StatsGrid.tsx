import { Users, TrendingUp, CalendarCheck, AlertCircle } from 'lucide-react'
import { StatCard } from '../../../components/ui'

interface StatsGridProps {
  stats: {
    activeMembers: number
    todayCheckins: number
    monthlyRevenue: number
    expiringSoon: number
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Miembros Activos"
        value={stats.activeMembers}
        icon={<Users className="w-6 h-6" />}
        color="primary"
      />
      <StatCard
        title="Asistencias de Hoy"
        value={stats.todayCheckins}
        icon={<CalendarCheck className="w-6 h-6" />}
        color="success"
      />
      <StatCard
        title="Próximos a Vencer"
        value={stats.expiringSoon}
        subtitle="En los próximos 7 días"
        icon={<AlertCircle className="w-6 h-6" />}
        color={stats.expiringSoon > 0 ? 'warning' : 'primary'}
      />
      <StatCard
        title="Ingresos del Mes"
        value={`$${stats.monthlyRevenue.toLocaleString('es-MX')}`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="success"
      />
    </div>
  )
}
