// ============================================================
// AttendanceReportPage
// Attendance by day, check-in methods, top members, trends
// ============================================================

import { CalendarCheck, Users, Clock, TrendingDown } from 'lucide-react'
import { useDateRange } from '../hooks/useDateRange'
import { useReport } from '../hooks/useReports'
import { getAttendanceReport } from '../services/reports.service'
import { ReportCard } from '../components/ReportCard'
import { ReportSummaryGrid } from '../components/ReportSummaryGrid'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { ReportHeader } from '../components/ReportHeader'
import { ReportChartCard } from '../components/ReportChartCard'
import { ReportTable } from '../components/ReportTable'
import { LineChartReport } from '../components/charts/LineChartReport'
import { BarChartReport } from '../components/charts/BarChartReport'
import { DonutChartReport } from '../components/charts/DonutChartReport'
import { ExportPdfButton } from '../components/ExportPdfButton'
import { ExportCsvButton } from '../components/ExportCsvButton'
import { useGym } from '../../../contexts/GymContext'
import { useTenant } from '../../../contexts/TenantContext'
import type { ReportPDFMeta, TopAttendanceMember, TableColumn } from '../types/reports.types'
import { LoadingState } from '../../../components/ui'

const topMemberColumns: TableColumn<TopAttendanceMember>[] = [
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
  { key: 'memberName', header: 'Miembro' },
  {
    key: 'count',
    header: 'Asistencias',
    align: 'right',
    render: (row) => <span className="font-bold text-emerald-700">{row.count}</span>,
    width: '110px',
  },
]

const csvTopColumns = [
  { key: 'memberCode', header: 'Código' },
  { key: 'memberName', header: 'Miembro' },
  { key: 'count', header: 'Asistencias' },
]

export function AttendanceReportPage() {
  const { gym } = useGym()
  const { activeTenantId } = useTenant()
  const { preset, range, setPreset, setCustomRange } = useDateRange('month')

  const { data, isLoading, error } = useReport(
    () =>
      activeTenantId
        ? getAttendanceReport(activeTenantId, range)
        : Promise.reject(new Error('No tenant')),
    [range.from, range.to, activeTenantId]
  )

  const pdfMeta: ReportPDFMeta = {
    reportType: 'attendance',
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
        <div class="stat-card">
          <div class="label">Total asistencias</div>
          <div class="value">${data.summary.validCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">Promedio diario</div>
          <div class="value">${data.summary.avgPerDay}</div>
        </div>
        <div class="stat-card">
          <div class="label">Accesos denegados</div>
          <div class="value">${data.summary.deniedCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">Hora pico</div>
          <div class="value">${data.summary.peakHour ?? '—'}</div>
        </div>
      </div>
      <div class="section-title">Top miembros con más asistencias</div>
      <table>
        <thead><tr><th>Código</th><th>Miembro</th><th>Asistencias</th></tr></thead>
        <tbody>
          ${data.topMembers
            .slice(0, 15)
            .map(
              (m) => `<tr><td>${m.memberCode}</td><td>${m.memberName}</td><td>${m.count}</td></tr>`
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
        title="Asistencias"
        subtitle="Check-ins, tendencias y miembros más constantes"
        preset={preset}
        range={range}
        actions={
          <div className="flex items-center gap-2">
            <ExportCsvButton
              columns={csvTopColumns}
              data={data?.topMembers ?? []}
              filename={`asistencias-top-${range.from}`}
            />
            <ExportPdfButton
              meta={pdfMeta}
              buildContent={buildPdfContent}
              filename={`asistencias-${range.from}`}
            />
          </div>
        }
      />

      <DateRangeFilter
        preset={preset}
        range={range}
        onPresetChange={setPreset}
        onCustomRange={setCustomRange}
      />

      {/* Summary cards */}
      <ReportSummaryGrid columns={4}>
        <ReportCard
          title="Asistencias válidas"
          value={data?.summary.validCount ?? '—'}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="success"
          loading={isLoading}
        />
        <ReportCard
          title="Promedio diario"
          value={data ? `${data.summary.avgPerDay} / día` : '—'}
          icon={<TrendingDown className="w-5 h-5" />}
          color="primary"
          loading={isLoading}
        />
        <ReportCard
          title="Accesos denegados"
          value={data?.summary.deniedCount ?? '—'}
          icon={<Users className="w-5 h-5" />}
          color="danger"
          loading={isLoading}
          subtitle={`${data?.summary.duplicateCount ?? 0} duplicados`}
        />
        <ReportCard
          title="Hora pico"
          value={data?.summary.peakHour ?? '—'}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          loading={isLoading}
          subtitle="Mayor afluencia"
        />
      </ReportSummaryGrid>

      {/* Charts */}
      <ReportChartCard title="Asistencias por día" subtitle="Check-ins válidos por fecha">
        {isLoading ? (
          <LoadingState message="Cargando..." />
        ) : (
          <BarChartReport data={data?.byDay ?? []} color="#10b981" highlightMax />
        )}
      </ReportChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportChartCard title="Tendencia de asistencias" subtitle="Evolución en el tiempo">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <LineChartReport
              data={data?.byDay ?? []}
              color="#10b981"
              showArea
              label="Asistencias"
            />
          )}
        </ReportChartCard>

        <ReportChartCard title="Métodos de check-in" subtitle="Distribución por canal">
          {isLoading ? (
            <LoadingState message="Cargando..." />
          ) : (
            <DonutChartReport
              data={(data?.checkInMethods ?? []).map((m) => ({
                label: m.method,
                value: m.count,
              }))}
            />
          )}
        </ReportChartCard>
      </div>

      {/* Hourly chart */}
      <ReportChartCard
        title="Asistencias por hora"
        subtitle="Horarios con mayor afluencia"
        minHeight={200}
      >
        {isLoading ? (
          <LoadingState message="Cargando..." />
        ) : (
          <BarChartReport data={data?.byHour ?? []} color="#6366f1" height={200} highlightMax />
        )}
      </ReportChartCard>

      {/* Top members table */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Miembros con más asistencias</h3>
        <ReportTable<TopAttendanceMember>
          columns={topMemberColumns}
          data={data?.topMembers ?? []}
          loading={isLoading}
          keyField="memberId"
          maxRows={20}
          emptyMessage="No hay asistencias registradas en este periodo"
        />
      </div>
    </div>
  )
}
