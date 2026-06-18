import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Settings,
  ScanLine,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTenant } from '../../contexts/TenantContext'
import logoImage from '../../assets/logo.jpg'

const getNavItems = () => [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Miembros' },
  { to: '/plans', icon: CreditCard, label: 'Planes' },
  { to: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { to: '/kiosk', icon: ScanLine, label: 'Kiosco' },
  { to: '/reports', icon: BarChart3, label: 'Reportes', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Configuración', adminOnly: true },
  { to: '/developer', icon: Info, label: 'Soporte' },
]

export function MainLayout() {
  const { appUser } = useAuth()
  const { activeTenant, currentTenantRole } = useTenant()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems = getNavItems()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-slate-50 relative" style={{ overflow: 'hidden' }}>
      {/* Decorative background for the whole app (glassmorphism feel) */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 pointer-events-none"></div>

      {/* Sidebar */}
      <aside
        className={`relative z-20 flex flex-col shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Collapse toggle button - outside overflow-hidden via absolute so we need to use overflow-visible on this element */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-white border border-slate-200 shadow-sm rounded-full p-1.5 text-slate-400 hover:text-primary-600 hover:scale-110 hover:shadow transition-all z-30 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo / Gym Name */}
        <div
          className={`px-4 py-6 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex shrink-0 items-center justify-center shadow-md shadow-slate-300 transform transition-transform hover:scale-105 duration-300 overflow-hidden">
            <img src={logoImage} alt="Aura Logo" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h1 className="text-slate-900 font-extrabold text-lg truncate tracking-tight">
                {activeTenant?.name || 'Aura Gym'}
              </h1>
              <p className="text-slate-500 text-xs font-medium truncate">{'Gestión de Gimnasio'}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || currentTenantRole === 'admin')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon
                  className={`shrink-0 transition-colors ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
        </nav>

        {/* Gym Switcher */}
        <div className="p-4 border-t border-slate-100 bg-white/50">
          <button
            onClick={() => navigate('/select-gym')}
            className={`w-full flex items-center gap-3 transition-all duration-300 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-primary-100 ${
              isCollapsed ? 'justify-center p-2' : 'p-2'
            }`}
          >
            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center border border-primary-200 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left animate-fade-in">
                <p className="text-slate-900 text-sm font-bold truncate">
                  {activeTenant?.name || 'Gimnasio'}
                </p>
                <p className="text-slate-500 text-xs font-medium">Cambiar gimnasio</p>
              </div>
            )}
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-slate-100 bg-white/50">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 transition-all duration-300 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent ${
                isActive ? 'bg-primary-50 border-primary-100' : ''
              } ${isCollapsed ? 'justify-center flex-col p-2' : 'p-2'}`
            }
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-primary-600 text-sm font-bold border border-slate-200 shadow-inner overflow-hidden">
              {appUser?.photo_url ? (
                <img src={appUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                appUser?.full_name?.[0]?.toUpperCase() || 'A'
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-slate-900 text-sm font-bold truncate group-hover:text-primary-600 transition-colors">
                  {appUser?.full_name || 'Usuario'}
                </p>
                <p className="text-slate-500 text-xs font-medium capitalize">
                  {currentTenantRole === 'admin' ? 'Dueño' : 'Staff'}
                </p>
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10 transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
