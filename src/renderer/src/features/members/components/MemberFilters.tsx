import { Search, Plus } from 'lucide-react'
import { Input, Button } from '../../../components/ui'
import { Link } from 'react-router-dom'

interface MemberFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function MemberFilters({ searchQuery, onSearchChange }: MemberFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="w-full sm:max-w-md">
        <Input
          placeholder="Buscar por nombre, código o email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </div>

      <div className="w-full sm:w-auto">
        <Link to="/members/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" icon={<Plus className="w-4 h-4" />}>
            {'Nuevo Miembro'}
          </Button>
        </Link>
      </div>
    </div>
  )
}
