import { Users } from 'lucide-react'
import { useMembers } from '../../features/members/hooks/useMembers'
import { MemberFilters } from '../../features/members/components/MemberFilters'
import { MemberTable } from '../../features/members/components/MemberTable'
import { AlertBanner } from '../../components/ui'

export function MembersListPage() {
  const { members, isLoading, error, searchQuery, setSearchQuery } = useMembers()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Miembros</h1>
          <p className="text-slate-500 mt-1">Gestiona los clientes de tu gimnasio</p>
        </div>
      </div>

      <MemberFilters 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />

      {error && (
        <AlertBanner 
          type="error" 
          message="Hubo un error al cargar los miembros. Por favor, intenta de nuevo." 
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Cargando miembros...</div>
        ) : (
          <MemberTable members={members} />
        )}
      </div>
    </div>
  )
}
