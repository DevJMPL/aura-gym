import { UserCircle, Mail, Phone, Calendar, Edit } from 'lucide-react'
import type { Member, AttendanceRecord } from '../../../types/database'
import { Card, Badge, Button } from '../../../components/ui'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'

interface MemberProfileProps {
  member: Member
  trainingDays?: number[]
  attendanceHistory?: AttendanceRecord[]
}

const DAYS_MAP = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function MemberProfile({
  member,
  trainingDays = [],
  attendanceHistory = [],
}: MemberProfileProps) {
  const variants = {
    active: 'success',
    expired: 'danger',
    suspended: 'warning',
    inactive: 'default',
  } as const

  const labels = {
    active: 'Activo',
    expired: 'Vencido',
    suspended: 'Suspendido',
    inactive: 'Inactivo',
  }

  // Calculate basic stats
  const validAttendances = attendanceHistory.filter(
    (r) => r.status === 'valid' || r.status === 'manual'
  )
  const totalAttendances = validAttendances.length

  // Calculate a rudimentary "streak" (consecutive days of attendance based on training days is complex,
  // so for MVP we just check if they attended in the last 7 days)
  let currentStreak = 0
  if (validAttendances.length > 0) {
    const lastAttendance = new Date(validAttendances[0].check_in_at)
    const daysSinceLast = (new Date().getTime() - lastAttendance.getTime()) / (1000 * 3600 * 24)
    if (daysSinceLast <= 7) {
      currentStreak = 1 // Simplified: "Activo esta semana"
    }
  }

  return (
    <Card className="relative">
      <div className="absolute top-6 right-6">
        <Link to={`/members/${member.id}/edit`}>
          <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>
            Editar
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="shrink-0">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-slate-50 shadow-sm">
              <UserCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{member.full_name}</h2>
              {member.username && (
                <span className="text-lg font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                  @{member.username}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                {member.member_code}
              </span>
              <Badge variant={variants[member.status] || 'default'}>
                {labels[member.status] || member.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {member.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {member.email}
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {member.phone}
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex items-center text-sm text-slate-500">
                <Calendar className="w-4 h-4 mr-2" />
                Nació el {new Date(member.date_of_birth + 'T12:00:00').toLocaleDateString('es-MX')}
              </div>
            )}
            {trainingDays.length > 0 && (
              <div className="flex items-center text-sm text-slate-500 sm:col-span-2">
                <span className="font-medium mr-2">Días de Entrenamiento:</span>
                <div className="flex gap-1">
                  {trainingDays
                    .sort((a, b) => a - b)
                    .map((d) => (
                      <span
                        key={d}
                        className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600"
                      >
                        {DAYS_MAP[d]}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {member.notes && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-900 mb-1">Notas</h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {member.notes}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Flame
                  className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-slate-300'}`}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Estado de Racha</p>
                <p className="text-sm font-medium text-slate-900">
                  {currentStreak > 0 ? 'Activo (Asistió recientemente)' : 'Sin racha'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Asistencias Totales</p>
              <p className="text-xl font-bold text-slate-900">{totalAttendances}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
