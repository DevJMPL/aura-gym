import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { membershipPaymentsService } from '../services/membershipPaymentsService'
import type { MembershipCharge, PaymentMethod } from '../../../types/database'

interface RegisterPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  charge: MembershipCharge | null
  onSuccess: () => void
}

export function RegisterPaymentModal({
  isOpen,
  onClose,
  charge,
  onSuccess,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !charge) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number(amount)
    if (parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (parsedAmount > charge.balance_due) {
      setError('El monto no puede ser mayor al saldo pendiente.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await membershipPaymentsService.registerPayment(
        charge.id,
        parsedAmount,
        paymentMethod,
        notes || undefined
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar Pago</h2>
              <p className="text-sm text-slate-500">
                Abono al plan {(charge.plan as any)?.name ?? 'Desconocido'}
              </p>
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

          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Monto Total</span>
              <span className="font-semibold">${Number(charge.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Total Pagado</span>
              <span className="font-semibold text-green-600">
                ${Number(charge.amount_paid).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-700">Saldo Pendiente</span>
              <span className="text-lg font-black text-red-600">
                ${Number(charge.balance_due).toFixed(2)}
              </span>
            </div>
          </div>

          <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Monto a Pagar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={charge.balance_due}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max: $${Number(charge.balance_due).toFixed(2)}`}
                  className="block w-full pl-9 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notas (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Transferencia Banamex"
                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
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
            form="payment-form"
            disabled={isSubmitting || !amount}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Procesando...' : 'Registrar Pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
