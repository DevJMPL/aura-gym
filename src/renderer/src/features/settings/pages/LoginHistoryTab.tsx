import { useState, useEffect } from 'react'
import { History, Search, Laptop, Monitor } from 'lucide-react'
import { Card, LoadingState } from '../../../components/ui'
import { auditService } from '../services/audit.service'
import { useTenant } from '../../../contexts/TenantContext'
import type { UserLoginHistory } from '../../../types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function LoginHistoryTab() {
  const { activeTenantId } = useTenant()
  const [logs, setLogs] = useState<UserLoginHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      if (!activeTenantId) return
      const { data } = await auditService.getLoginHistory(activeTenantId, 100)
      if (data) setLogs(data)
      setIsLoading(false)
    }
    fetchLogs()
  }, [activeTenantId])

  const filteredLogs = logs.filter(
    (log) =>
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.device_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Cargando historial de accesos..." />
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Accesos</h2>
          <p className="text-slate-500">Bitácora de inicios y cierres de sesión del personal.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar usuario o equipo..."
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
                  Usuario
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Inicio de sesión
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Cierre de sesión
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Equipo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                        {log.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {log.user_name || 'Desconocido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {format(new Date(log.login_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(log.login_at), 'HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.logout_at ? (
                      <>
                        <div className="text-sm font-medium text-slate-900">
                          {format(new Date(log.logout_at), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(log.logout_at), 'HH:mm:ss')}
                        </div>
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.operating_system?.includes('Mac') ? (
                        <Laptop className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Monitor className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {log.device_name || 'Desconocido'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.operating_system || 'OS Desconocido'}{' '}
                          {log.app_version ? `(v${log.app_version})` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 text-slate-300 mb-3" />
                      <p>No se encontraron registros de acceso.</p>
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
