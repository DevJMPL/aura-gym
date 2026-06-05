import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductPaginationProps {
  page: number
  pageCount: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ProductPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: ProductPaginationProps) {
  if (pageCount <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  const pages = getVisiblePages(page, pageCount)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Mostrando{' '}
        <span className="font-medium text-slate-700">
          {start}-{end}
        </span>{' '}
        de <span className="font-medium text-slate-700">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={navButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`${item}-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                item === page
                  ? 'bg-primary-50 text-primary-600 border border-primary-100'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className={navButtonClass}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function getVisiblePages(page: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const pages: Array<number | 'ellipsis'> = [1]
  if (page > 3) pages.push('ellipsis')

  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)

  for (let item = start; item <= end; item += 1) {
    pages.push(item)
  }

  if (page < pageCount - 2) pages.push('ellipsis')
  pages.push(pageCount)

  return pages
}

const navButtonClass =
  'w-8 h-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center transition-colors'
