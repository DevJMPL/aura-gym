import { useState, useEffect } from 'react'
import { ShieldAlert, Search, Activity, User, Settings, CreditCard } from 'lucide-react'
import { Card, LoadingState, Badge } from '../../../components/ui'
import { auditService } from '../services/audit.service'
import type { AuditLog } from '../../../types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await auditService.getAuditLogs(100)
      if (data) setLogs(data)
      setIsLoading(false)
    }
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'route':
        return <ShieldAlert className="w-4 h-4 text-red-500" />
      case 'app_users':
        return <User className="w-4 h-4 text-blue-500" />
      case 'gym_settings':
        return <Settings className="w-4 h-4 text-slate-500" />
      case 'members':
        return <UsersIcon className="w-4 h-4 text-green-500" />
      case 'plans':
        return <CreditCard className="w-4 h-4 text-amber-500" />
      default:
        return <Activity className="w-4 h-4 text-primary-500" />
    }
  }

  // Define UsersIcon here since it's not exported from lucide-react directly
  const UsersIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )

  const getActionBadge = (action: string) => {
    if (action.includes('UNAUTHORIZED')) return <Badge variant="danger">Alerta</Badge>
    if (action.includes('UPDATE')) return <Badge variant="info">Actualización</Badge>
    if (action.includes('CREATE')) return <Badge variant="success">Creación</Badge>
    if (action.includes('DELETE')) return <Badge variant="danger">Eliminación</Badge>
    return <Badge variant="default">Sistema</Badge>
  }

  if (isLoading) {
    return <LoadingState message="Cargando auditoría..." />
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Auditoría</h2>
          <p className="text-slate-500">
            Registro de todas las acciones importantes y cambios de configuración.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Fecha y Hora
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Usuario
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Evento
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50 transition-colors ${log.action.includes('UNAUTHORIZED') ? 'bg-red-50/30' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                        {log.user?.full_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {log.user?.full_name || 'Sistema'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      {getActionBadge(log.action)}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        {getEntityIcon(log.entity_type)}
                        <span className="capitalize">{log.entity_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{log.description}</p>
                    {log.action.includes('UNAUTHORIZED') && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        "Intento de acceso bloqueado por RBAC"
                      </p>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mb-3" />
                      <p>"No se encontraron registros de auditoría."</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
