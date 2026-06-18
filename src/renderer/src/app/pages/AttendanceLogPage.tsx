import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Filter,
  AlertCircle,
  Dumbbell,
} from 'lucide-react'
import { attendanceService } from '../../features/attendance/services/attendanceService'
import { useTenant } from '../../contexts/TenantContext'
import type { AttendanceRecord, AttendanceStatus } from '../../types/database'

export function AttendanceLogPage() {
  const { activeTenantId } = useTenant()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all')

  useEffect(() => {
    loadRecords()
  }, [dateFilter, statusFilter, activeTenantId])

  const loadRecords = async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    try {
      const data = await attendanceService.getHistory(activeTenantId, {
        date: dateFilter || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      })
      setRecords(data)
    } catch (error) {
      console.error('Error loading attendance records:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> {'Permitido'}
          </span>
        )
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
            <Dumbbell className="w-3.5 h-3.5" /> {'Duplicado'}
          </span>
        )
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> {'Denegado'}
          </span>
        )
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> {'Manual'}
          </span>
        )
    }
  }

  const getDenialReasonText = (reason: string | null) => {
    switch (reason) {
      case 'expired_membership':
        return 'Membresía vencida'
      case 'inactive_member':
        return 'Miembro inactivo'
      case 'suspended_member':
        return 'Miembro suspendido'
      case 'not_found':
        return 'Código no encontrado'
      default:
        return reason || 'Desconocido'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{'Historial de Asistencias'}</h1>
          <p className="text-sm text-slate-500">{'Consulta los registros de acceso al gimnasio'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow w-full sm:w-auto"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | 'all')}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow appearance-none w-full sm:w-auto"
              >
                <option value="all">{'Todos los estados'}</option>
                <option value="valid">{'Permitidos'}</option>
                <option value="denied">{'Denegados'}</option>
                <option value="duplicate">{'Duplicados'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{'Hora'}</th>
                <th className="px-6 py-4">{'Miembro'}</th>
                <th className="px-6 py-4">{'Método'}</th>
                <th className="px-6 py-4">{'Estado'}</th>
                <th className="px-6 py-4">{'Detalles'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                      {'Cargando registros...'}
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    {'No hay registros de asistencia para esta fecha y filtros'}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {format(new Date(record.check_in_at), 'HH:mm:ss', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      {record.member ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {record.member.full_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {record.member.member_code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{'Desconocido'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-600">
                        {record.check_in_method === 'member_code'
                          ? 'Código'
                          : record.check_in_method === 'kiosk'
                            ? 'Kiosco'
                            : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.status === 'denied' && record.denial_reason ? (
                        <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded border border-red-100">
                          {getDenialReasonText(record.denial_reason)}
                        </span>
                      ) : record.status === 'duplicate' ? (
                        <span className="text-yellow-600 text-xs">{'Ya había ingresado hoy'}</span>
                      ) : record.notes ? (
                        <span className="text-slate-500 text-xs">{record.notes}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
