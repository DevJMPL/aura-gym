import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { auditService } from '../../features/settings/services/audit.service'
import { useTenant } from '../../contexts/TenantContext'

interface AccessDeniedProps {
  path?: string
}

export function AccessDenied({ path }: AccessDeniedProps) {
  const navigate = useNavigate()

  const { activeTenantId } = useTenant()

  useEffect(() => {
    // Log the unauthorized access attempt
    if (activeTenantId) {
      auditService.logAction(activeTenantId, {
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entityType: 'route',
        description: `${'Intento de acceso denegado a ruta protegida: '}${path || window.location.pathname}`,
      })
    }
  }, [path, activeTenantId])

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in">
      <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{'Acceso Denegado'}</h1>
      <p className="text-slate-500 text-center max-w-md mb-8">
        {
          'No tienes los permisos necesarios para acceder a esta sección. Si crees que esto es un error, contacta al administrador del sistema.'
        }
      </p>

      <button
        onClick={() => navigate('/dashboard', { replace: true })}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/10 hover:shadow-md cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {'Volver al Inicio'}
      </button>
    </div>
  )
}
