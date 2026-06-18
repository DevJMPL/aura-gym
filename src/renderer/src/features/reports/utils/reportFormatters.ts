// ============================================================
// Report Formatters
// Localized formatting for MXN currency, ES dates, etc.
// ============================================================

import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange, DateRangePreset, ReportPDFMeta } from '../types/reports.types'

// ── Currency ─────────────────────────────────────────────────

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
export function formatMXNCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return formatMXN(amount)
}

// ── Dates ─────────────────────────────────────────────────────

export function formatDateES(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, "d 'de' MMMM 'de' yyyy", {
      locale: es,
    })
  } catch {
    return dateStr
  }
}
export function formatDateShort(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'dd/MM/yyyy')
  } catch {
    return dateStr
  }
}
export function formatDateMonthYear(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'MMMM yyyy', {
      locale: es,
    })
  } catch {
    return dateStr
  }
}
export function formatDatetimeES(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'd MMM yyyy, HH:mm', {
      locale: es,
    })
  } catch {
    return dateStr
  }
}

// ── Numbers ───────────────────────────────────────────────────

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

// ── Labels ────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
}
export const CHECK_IN_METHOD_LABELS: Record<string, string> = {
  kiosk: 'Kiosco',
  manual: 'Manual',
  member_code: 'Código',
}
export const DENIAL_REASON_LABELS: Record<string, string> = {
  expired_membership: 'Membresía vencida',
  inactive_member: 'Miembro inactivo',
  suspended_member: 'Miembro suspendido',
  not_found: 'ID no encontrado',
}
export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expired: 'Vencido',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
}
export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}
export const PLAN_TYPE_LABELS: Record<string, string> = {
  inscription: 'Inscripción',
  visit: 'Visita',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  annual: 'Anual',
  custom: 'Personalizado',
}
export const DATE_PRESET_LABELS: Record<string, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  prev_month: 'Mes anterior',
  custom: 'Personalizado',
}

// ── Date Range Label ──────────────────────────────────────────

export function formatDateRangeLabel(range: DateRange, preset: DateRangePreset): string {
  if (preset === 'today') return 'Hoy'
  if (preset === 'week') return 'Esta semana'
  if (preset === 'month') return 'Este mes'
  if (preset === 'prev_month') return 'Mes anterior'
  return `${formatDateShort(range.from)} – ${formatDateShort(range.to)}`
}

// ── PDF HTML Template ─────────────────────────────────────────

export function buildPdfHtml(meta: ReportPDFMeta, contentHtml: string): string {
  const { gymName, logoUrl, generatedAt, dateRange, preset } = meta
  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="height:60px;object-fit:contain;margin-bottom:8px;" />`
    : `<div style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#818cf8);display:flex;align-items:center;justify-content:center;color:white;font-size:28px;font-weight:bold;margin-bottom:8px;">A</div>`
  const reportTitleMap: Record<string, string> = {
    dashboard: 'Reporte General',
    financial: 'Reporte Financiero',
    attendance: 'Reporte de Asistencias',
    memberships: 'Reporte de Membresías',
    members: 'Reporte de Miembros',
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 40px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .header-info h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
    .header-info h2 { font-size: 16px; font-weight: 600; color: #6366f1; margin-top: 2px; }
    .header-meta { margin-top: 8px; color: #64748b; font-size: 12px; }
    .header-right { margin-left: auto; text-align: right; color: #64748b; font-size: 12px; }
    .content { margin-top: 24px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .stat-card .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 24px 0 12px; border-left: 3px solid #6366f1; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoSection}</div>
    <div class="header-info">
      <h1>${gymName}</h1>
      <h2>${reportTitleMap[meta.reportType] || 'Reporte' || 'Reporte'}</h2>
      <div class="header-meta">
        ${'Periodo:'} ${formatDateRangeLabel(dateRange, preset)}<br/>
        ${formatDateShort(dateRange.from)} — ${formatDateShort(dateRange.to)}
      </div>
    </div>
    <div class="header-right">
      ${'Generado el'}<br/>
      <strong>${formatDatetimeES(generatedAt)}</strong>
    </div>
  </div>
  <div class="content">
    ${contentHtml}
  </div>
  <div class="footer">
    <span>${'Generado por Aura Gym Management'}</span>
    <span>${gymName} — ${formatDateShort(generatedAt)}</span>
  </div>
</body>
</html>`
}
