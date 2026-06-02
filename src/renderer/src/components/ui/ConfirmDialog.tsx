import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const defaultConfirmLabel = confirmLabel === 'Confirmar' ? "Confirmar" : confirmLabel
  const defaultCancelLabel = cancelLabel === 'Cancelar' ? "Cancelar" : cancelLabel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center shrink-0
              ${variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'}
            `}
          >
            <AlertTriangle
              className={`w-5 h-5 ${variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {defaultCancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {defaultConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
