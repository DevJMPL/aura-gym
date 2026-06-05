import { Archive, CheckCircle2, Edit2, ImageIcon, Package } from 'lucide-react'
import type { PosProduct } from '../../../types/database'
import { Button } from '../../../components/ui'

interface ProductTableProps {
  products: PosProduct[]
  isLoading: boolean
  search: string
  filters: React.ReactNode
  pagination: React.ReactNode
  onCreate: () => void
  onEdit: (product: PosProduct) => void
  onToggle: (product: PosProduct) => void
}

const money = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

export function ProductTable({
  products,
  isLoading,
  search,
  filters,
  pagination,
  onCreate,
  onEdit,
  onToggle,
}: ProductTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {filters}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Costo</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Inventario</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                    Cargando productos...
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-900">No hay productos</p>
                  <p className="text-sm text-slate-500">
                    {search
                      ? 'No se encontraron productos con esos filtros.'
                      : 'Crea productos para comenzar a vender en el kiosko.'}
                  </p>
                  {!search && (
                    <Button
                      onClick={onCreate}
                      className="mt-5 mx-auto cursor-pointer"
                      icon={<Package className="w-4 h-4" />}
                    >
                      Crear primer producto
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400 m-3" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">
                            {product.name}
                          </span>
                          <StatusBadge isActive={product.is_active} />
                        </div>
                        <span className="text-xs text-slate-500">{product.sku || 'Sin SKU'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{product.category || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {money(product.cost_price)}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-bold">
                    {money(product.sale_price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStockClass(product)}>
                      {product.track_inventory ? product.stock_quantity : 'Libre'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                        title="Editar producto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggle(product)}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title={product.is_active ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {product.is_active ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">{pagination}</div>
      )}
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isActive
          ? 'bg-green-100 text-green-700 border-green-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function getStockClass(product: PosProduct) {
  if (!product.track_inventory) return 'text-slate-500'
  if (product.stock_quantity <= product.low_stock_threshold) {
    return 'text-yellow-700 text-xs bg-yellow-50 px-2 py-1 rounded border border-yellow-100 font-medium'
  }
  return 'text-slate-600 font-medium'
}
