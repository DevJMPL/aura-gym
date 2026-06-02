import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Dumbbell, FileText, Briefcase, History, ShieldAlert } from 'lucide-react'
export function SettingsLayout() {
  const location = useLocation()
  const tabs = [
    {
      to: '/settings/gym',
      label: 'Gimnasio',
      icon: Dumbbell,
    },
    {
      to: '/settings/general',
      label: 'General',
      icon: FileText,
    },
    {
      to: '/settings/staff',
      label: 'Personal',
      icon: Briefcase,
    },
    {
      to: '/settings/login-history',
      label: 'Accesos',
      icon: History,
    },
    {
      to: '/settings/audit',
      label: 'Auditoría',
      icon: ShieldAlert,
    },
  ]
  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Centro de Administración
        </h1>
        <p className="text-slate-500 mt-1">
          Configura y administra todos los aspectos de tu gimnasio.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Navigation for Settings */}
        <div className="w-full">
          <nav className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-slate-100">
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.to)
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  title={tab.label}
                  className={`flex items-center justify-center p-3.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
                >
                  <tab.icon
                    className={`w-6 h-6 ${isActive ? 'text-primary-600' : 'text-slate-400'}`}
                  />
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
