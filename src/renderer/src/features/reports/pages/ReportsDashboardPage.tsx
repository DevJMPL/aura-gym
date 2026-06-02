// ============================================================
// ReportsDashboardPage
// General overview with all key metrics and sparklines
// ============================================================

import { DollarSign, CalendarCheck, Users, UserX, AlertTriangle, ShieldX, TrendingUp, Star } from 'lucide-react';
import { useDateRange } from '../hooks/useDateRange';
import { useReport } from '../hooks/useReports';
import { getDashboardSummary } from '../services/reports.service';
import { ReportCard } from '../components/ReportCard';
import { ReportSummaryGrid } from '../components/ReportSummaryGrid';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ReportHeader } from '../components/ReportHeader';
import { ReportChartCard } from '../components/ReportChartCard';
import { LineChartReport } from '../components/charts/LineChartReport';
import { BarChartReport } from '../components/charts/BarChartReport';
import { ExportPdfButton } from '../components/ExportPdfButton';
import { formatMXN, formatMXNCompact } from '../utils/reportFormatters';
import { useGym } from '../../../contexts/GymContext';
import type { ReportPDFMeta } from '../types/reports.types';
export function ReportsDashboardPage() {
  const {
    gym
  } = useGym();
  const {
    preset,
    range,
    setPreset,
    setCustomRange
  } = useDateRange('month');
  const {
    data,
    isLoading,
    error
  } = useReport(() => getDashboardSummary(range), [range.from, range.to]);
  const pdfMeta: ReportPDFMeta = {
    reportType: 'dashboard',
    gymName: gym?.name ?? 'Mi Gimnasio',
    logoUrl: gym?.logo_url ?? null,
    generatedAt: new Date().toISOString(),
    dateRange: range,
    preset
  };
  function buildPdfContent(): string {
    if (!data) return `<p>${"Sin datos para este periodo"}</p>`;
    return `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">${"Ingresos totales"}</div>
          <div class="value">${formatMXN(data.totalRevenue)}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Asistencias"}</div>
          <div class="value">${data.totalAttendances}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Miembros activos"}</div>
          <div class="value">${data.activeMembers}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Membresías expiradas"}</div>
          <div class="value">${data.expiredMembers}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Expiran pronto"}</div>
          <div class="value">${data.expiringSoon}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Accesos denegados"}</div>
          <div class="value">${data.deniedAccesses}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Promedio diario"}</div>
          <div class="value">${data.avgDailyAttendances} ${"Promedio diario".toLowerCase()}</div>
        </div>
        <div class="stat-card">
          <div class="label">${"Plan principal"}</div>
          <div class="value">${data.topPlan?.name ?? '—'}</div>
        </div>
      </div>
    `;
  }
  if (error) {
    return <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-rose-500 font-semibold mb-2">Error al cargar el reporte</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <ReportHeader title={"Dashboard de Reportes"} subtitle={"Visión general del rendimiento del gimnasio"} preset={preset} range={range} actions={<ExportPdfButton meta={pdfMeta} buildContent={buildPdfContent} filename={`reporte-general-${range.from}`} />} />

      {/* Filters */}
      <DateRangeFilter preset={preset} range={range} onPresetChange={setPreset} onCustomRange={setCustomRange} />

      {/* Summary Cards */}
      <ReportSummaryGrid columns={4}>
        <ReportCard title={"Ingresos totales"} value={data ? formatMXN(data.totalRevenue) : '—'} icon={<DollarSign className="w-5 h-5" />} color="primary" loading={isLoading} subtitle={"Pagos registrados"} />
        <ReportCard title={"Asistencias"} value={data?.totalAttendances ?? '—'} icon={<CalendarCheck className="w-5 h-5" />} color="success" loading={isLoading} subtitle={data ? "reports.dashboard.avgPerDay" : undefined} />
        <ReportCard title={"Miembros activos"} value={data?.activeMembers ?? '—'} icon={<Users className="w-5 h-5" />} color="info" loading={isLoading} />
        <ReportCard title={"Membresías expiradas"} value={data?.expiredMembers ?? '—'} icon={<UserX className="w-5 h-5" />} color="danger" loading={isLoading} />
        <ReportCard title={"Expiran pronto"} value={data?.expiringSoon ?? '—'} icon={<AlertTriangle className="w-5 h-5" />} color="warning" loading={isLoading} subtitle={"En los próximos 7 días"} />
        <ReportCard title={"Accesos denegados"} value={data?.deniedAccesses ?? '—'} icon={<ShieldX className="w-5 h-5" />} color="danger" loading={isLoading} />
        <ReportCard title={"Promedio diario"} value={data ? `${data.avgDailyAttendances} / día` : '—'} icon={<TrendingUp className="w-5 h-5" />} color="neutral" loading={isLoading} subtitle={"Asistencias válidas"} />
        <ReportCard title={"Plan principal"} value={data?.topPlan?.name ?? '—'} icon={<Star className="w-5 h-5" />} color="primary" loading={isLoading} subtitle={data?.topPlan ? `${data.topPlan.count} membresías` : undefined} />
      </ReportSummaryGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportChartCard title={"Ingresos por día"} subtitle={"Evolución de ingresos en el periodo seleccionado"}>
          <LineChartReport data={data?.revenueByDay ?? []} color="#6366f1" formatValue={formatMXNCompact} label={"Ingresos totales"} showArea />
        </ReportChartCard>

        <ReportChartCard title={"Asistencias por día"} subtitle={"Check-ins válidos por día"}>
          <BarChartReport data={data?.attendancesByDay ?? []} color="#10b981" highlightMax />
        </ReportChartCard>
      </div>
    </div>;
}