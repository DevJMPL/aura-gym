import { useTenant } from '../../contexts/TenantContext'
import { useAuth } from '../../contexts/AuthContext'
import { Dumbbell, Plus, ArrowRight, MapPin, CalendarDays, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function SelectGymPage() {
  const { availableTenants, selectTenant, isLoadingTenants } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (isLoadingTenants) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in border border-slate-200">
        <div className="bg-primary-600 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-700 rounded-full -translate-x-1/2 translate-y-1/2 opacity-50" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Selecciona tu Gimnasio</h1>
            <p className="text-primary-100 text-sm mt-2 max-w-sm">
              Hola, {user?.email}. Tienes acceso a los siguientes gimnasios.
            </p>
          </div>
        </div>

        <div className="p-8">
          {availableTenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-6">No tienes gimnasios registrados aún.</p>
              <Button onClick={() => navigate('/setup')} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Crear mi primer gimnasio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTenants.map((tu) => {
                  const settings = tu.tenant?.gym_settings?.[0]
                  const logoUrl = settings?.logo_url
                  const address = settings?.address
                  const isActive = tu.tenant?.is_active
                  const createdAt = tu.tenant?.created_at
                    ? format(new Date(tu.tenant.created_at), "d 'de' MMM, yyyy", { locale: es })
                    : ''

                  return (
                    <button
                      key={tu.tenant_id}
                      onClick={() => {
                        selectTenant(tu.tenant_id)
                        navigate('/dashboard')
                      }}
                      className="flex flex-col text-left p-6 rounded-xl border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all group bg-white relative"
                    >
                      {/* Top Row: Icon/Logo and Role */}
                      <div className="flex justify-between items-start mb-4 w-full">
                        <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center overflow-hidden border border-primary-100 group-hover:border-primary-500 transition-colors shrink-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {tu.role === 'admin' ? 'Dueño' : 'Staff'}
                          </span>
                          {isActive && (
                            <span className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gym Details */}
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {tu.tenant?.name || 'Gimnasio'}
                      </h3>

                      <div className="mt-2 space-y-1.5 flex-1 w-full">
                        {address && (
                          <div className="flex items-center text-xs text-slate-500 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">{address}</span>
                          </div>
                        )}
                        {createdAt && (
                          <div className="flex items-center text-xs text-slate-500">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            Creado el {createdAt}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action */}
                      <div className="flex items-center text-sm font-medium text-slate-400 mt-5 group-hover:text-primary-600 transition-colors w-full justify-end">
                        Entrar{' '}
                        <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <Button variant="outline" onClick={() => navigate('/setup')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear otro gimnasio
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
