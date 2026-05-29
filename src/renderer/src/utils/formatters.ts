import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Format a currency amount with locale
 */
export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string to display format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = parseISO(dateString)
  if (!isValid(date)) return '—'
  return format(date, 'dd MMM yyyy', { locale: es })
}

/**
 * Format a date string to display with time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = parseISO(dateString)
  if (!isValid(date)) return '—'
  return format(date, 'dd MMM yyyy, HH:mm', { locale: es })
}

/**
 * Format relative time (e.g., "hace 2 días")
 */
export function formatRelative(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = parseISO(dateString)
  if (!isValid(date)) return '—'
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = parseISO(dateString)
  if (!isValid(date)) return ''
  return format(date, 'yyyy-MM-dd')
}

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text to a max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
