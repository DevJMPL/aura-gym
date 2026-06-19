import { useState } from 'react'
import { Plus, Edit2, AlertCircle } from 'lucide-react'
import { Button, Table, Badge, Modal, Input, EmptyState } from '../../../components/ui'
import { useCategories } from '../hooks/useCategories'
import { productService } from '../services/productService'
import { useTenant } from '../../../contexts/TenantContext'
import type { ProductCategory } from '../../../types/database'

export function CategoriesTab() {
  const { activeTenantId } = useTenant()
  const { categories, isLoading, fetchCategories } = useCategories()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active,
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', is_active: true })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTenantId) return

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editingCategory) {
        await productService.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        })
      } else {
        await productService.createCategory(activeTenantId, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        })
      }

      await fetchCategories()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (category: ProductCategory) => {
    try {
      await productService.updateCategory(category.id, { is_active: !category.is_active })
      fetchCategories()
    } catch (err) {
      console.error('Error toggling status', err)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (row: ProductCategory) => (
        <span className="font-medium text-slate-900">{row.name}</span>
      ),
    },
    {
      key: 'desc',
      header: 'Descripción',
      render: (row: ProductCategory) => (
        <span className="text-slate-500">{row.description || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: ProductCategory) => (
        <button onClick={() => toggleStatus(row)} className="hover:opacity-80 transition-opacity">
          <Badge variant={row.is_active ? 'success' : 'default'}>
            {row.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row: ProductCategory) => (
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
        <h2 className="text-lg font-bold text-slate-900">Categorías de Productos</h2>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Agrega categorías para organizar tus productos."
          action={<Button onClick={() => handleOpenModal()}>Nueva Categoría</Button>}
        />
      ) : (
        <Table columns={columns} data={categories} keyExtractor={(row) => row.id} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Input
            label="Nombre de la categoría"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ej. Bebidas"
            required
            autoFocus
          />

          <Input
            label="Descripción (opcional)"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Agua, energizantes, etc."
          />

          {editingCategory && (
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm text-slate-700">Categoría Activa</span>
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
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
