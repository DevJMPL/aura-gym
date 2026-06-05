import { useEffect, useState } from 'react'
import { ImagePlus, Package, Tag, X } from 'lucide-react'
import { storageService } from '../../../lib/supabase/storageService'
import type { PosProduct, PosProductFormData } from '../../../types/database'
import { posProductService } from '../services/posProductService'
import { posCategoryService } from '../services/posCategoryService'
import { Button } from '../../../components/ui'

interface ProductModalProps {
  isOpen: boolean
  productToEdit: PosProduct | null
  onClose: () => void
  onSuccess: () => void
}

const emptyProduct: PosProductFormData = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  category: '',
  image_url: '',
  cost_price: 0,
  sale_price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  track_inventory: true,
  is_active: true,
}

export function ProductModal({ isOpen, productToEdit, onClose, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState<PosProductFormData>(emptyProduct)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (productToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        name: productToEdit.name,
        description: productToEdit.description || '',
        category: productToEdit.category || '',
        image_url: productToEdit.image_url || '',
        cost_price: productToEdit.cost_price,
        sale_price: productToEdit.sale_price,
        stock_quantity: productToEdit.stock_quantity,
        low_stock_threshold: productToEdit.low_stock_threshold,
        track_inventory: productToEdit.track_inventory,
        is_active: productToEdit.is_active,
      })

      setPreviewUrl(productToEdit.image_url)
    } else {
      setFormData(emptyProduct)

      setPreviewUrl(null)
    }

    setImageFile(null)

    setError(null)
  }, [productToEdit, isOpen])

  useEffect(() => {
    if (!isOpen) return
    posCategoryService
      .getAll()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las categorías.')))
  }, [isOpen])

  if (!isOpen) return null

  const handleFileChange = (file?: File) => {
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('El nombre del producto es obligatorio.')
      return
    }

    if (formData.sale_price < 0 || formData.cost_price < 0) {
      setError('Los precios no pueden ser negativos.')
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = formData.image_url

      if (imageFile) {
        const extension = imageFile.name.split('.').pop() || 'jpg'
        const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
        imageUrl = await storageService.uploadProductImage(imageFile, `products/${safeName}`)
      }

      const payload = { ...formData, image_url: imageUrl }

      if (productToEdit) {
        await posProductService.update(productToEdit.id, payload)
      } else {
        await posProductService.create(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al guardar el producto.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async () => {
    const cleanName = newCategory.trim()
    if (!cleanName) return

    setError(null)

    try {
      const categoryName = await posCategoryService.create(cleanName)

      setCategories((current) => Array.from(new Set([...current, categoryName])).sort())
      setFormData({ ...formData, category: categoryName })
      setNewCategory('')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo crear la categoría.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {productToEdit ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p className="text-sm text-slate-500">Catálogo e inventario del punto de venta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="product-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
            <label className="group block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <div className="aspect-square rounded-2xl border border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImagePlus className="w-9 h-9 mx-auto mb-2" />
                    <p className="text-xs font-medium">Agregar imagen</p>
                  </div>
                )}
              </div>
            </label>

            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Proteína whey"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SKU">
                  <input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Código de barras">
                  <input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Categoría">
                <div className="space-y-2">
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`${inputClass} pl-9`}
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className={inputClass}
                      placeholder="Crear categoría..."
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCreateCategory}
                      disabled={!newCategory.trim()}
                      className="cursor-pointer"
                    >
                      Crear
                    </Button>
                  </div>
                </div>
              </Field>
            </div>
          </div>

          <Field label="Descripción">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputClass} resize-none`}
              placeholder="Detalles visibles para el encargado al vender"
            />
          </Field>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Costo">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Precio venta">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Inventario">
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: Number(e.target.value) })
                }
                className={inputClass}
                disabled={!formData.track_inventory}
              />
            </Field>
            <Field label="Alerta baja">
              <input
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })
                }
                className={inputClass}
                disabled={!formData.track_inventory}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle
              checked={formData.track_inventory}
              label="Controlar inventario"
              onChange={(checked) => setFormData({ ...formData, track_inventory: checked })}
            />
            <Toggle
              checked={formData.is_active}
              label="Producto activo"
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">
            Cancelar
          </Button>
          <Button type="submit" form="product-form" isLoading={isSubmitting}>
            {productToEdit ? 'Actualizar producto' : 'Crear producto'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  )
}

const inputClass =
  'block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
