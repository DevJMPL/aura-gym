import { formatRelative } from '../../../utils/formatters'
import type { AttendanceRecord } from '../../../types/database'
import { Card, Badge, EmptyState } from '../../../components/ui'
import { CalendarCheck } from 'lucide-react'

interface RecentActivityProps {
  records: AttendanceRecord[]
  isLoading?: boolean
}

export function RecentActivity({ records, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card title={'Actividad Reciente'}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{'Actividad Reciente'}</h3>
        <Badge variant="success" dot>
          {records.length} {'hoy'}
        </Badge>
      </div>

      {records.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={'Sin actividad'}
            description={'Nadie ha registrado asistencia hoy todavía.'}
            icon={<CalendarCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {records.map((record) => (
            <div
              key={record.id}
              className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {record.member?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {record.member?.full_name || 'Miembro desconocido'}
                </p>
                <p className="text-xs text-slate-500">{record.member?.member_code || '---'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500">{formatRelative(record.check_in_at)}</p>
                <Badge variant={record.check_in_method === 'kiosk' ? 'info' : 'default'} size="sm">
                  {record.check_in_method === 'kiosk' ? 'Kiosco' : 'Manual'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
