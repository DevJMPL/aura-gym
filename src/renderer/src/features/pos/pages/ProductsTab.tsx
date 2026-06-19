import { useState } from 'react'
import { Plus, Edit2, AlertCircle, Package } from 'lucide-react'
import { Button, Table, Badge, Modal, Input, Select, EmptyState } from '../../../components/ui'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { productService } from '../services/productService'
import { useTenant } from '../../../contexts/TenantContext'
import type { Product } from '../../../types/database'
import { formatCurrency } from '../../../utils/formatters'

export function ProductsTab() {
  const { activeTenantId } = useTenant()
  const { products, isLoading, fetchProducts } = useProducts()
  const { categories } = useCategories()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    sku: '',
    barcode: '',
    unit: 'piece',
    sale_price: 0,
    purchase_cost: 0,
    minimum_stock: 0,
    allow_negative_stock: false,
    is_active: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category_id: product.category_id || '',
        description: product.description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        unit: product.unit,
        sale_price: product.sale_price,
        purchase_cost: product.purchase_cost,
        minimum_stock: product.minimum_stock,
        allow_negative_stock: product.allow_negative_stock,
        is_active: product.is_active,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category_id: '',
        description: '',
        sku: '',
        barcode: '',
        unit: 'piece',
        sale_price: 0,
        purchase_cost: 0,
        minimum_stock: 0,
        allow_negative_stock: false,
        is_active: true,
      })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTenantId) return

    if (!formData.name.trim() || formData.sale_price < 0) {
      setError('Verifica los campos obligatorios y que el precio sea mayor o igual a cero.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      name: formData.name.trim(),
      category_id: formData.category_id || null,
      description: formData.description.trim() || null,
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim() || null,
      unit: formData.unit,
      sale_price: formData.sale_price,
      purchase_cost: formData.purchase_cost,
      minimum_stock: formData.minimum_stock,
      allow_negative_stock: formData.allow_negative_stock,
      is_active: formData.is_active,
    }

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload)
      } else {
        await productService.createProduct(activeTenantId, payload)
      }

      await fetchProducts()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (product: Product) => {
    try {
      await productService.toggleProductStatus(product.id, !product.is_active)
      fetchProducts()
    } catch (err) {
      console.error('Error toggling status', err)
    }
  }

  const columns = [
    {
      key: 'product',
      header: 'Producto',
      render: (row: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.name}</div>
            {row.barcode && <div className="text-xs text-slate-500">CB: {row.barcode}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row: Product) => <span className="text-slate-600">{row.category?.name || '-'}</span>,
    },
    {
      key: 'price',
      header: 'Precio',
      render: (row: Product) => (
        <span className="font-medium text-emerald-600">{formatCurrency(row.sale_price)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row: Product) => (
        <div className="flex flex-col">
          <span
            className={`font-medium ${row.current_stock <= row.minimum_stock ? 'text-red-600' : 'text-slate-700'}`}
          >
            {row.current_stock} {row.unit}
          </span>
          {row.current_stock <= row.minimum_stock && (
            <span className="text-[10px] text-red-500 font-bold uppercase">Stock Bajo</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Product) => (
        <button onClick={() => toggleStatus(row)} className="hover:opacity-80 transition-opacity">
          <Badge variant={row.is_active ? 'success' : 'default'}>
            {row.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900">Catálogo de Productos</h2>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Agrega productos para comenzar a vender en tu gimnasio."
          action={<Button onClick={() => handleOpenModal()}>Nuevo Producto</Button>}
        />
      ) : (
        <Table columns={columns} data={products} keyExtractor={(row) => row.id} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del producto"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej. Agua Embotellada"
              required
              autoFocus
            />

            <Select
              label="Categoría"
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
              options={[
                { value: '', label: 'Sin categoría' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código de Barras"
              value={formData.barcode}
              onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
              placeholder="Escanea o escribe"
            />
            <Input
              label="SKU (Opcional)"
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="Ej. AGUA-01"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Precio de Venta"
              type="number"
              min="0"
              step="0.01"
              value={formData.sale_price || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))
              }
              required
            />
            <Input
              label="Costo Compra"
              type="number"
              min="0"
              step="0.01"
              value={formData.purchase_cost || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, purchase_cost: parseFloat(e.target.value) || 0 }))
              }
            />
            <Select
              label="Unidad"
              value={formData.unit}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              options={[
                { value: 'piece', label: 'Pieza' },
                { value: 'bottle', label: 'Botella' },
                { value: 'box', label: 'Caja' },
                { value: 'service', label: 'Servicio' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Stock Mínimo"
                type="number"
                min="0"
                value={formData.minimum_stock || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimum_stock: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
              <p className="text-xs text-slate-500 mt-1">Alerta cuando haya pocas piezas.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_negative_stock}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, allow_negative_stock: e.target.checked }))
              }
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            <span className="text-sm text-slate-700">
              Permitir vender sin stock (stock negativo)
            </span>
          </label>

          {editingProduct && (
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm text-slate-700">Producto Activo</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
