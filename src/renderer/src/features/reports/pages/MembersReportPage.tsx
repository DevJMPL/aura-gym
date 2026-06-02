// ============================================================
// MembersReportPage
// Member status distribution, new members, at-risk table
// ============================================================

import { Users, UserCheck, UserX, AlertTriangle, UserPlus } from 'lucide-react'
import { useDateRange } from '../hooks/useDateRange'
import { useReport } from '../hooks/useReports'
import { getMembersReport } from '../services/reports.service'
import { ReportCard } from '../components/ReportCard'
import { ReportSummaryGrid } from '../components/ReportSummaryGrid'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { ReportHeader } from '../components/ReportHeader'
import { ReportChartCard } from '../components/ReportChartCard'
import { ReportTable } from '../components/ReportTable'
import { DonutChartReport } from '../components/charts/DonutChartReport'
import { LineChartReport } from '../components/charts/LineChartReport'
import { ExportPdfButton } from '../components/ExportPdfButton'
import { formatDateShort, MEMBER_STATUS_LABELS } from '../utils/reportFormatters'
import { useGym } from '../../../contexts/GymContext'
import type {
  ReportPDFMeta,
  AtRiskMemberRow,
  NewMemberRow,
  TableColumn,
} from '../types/reports.types'
import { LoadingState } from '../../../components/ui'

const atRiskColumns: TableColumn<AtRiskMemberRow>[] = [
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
  { key: 'planName', header: 'Plan activo', render: (row) => row.planName ?? '—' },
  {
    key: 'membershipEndDate',
    header: 'Vence',
    render: (row) => (row.membershipEndDate ? formatDateShort(row.membershipEndDate) : '—'),
    width: '100px',
  },
  {
    key: 'daysSinceLastAttendance',
    header: 'Sin asistencia',
    align: 'center',
    render: (row) => (
      <span
        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          row.daysSinceLastAttendance === -1
            ? 'bg-slate-100 text-slate-500'
            : row.daysSinceLastAttendance >= 30
              ? 'bg-rose-100 text-rose-700'
              : 'bg-amber-100 text-amber-700'
        }`}
      >
        {row.daysSinceLastAttendance === -1 ? 'Nunca' : `${row.daysSinceLastAttendance}d`}
      </span>
    ),
    width: '120px',
  },
  {
    key: 'totalAttendances',
    header: 'Total asist.',
    align: 'right',
    render: (row) => <span className="text-slate-500">{row.totalAttendances}</span>,
    width: '100px',
  },
]

const newMemberColumns: TableColumn<NewMemberRow>[] = [
  {
    key: 'createdAt',
    header: 'Registro',
    render: (row) => formatDateShort(row.createdAt),
    width: '100px',
  },
  { key: 'memberName', header: 'Nombre' },
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
  {
    key: 'status',
    header: 'Estado',
    render: (row) => {
      const labels: Record<string, string> = MEMBER_STATUS_LABELS
      const colorMap: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        expired: 'bg-rose-100 text-rose-700',
        suspended: 'bg-amber-100 text-amber-700',
        inactive: 'bg-slate-100 text-slate-500',
      }
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[row.status] ?? 'bg-slate-100 text-slate-500'}`}>
          {labels[row.status] ?? row.status}
        </span>
      )
    },
    width: '100px',
  },
  { key: 'planName', header: 'Plan', render: (row) => row.planName ?? '—' },
]

export function MembersReportPage() {
  const { gym } = useGym()
  const { preset, range, setPreset, setCustomRange } = useDateRange('month')

  const { data, isLoading, error } = useReport(
    () => getMembersReport(range),
    [range.from, range.to]
  )

  const pdfMeta: ReportPDFMeta = {
    reportType: 'members',
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
        <div class="stat-card"><div class="label">Activos</div><div class="value">${data.summary.active}</div></div>
        <div class="stat-card"><div class="label">Vencidos</div><div class="value">${data.summary.expired}</div></div>
        <div class="stat-card"><div class="label">Suspendidos</div><div class="value">${data.summary.suspended}</div></div>
        <div class="stat-card"><div class="label">Nuevos en periodo</div><div class="value">${data.summary.newThisPeriod}</div></div>
      </div>
      <div class="section-title">Miembros en riesgo de abandono</div>
      <table>
        <thead><tr><th>Miembro</th><th>Plan</th><th>Sin asistencia</th><th>Total asist.</th></tr></thead>
        <tbody>
          ${data.atRiskMembers
            .slice(0, 20)
            .map(
              (m) =>
                `<tr>
                  <td>${m.memberName}</td>
                  <td>${m.planName ?? '—'}</td>
                  <td>${m.daysSinceLastAttendance === -1 ? 'Nunca' : m.daysSinceLastAttendance + 'd'}</td>
                  <td>${m.totalAttendances}</td>
                </tr>`
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
        title="Miembros"
        subtitle="Estado, nuevos registros y miembros en riesgo de abandono"
        preset={preset}
        range={range}
        actions={
          <ExportPdfButton
            meta={pdfMeta}
            buildContent={buildPdfContent}
            filename={`miembros-${range.from}`}
          />
        }
      />

      <DateRangeFilter preset={preset} range={range} onPresetChange={setPreset} onCustomRange={setCustomRange} />

      {/* Summary cards */}
      <ReportSummaryGrid columns={4}>
        <ReportCard
          title="Miembros activos"
          value={data?.summary.active ?? '—'}
          icon={<UserCheck className="w-5 h-5" />}
          color="success"
          loading={isLoading}
        />
        <ReportCard
          title="Miembros vencidos"
          value={data?.summary.expired ?? '—'}
          icon={<UserX className="w-5 h-5" />}
          color="danger"
          loading={isLoading}
        />
        <ReportCard
          title="Suspendidos"
          value={data?.summary.suspended ?? '—'}
          icon={<Users className="w-5 h-5" />}
          color="warning"
          loading={isLoading}
        />
        <ReportCard
          title="Nuevos en el periodo"
          value={data?.summary.newThisPeriod ?? '—'}
          icon={<UserPlus className="w-5 h-5" />}
          color="primary"
          loading={isLoading}
        />
        <ReportCard
          title="En riesgo de abandono"
          value={data?.summary.atRisk ?? '—'}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
          loading={isLoading}
          subtitle="Sin asistencia en 14+ días"
        />
      </ReportSummaryGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportChartCard title="Estado de miembros" subtitle="Distribución por estado actual">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <DonutChartReport data={data?.byStatus ?? []} />
          )}
        </ReportChartCard>

        <ReportChartCard title="Nuevos miembros por período" subtitle="Altas en el periodo seleccionado">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <LineChartReport data={data?.newByPeriod ?? []} color="#6366f1" showArea label="Nuevos miembros" />
          )}
        </ReportChartCard>
      </div>

      {/* At-risk members */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Miembros en riesgo de abandono
          <span className="text-xs text-slate-400 font-normal">(membresía activa, sin asistencia en 14+ días)</span>
        </h3>
        <ReportTable<AtRiskMemberRow>
          columns={atRiskColumns}
          data={data?.atRiskMembers ?? []}
          loading={isLoading}
          keyField="memberId"
          emptyMessage="¡Excelente! No hay miembros en riesgo de abandono"
        />
      </div>

      {/* New members */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-500" />
          Nuevos miembros en el periodo
        </h3>
        <ReportTable<NewMemberRow>
          columns={newMemberColumns}
          data={data?.newMembers ?? []}
          loading={isLoading}
          keyField="memberId"
          maxRows={20}
          emptyMessage="No hay nuevos miembros en este periodo"
        />
      </div>
    </div>
  )
}
