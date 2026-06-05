import { Filter, ListFilter, Search } from 'lucide-react'

interface ProductFiltersProps {
  search: string
  category: string
  categories: string[]
  pageSize: number
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPageSizeChange: (value: number) => void
}

export function ProductFilters({
  search,
  category,
  categories,
  pageSize,
  onSearchChange,
  onCategoryChange,
  onPageSizeChange,
}: ProductFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar producto..."
            className={`${controlClass} pl-9 pr-4 w-full sm:w-72`}
          />
        </div>

        <div className="relative">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`${controlClass} pl-9 pr-8 appearance-none w-full sm:w-auto cursor-pointer`}
          >
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative w-full sm:w-auto">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`${controlClass} pl-9 pr-8 appearance-none w-full sm:w-auto cursor-pointer`}
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </div>
  )
}

const controlClass =
  'py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow'
