import { NavLink, Outlet } from 'react-router-dom'
import { Package, Tags, ArrowLeftRight, ShoppingBag } from 'lucide-react'

export function InventoryLayout() {
  const tabs = [
    { to: '/inventory/products', icon: Package, label: 'Productos' },
    { to: '/inventory/categories', icon: Tags, label: 'Categorías' },
    { to: '/inventory/movements', icon: ArrowLeftRight, label: 'Movimientos' },
    { to: '/inventory/sales', icon: ShoppingBag, label: 'Ventas' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventario y Catálogo</h1>
        <p className="text-slate-500 mt-1">
          Gestiona los productos, categorías e historial de ventas de tu gimnasio.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          ))}
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
