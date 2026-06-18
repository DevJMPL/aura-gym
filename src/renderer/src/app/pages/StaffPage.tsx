import { useState, useEffect } from 'react'
import { Briefcase, Plus, Shield, Search, Mail, Calendar } from 'lucide-react'
import { staffService } from '../../features/staff/services/staffService'
import { StaffModal } from '../../features/staff/components/StaffModal'
import type { AppUser } from '../../types/database'

export function StaffPage() {
  const [staff, setStaff] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadStaff = async () => {
    try {
      setIsLoading(true)
      const data = await staffService.getStaff()
      setStaff(data)
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await staffService.toggleStaffStatus(id, currentStatus)
      await loadStaff()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Error al cambiar el estado del empleado')
    }
  }

  const filteredStaff = staff.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{'Personal'}</h2>
            <p className="text-slate-500 mt-1">{'Gestiona los empleados de tu gimnasio.'}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-medium text-sm shadow-sm hover:shadow shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          {'Nuevo Empleado'}
        </button>
      </div>

      {/* Stats & Search */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{'Total Empleados'}</p>
              <p className="text-xl font-bold text-slate-900">{staff.length}</p>
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={'Buscar por nombre o email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{'Cargando empleados...'}</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{'No hay empleados'}</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              {searchTerm
                ? 'No se encontraron empleados que coincidan con tu búsqueda.'
                : 'Aún no has registrado ningún empleado en tu gimnasio.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-primary-600 font-medium text-sm hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg"
              >
                {'Añadir tu primer empleado'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4 pl-6">{'Empleado'}</th>
                  <th className="p-4">{'Contacto'}</th>
                  <th className="p-4">{'Rol'}</th>
                  <th className="p-4">{'Estado'}</th>
                  <th className="p-4 text-right pr-6">{'Acciones'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm border border-primary-200">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {'Agregado'} {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                        <Shield className="w-3.5 h-3.5" />
                        {'Staff'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        ></span>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            user.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadStaff}
      />
    </div>
  )
}
