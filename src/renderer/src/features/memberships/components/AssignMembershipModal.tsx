import { useState, useEffect } from 'react'
import { X, CreditCard, Calendar, Tag } from 'lucide-react'
import { planService } from '../../plans/services/planService'
import { membershipService } from '../services/membershipService'
import { membershipPaymentsService } from '../../members/services/membershipPaymentsService'
import { useTenant } from '../../../contexts/TenantContext'
import type { MembershipPlan } from '../../../types/database'
import { format } from 'date-fns'

interface AssignMembershipModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  onSuccess: () => void
}

export function AssignMembershipModal({
  isOpen,
  onClose,
  memberId,
  onSuccess,
}: AssignMembershipModalProps) {
  const { activeTenantId } = useTenant()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [notes, setNotes] = useState('')
  const [amountPaidStr, setAmountPaidStr] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && activeTenantId) {
      planService
        .getActive(activeTenantId)
        .then(setPlans)
        .catch((err) => {
          setError('Error al cargar los planes: ' + err.message)
        })
    }
  }, [isOpen, activeTenantId])

  if (!isOpen) return null

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  // Calculate final price
  let finalPrice = selectedPlan?.base_price || 0
  if (discountType === 'percentage') {
    finalPrice = finalPrice - (finalPrice * discountValue) / 100
  } else if (discountType === 'fixed') {
    finalPrice = finalPrice - discountValue
  }
  finalPrice = Math.max(0, finalPrice)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !activeTenantId) return

    const parsedAmountPaid = amountPaidStr === '' ? finalPrice : Number(amountPaidStr)
    if (parsedAmountPaid > finalPrice) {
      setError('El monto pagado no puede ser mayor al total.')
      return
    }

    if (parsedAmountPaid < finalPrice && !dueDate) {
      setError('Debe especificar una fecha de compromiso para el adeudo restante.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const membership = await membershipService.create(
        activeTenantId,
        {
          member_id: memberId,
          plan_id: selectedPlan.id,
          start_date: startDate,
          payment_method: paymentMethod,
          notes: notes || undefined,
        },
        selectedPlan.duration_days,
        finalPrice,
        selectedPlan.base_price,
        discountType,
        discountValue
      )

      // Create the charge and initial payment
      const discountTotal = selectedPlan.base_price - finalPrice
      await membershipPaymentsService.createCharge({
        tenant_id: activeTenantId,
        member_id: memberId,
        plan_id: selectedPlan.id,
        membership_id: membership.id,
        subtotal: selectedPlan.base_price,
        discount_total: discountTotal > 0 ? discountTotal : 0,
        total: finalPrice,
        amount_paid: parsedAmountPaid,
        payment_method: parsedAmountPaid > 0 ? paymentMethod : undefined,
        due_date:
          parsedAmountPaid < finalPrice ? new Date(dueDate + 'T23:59:59').toISOString() : undefined,
        notes: notes || undefined,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al asignar el plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Asignar Membresía</h2>
              <p className="text-sm text-slate-500">Selecciona un plan y calcula el pago</p>
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

          <form id="membership-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Seleccionar Plan</label>
              <div className="grid grid-cols-1 gap-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-primary-500 bg-primary-50/50'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{plan.name}</div>
                        <div className="text-sm text-slate-500 capitalize">
                          {plan.type} ({plan.duration_days} días)
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary-600">${plan.base_price}</div>
                  </label>
                ))}
              </div>
            </div>

            {selectedPlan && (
              <>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Fecha de Inicio
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full pl-9 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descuento
                    </label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('none')
                          setDiscountValue(0)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${discountType === 'none' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        Ninguno
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percentage')
                          setDiscountValue(10)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${discountType === 'percentage' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        Porcentaje (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('fixed')
                          setDiscountValue(100)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${discountType === 'fixed' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        Monto Fijo ($)
                      </button>
                    </div>
                    {discountType !== 'none' && (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Tag className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'percentage' ? 100 : selectedPlan.base_price}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="block w-full pl-9 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-slate-500">Total a Pagar</div>
                    <div className="text-2xl font-black text-slate-900">
                      ${finalPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Monto Pagado (Opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={`$${finalPrice.toFixed(2)}`}
                        value={amountPaidStr}
                        onChange={(e) => setAmountPaidStr(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Si deja vacío, se asume pago completo.
                      </p>
                    </div>
                    {amountPaidStr !== '' && Number(amountPaidStr) < finalPrice && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Fecha Compromiso
                        </label>
                        <input
                          type="date"
                          required
                          min={format(new Date(), 'yyyy-MM-dd')}
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Promo estudiante"
                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="membership-form"
            disabled={!selectedPlan || isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Procesando...' : 'Asignar Membresía'}
          </button>
        </div>
      </div>
    </div>
  )
}
