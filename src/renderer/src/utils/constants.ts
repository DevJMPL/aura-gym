// App-wide constants

export const APP_NAME = 'Aura'
export const APP_VERSION = '1.0.0'

// Member code prefix
export const MEMBER_CODE_PREFIX = 'AUR'

// Default gym settings
export const DEFAULT_CURRENCY = 'MXN'
export const DEFAULT_TIMEZONE = 'America/Mexico_City'
export const DEFAULT_BUSINESS_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Plan types for display
export const PLAN_TYPE_LABELS: Record<string, string> = {
  inscription: 'Inscripción',
  visit: 'Visita',
  weekly: 'Semanal',
  monthly: 'Mensual',
  annual: 'Anual',
  custom: 'Personalizado',
}

// Member status labels
export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expired: 'Vencido',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
}

// Membership status labels
export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
}

// Day of week labels (0=Sunday)
export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DAY_LABELS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

// Status colors
export const STATUS_COLORS = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  expired: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  suspended: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
} as const

// Expiring soon threshold (days)
export const EXPIRING_SOON_DAYS = 7
