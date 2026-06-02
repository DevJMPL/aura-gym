// ============================================================
// ReportsLayout Component
// Tab navigation between report sub-pages
// ============================================================

import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  DollarSign,
  CalendarCheck,
  CreditCard,
  Users,
} from 'lucide-react'

const getReportTabs = () => [
  { to: '/reports', label: "General", icon: LayoutDashboard, end: true },
  { to: '/reports/financial', label: "Financiero", icon: DollarSign, end: false },
  { to: '/reports/attendance', label: "Asistencias", icon: CalendarCheck, end: false },
  { to: '/reports/memberships', label: "Membresías", icon: CreditCard, end: false },
  { to: '/reports/members', label: "Miembros", icon: Users, end: false },
]

export function ReportsLayout() {
  const reportTabs = getReportTabs()

  return (
    <div className="flex flex-col gap-0">
      {/* Tab navigation */}
      <nav className="flex items-center gap-1 bg-white/70 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-1.5 mb-6 overflow-x-auto">
        {reportTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Sub-page content */}
      <Outlet />
    </div>
  )
}
