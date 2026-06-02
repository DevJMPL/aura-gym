// ============================================================
// MembershipReportPage
// Active/expired/expiring memberships, by plan, and tables
// ============================================================

import { CheckCircle, XCircle, AlertTriangle, PlusCircle, CreditCard } from 'lucide-react'
import { useDateRange } from '../hooks/useDateRange'
import { useReport } from '../hooks/useReports'
import { getMembershipReport } from '../services/reports.service'
import { ReportCard } from '../components/ReportCard'
import { ReportSummaryGrid } from '../components/ReportSummaryGrid'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { ReportHeader } from '../components/ReportHeader'
import { ReportChartCard } from '../components/ReportChartCard'
import { ReportTable } from '../components/ReportTable'
import { BarChartReport } from '../components/charts/BarChartReport'
import { DonutChartReport } from '../components/charts/DonutChartReport'
import { LineChartReport } from '../components/charts/LineChartReport'
import { ExportPdfButton } from '../components/ExportPdfButton'
import { formatDateShort } from '../utils/reportFormatters'
import { useGym } from '../../../contexts/GymContext'
import type {
  ReportPDFMeta,
  ExpiringSoonRow,
  ExpiredMembershipRow,
  TableColumn,
} from '../types/reports.types'
import { LoadingState } from '../../../components/ui'

const expiringSoonColumns: TableColumn<ExpiringSoonRow>[] = [
  { key: 'memberName', header: 'Miembro' },
  {
    key: 'memberCode',
    header: 'Código',
    render: (row) => (
      <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
        {row.memberCode}
      </span>
    ),
    width: '90px',
  },
  { key: 'planName', header: 'Plan' },
  {
    key: 'endDate',
    header: 'Vence',
    render: (row) => formatDateShort(row.endDate),
    width: '100px',
  },
  {
    key: 'daysRemaining',
    header: 'Días restantes',
    align: 'center',
    render: (row) => (
      <span
        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          row.daysRemaining <= 2
            ? 'bg-rose-100 text-rose-700'
            : row.daysRemaining <= 5
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {row.daysRemaining}d
      </span>
    ),
    width: '120px',
  },
]

const expiredColumns: TableColumn<ExpiredMembershipRow>[] = [
  { key: 'memberName', header: 'Miembro' },
  {
    key: 'memberCode',
    header: 'Código',
    render: (row) => (
      <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
        {row.memberCode}
      </span>
    ),
    width: '90px',
  },
  { key: 'planName', header: 'Plan' },
  {
    key: 'endDate',
    header: 'Venció',
    render: (row) => formatDateShort(row.endDate),
    width: '100px',
  },
  {
    key: 'daysSinceExpiry',
    header: 'Días vencida',
    align: 'center',
    render: (row) => (
      <span className="text-xs font-medium text-rose-600">{row.daysSinceExpiry}d</span>
    ),
    width: '110px',
  },
]

export function MembershipReportPage() {
  const { gym } = useGym()
  const { preset, range, setPreset, setCustomRange } = useDateRange('month')

  const { data, isLoading, error } = useReport(
    () => getMembershipReport(range),
    [range.from, range.to]
  )

  const pdfMeta: ReportPDFMeta = {
    reportType: 'memberships',
    gymName: gym?.name ?? 'Mi Gimnasio',
    logoUrl: gym?.logo_url ?? null,
    generatedAt: new Date().toISOString(),
    dateRange: range,
    preset,
  }

  function buildPdfContent(): string {
    if (!data) return '<p>Sin datos</p>'
    return `
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Membresías activas</div><div class="value">${data.summary.active}</div></div>
        <div class="stat-card"><div class="label">Membresías vencidas</div><div class="value">${data.summary.expired}</div></div>
        <div class="stat-card"><div class="label">Próximas a vencer</div><div class="value">${data.summary.expiringSoon}</div></div>
        <div class="stat-card"><div class="label">Nuevas este periodo</div><div class="value">${data.summary.newThisPeriod}</div></div>
      </div>
      <div class="section-title">Próximas a vencer</div>
      <table>
        <thead><tr><th>Miembro</th><th>Plan</th><th>Vence</th><th>Días restantes</th></tr></thead>
        <tbody>
          ${data.expiringSoon
            .map(
              (m) =>
                `<tr><td>${m.memberName}</td><td>${m.planName}</td><td>${formatDateShort(m.endDate)}</td><td>${m.daysRemaining}d</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    `
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-rose-500 font-semibold">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Membresías"
        subtitle="Estado, distribución y vencimientos de membresías"
        preset={preset}
        range={range}
        actions={
          <ExportPdfButton
            meta={pdfMeta}
            buildContent={buildPdfContent}
            filename={`membresias-${range.from}`}
          />
        }
      />

      <DateRangeFilter preset={preset} range={range} onPresetChange={setPreset} onCustomRange={setCustomRange} />

      {/* Summary cards */}
      <ReportSummaryGrid columns={4}>
        <ReportCard
          title="Membresías activas"
          value={data?.summary.active ?? '—'}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          loading={isLoading}
        />
        <ReportCard
          title="Membresías vencidas"
          value={data?.summary.expired ?? '—'}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
          loading={isLoading}
        />
        <ReportCard
          title="Próximas a vencer"
          value={data?.summary.expiringSoon ?? '—'}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
          loading={isLoading}
          subtitle="En los próximos 7 días"
        />
        <ReportCard
          title="Nuevas en el periodo"
          value={data?.summary.newThisPeriod ?? '—'}
          icon={<PlusCircle className="w-5 h-5" />}
          color="primary"
          loading={isLoading}
        />
        <ReportCard
          title="Canceladas"
          value={data?.summary.cancelled ?? '—'}
          icon={<CreditCard className="w-5 h-5" />}
          color="neutral"
          loading={isLoading}
        />
      </ReportSummaryGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportChartCard title="Estado de membresías" subtitle="Distribución actual">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <DonutChartReport data={data?.byStatus ?? []} />
          )}
        </ReportChartCard>

        <ReportChartCard title="Distribución por plan" subtitle="Membresías totales por tipo de plan">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <BarChartReport
              data={(data?.byPlan ?? []).map((p) => ({ label: p.planName, value: p.count }))}
              color="#6366f1"
            />
          )}
        </ReportChartCard>
      </div>

      {/* New memberships trend */}
      <ReportChartCard title="Altas por período" subtitle="Nuevas membresías en el periodo seleccionado">
        {isLoading ? (
          <LoadingState message="Cargando..." />
        ) : (
          <LineChartReport data={data?.newByPeriod ?? []} color="#6366f1" showArea label="Nuevas membresías" />
        )}
      </ReportChartCard>

      {/* Expiring soon table */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Próximas a vencer (7 días)
        </h3>
        <ReportTable<ExpiringSoonRow>
          columns={expiringSoonColumns}
          data={data?.expiringSoon ?? []}
          loading={isLoading}
          keyField="membershipId"
          emptyMessage="No hay membresías próximas a vencer"
        />
      </div>

      {/* Recently expired table */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-500" />
          Vencidas recientemente
        </h3>
        <ReportTable<ExpiredMembershipRow>
          columns={expiredColumns}
          data={data?.recentlyExpired ?? []}
          loading={isLoading}
          keyField="membershipId"
          maxRows={20}
          emptyMessage="No hay membresías vencidas en este periodo"
        />
      </div>
    </div>
  )
}
