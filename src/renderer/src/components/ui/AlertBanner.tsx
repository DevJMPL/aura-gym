import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useState } from 'react'

interface AlertBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  dismissible?: boolean
}

const styles = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    title: 'text-blue-800',
    message: 'text-blue-700',
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    title: 'text-emerald-800',
    message: 'text-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    title: 'text-amber-800',
    message: 'text-amber-700',
  },
  error: {
    bg: 'bg-rose-50 border-rose-200',
    icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    title: 'text-rose-800',
    message: 'text-rose-700',
  },
}

export function AlertBanner({ type, title, message, dismissible = false }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const s = styles[type]

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 animate-slide-up ${s.bg}`}>
      <div className="shrink-0 mt-0.5">{s.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${s.title}`}>{title}</p>}
        <p className={`text-sm ${s.message}`}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      )}
    </div>
  )
}
