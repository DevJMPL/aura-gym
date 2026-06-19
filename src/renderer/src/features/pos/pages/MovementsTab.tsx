import { useState } from 'react'
import { Plus, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react'
import { Button, Table, Modal, Input, Select, EmptyState } from '../../../components/ui'
import { useInventory } from '../hooks/useInventory'
import { useProducts } from '../hooks/useProducts'
import { inventoryService } from '../services/inventoryService'
import { useTenant } from '../../../contexts/TenantContext'
import type { InventoryMovement, MovementType } from '../../../types/database'
import { format } from 'date-fns'

export function MovementsTab() {
  const { activeTenantId } = useTenant()
  const { movements, isLoading, fetchMovements } = useInventory()
  const { products } = useProducts() // For the adjust stock dropdown

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'adjustment_in' as MovementType,
    quantity: 1,
    reason: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = () => {
    setFormData({
      product_id: '',
      movement_type: 'adjustment_in',
      quantity: 1,
      reason: '',
    })
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTenantId) return

    if (!formData.product_id || formData.quantity <= 0) {
      setError('Verifica los campos. La cantidad debe ser mayor a cero.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const isOut = ['sale', 'adjustment_out', 'cancellation'].includes(formData.movement_type)
    const quantityChange = isOut ? -formData.quantity : formData.quantity

    try {
      await inventoryService.adjustStock(
        activeTenantId,
        formData.product_id,
        formData.movement_type,
        quantityChange,
        formData.reason.trim() || undefined
      )

      await fetchMovements()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar el inventario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'date',
      header: 'Fecha',
      render: (row: InventoryMovement) => (
        <span className="text-slate-600 text-sm">
          {format(new Date(row.created_at), 'dd/MM/yyyy HH:mm')}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Producto',
      render: (row: InventoryMovement) => (
        <span className="font-medium text-slate-900">{row.product?.name || '-'}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row: InventoryMovement) => {
        const labels: Record<string, string> = {
          initial_stock: 'Stock Inicial',
          purchase: 'Compra',
          sale: 'Venta',
          adjustment_in: 'Ajuste Entrada',
          adjustment_out: 'Ajuste Salida',
          return: 'Devolución',
          cancellation: 'Cancelación Venta',
        }
        return (
          <span className="text-slate-600">{labels[row.movement_type] || row.movement_type}</span>
        )
      },
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      render: (row: InventoryMovement) => (
        <div
          className={`flex items-center gap-1 font-bold ${row.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {row.quantity > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {Math.abs(row.quantity)}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Resultante',
      render: (row: InventoryMovement) => <span className="text-slate-700">{row.new_stock}</span>,
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row: InventoryMovement) => (
        <span
          className="text-slate-500 text-sm truncate max-w-[200px] block"
          title={row.reason || ''}
        >
          {row.reason || '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900">Movimientos de Inventario</h2>
        <Button onClick={handleOpenModal} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajuste Manual
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Cargando movimientos...</div>
      ) : movements.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="Aquí verás el historial de entradas y salidas de stock."
        />
      ) : (
        <Table columns={columns} data={movements} keyExtractor={(row) => row.id} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Ajuste de Inventario">
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Select
            label="Producto"
            value={formData.product_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
            options={[
              { value: '', label: 'Selecciona un producto...' },
              ...products.map((p) => ({
                value: p.id,
                label: `${p.name} (Stock: ${p.current_stock})`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Movimiento"
              value={formData.movement_type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, movement_type: e.target.value as MovementType }))
              }
              options={[
                { value: 'adjustment_in', label: 'Entrada / Agregar' },
                { value: 'purchase', label: 'Compra a Proveedor' },
                { value: 'initial_stock', label: 'Stock Inicial' },
                { value: 'return', label: 'Devolución de Cliente' },
                { value: 'adjustment_out', label: 'Salida / Merma' },
              ]}
              required
            />

            <Input
              label="Cantidad a ajustar"
              type="number"
              min="1"
              value={formData.quantity || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))
              }
              required
            />
          </div>

          <Input
            label="Motivo o Comentarios (opcional)"
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Ej. Mercancía dañada, nuevo lote..."
          />

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
              Guardar Ajuste
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
