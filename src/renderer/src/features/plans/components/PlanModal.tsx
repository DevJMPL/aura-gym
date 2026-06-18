import { useState, useEffect } from 'react'
import { X, CreditCard, Tag, CalendarClock, DollarSign, FileText } from 'lucide-react'
import { planService } from '../services/planService'
import { useTenant } from '../../../contexts/TenantContext'
import type { MembershipPlan, PlanFormData, PlanType } from '../../../types/database'

interface PlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  planToEdit?: MembershipPlan | null
}

export function PlanModal({ isOpen, onClose, onSuccess, planToEdit }: PlanModalProps) {
  const { activeTenantId } = useTenant()
  const PLAN_TYPES_TRANS: { value: PlanType; label: string; defaultDays: number }[] = [
    { value: 'visit', label: 'Visita Única (1 día)', defaultDays: 1 },
    { value: 'weekly', label: 'Semanal (7 días)', defaultDays: 7 },
    { value: 'biweekly', label: 'Quincenal (15 días)', defaultDays: 15 },
    { value: 'monthly', label: 'Mensual (30 días)', defaultDays: 30 },
    { value: 'annual', label: 'Anual (365 días)', defaultDays: 365 },
    { value: 'custom', label: 'Personalizado', defaultDays: 1 },
  ]

  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    type: 'monthly',
    duration_days: 30,
    base_price: 0,
    description: '',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name,
        type: planToEdit.type,
        duration_days: planToEdit.duration_days,
        base_price: planToEdit.base_price,
        description: planToEdit.description || '',
        is_active: planToEdit.is_active,
      })
    } else {
      setFormData({
        name: '',
        type: 'monthly',
        duration_days: 30,
        base_price: 0,
        description: '',
        is_active: true,
      })
    }
    setError(null)
  }, [planToEdit, isOpen])

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as PlanType
    const typeDef = PLAN_TYPES_TRANS.find((t) => t.value === selectedType)

    setFormData({
      ...formData,
      type: selectedType,
      duration_days:
        typeDef && selectedType !== 'custom' ? typeDef.defaultDays : formData.duration_days,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!activeTenantId) {
      setError('No se pudo determinar el gimnasio activo')
      return
    }

    if (formData.base_price < 0) {
      setError('El precio base no puede ser negativo')
      return
    }

    if (formData.duration_days <= 0) {
      setError('La duración en días debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)

    try {
      if (planToEdit) {
        await planService.update(activeTenantId, planToEdit.id, formData)
      } else {
        await planService.create(activeTenantId, formData)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {planToEdit ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <p className="text-slate-500">{'Configura los detalles de la tarifa'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form id="plan-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {'Nombre del Plan'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-10 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder={'Ej. Mensualidad Básica'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {'Tipo de Plan'}
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    {PLAN_TYPES_TRANS.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {'Duración (Días)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarClock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={formData.type !== 'custom'}
                    value={formData.duration_days}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })
                    }
                    className="block w-full pl-10 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {'Precio Base'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full pl-10 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {'Descripción (Opcional)'}
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full pl-10 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                  placeholder={'Detalles sobre este plan...'}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                {'Plan Activo (Visible para nuevas membresías)'}
              </label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            {'Cancelar'}
          </button>
          <button
            type="submit"
            form="plan-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Guardando...' : planToEdit ? 'Actualizar Plan' : 'Crear Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
