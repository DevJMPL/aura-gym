import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal, Input, Select, Button } from '../../../components/ui'
import { posService } from '../services/posService'
import type { Sale } from '../../../types/database'
import { formatCurrency } from '../../../utils/formatters'

interface RegisterSalePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  onSuccess: () => void
}

export function RegisterSalePaymentModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: RegisterSalePaymentModalProps) {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && sale) {
      setPaymentData({
        amount: sale.balance_due,
        method: 'cash',
        notes: '',
      })
      setError(null)
    }
  }, [isOpen, sale])

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sale) return

    if (paymentData.amount <= 0 || paymentData.amount > sale.balance_due) {
      setError('Monto inválido. Debe ser mayor a 0 y no exceder el saldo pendiente.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await posService.registerPayment(
        sale.id,
        paymentData.amount,
        paymentData.method,
        paymentData.notes
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Abonar a Venta #${sale?.sale_number}`}
    >
      <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center">
          <span className="font-medium text-amber-800">Saldo Pendiente</span>
          <span className="text-2xl font-black text-amber-700">
            {formatCurrency(sale?.balance_due || 0)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto a Abonar"
            type="number"
            min="0.01"
            max={sale?.balance_due || 0}
            step="0.01"
            value={paymentData.amount || ''}
            onChange={(e) =>
              setPaymentData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
            }
            required
          />
          <Select
            label="Método de Pago"
            value={paymentData.method}
            onChange={(e) => setPaymentData((prev) => ({ ...prev, method: e.target.value }))}
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
              { value: 'other', label: 'Otro' },
            ]}
            required
          />
        </div>

        <Input
          label="Notas del abono (opcional)"
          value={paymentData.notes}
          onChange={(e) => setPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Ej. Liquidación por transferencia..."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Registrar Abono
          </Button>
        </div>
      </form>
    </Modal>
  )
}
