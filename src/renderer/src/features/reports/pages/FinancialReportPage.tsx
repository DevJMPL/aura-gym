// ============================================================
// FinancialReportPage
// Revenue by day, plan, method; payments table
// ============================================================

import { DollarSign, Receipt, Tag, CreditCard } from 'lucide-react';
import { useDateRange } from '../hooks/useDateRange';
import { useReport } from '../hooks/useReports';
import { getFinancialReport } from '../services/reports.service';
import { ReportCard } from '../components/ReportCard';
import { ReportSummaryGrid } from '../components/ReportSummaryGrid';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ReportHeader } from '../components/ReportHeader';
import { ReportChartCard } from '../components/ReportChartCard';
import { ReportTable } from '../components/ReportTable';
import { LineChartReport } from '../components/charts/LineChartReport';
import { BarChartReport } from '../components/charts/BarChartReport';
import { DonutChartReport } from '../components/charts/DonutChartReport';
import { ExportPdfButton } from '../components/ExportPdfButton';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { formatMXN, formatMXNCompact, formatDateShort, formatPercentage } from '../utils/reportFormatters';
import { useGym } from '../../../contexts/GymContext';
import type { ReportPDFMeta, PaymentRow, TableColumn } from '../types/reports.types';
import { LoadingState } from '../../../components/ui';
export function FinancialReportPage() {
  const {
    gym
  } = useGym();
  const paymentColumns: TableColumn<PaymentRow>[] = [{
    key: 'date',
    header: "Hora".replace('Hora', 'Fecha') || 'Fecha',
    render: row => formatDateShort(row.date),
    width: '110px'
  }, {
    key: 'memberName',
    header: "Miembro"
  }, {
    key: 'memberCode',
    header: "Código",
    render: row => <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
          {row.memberCode}
        </span>,
    width: '100px'
  }, {
    key: 'concept',
    header: "Descripción (Opcional)".replace(' (Opcional)', '') || 'Concepto'
  }, {
    key: 'paymentMethod',
    header: "Método",
    render: row => {
      const labels: Record<string, string> = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transfer.',
        other: 'Otro'
      };
      return row.paymentMethod ? labels[row.paymentMethod] ?? row.paymentMethod : '—';
    },
    width: '100px'
  }, {
    key: 'amount',
    header: 'Monto',
    align: 'right',
    render: row => <span className="font-semibold text-emerald-700">{formatMXN(row.amount)}</span>,
    width: '120px'
  }];
  const csvColumns = [{
    key: 'date',
    header: "Hora".replace('Hora', 'Fecha') || 'Fecha'
  }, {
    key: 'memberName',
    header: "Miembro"
  }, {
    key: 'memberCode',
    header: "Código"
  }, {
    key: 'concept',
    header: 'Concepto'
  }, {
    key: 'paymentMethod',
    header: "Método"
  }, {
    key: 'amount',
    header: 'Monto'
  }];
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
  } = useReport(() => getFinancialReport(range), [range.from, range.to]);
  const pdfMeta: ReportPDFMeta = {
    reportType: 'financial',
    gymName: gym?.name ?? 'Mi Gimnasio',
    logoUrl: gym?.logo_url ?? null,
    generatedAt: new Date().toISOString(),
    dateRange: range,
    preset
  };
  function buildPdfContent(): string {
    if (!data) return '<p>Sin datos</p>';
    return `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Ingresos totales</div>
          <div class="value">${formatMXN(data.summary.totalRevenue)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Ticket promedio</div>
          <div class="value">${formatMXN(data.summary.avgTicket)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total pagos</div>
          <div class="value">${data.summary.totalPayments}</div>
        </div>
        <div class="stat-card">
          <div class="label">Descuentos</div>
          <div class="value">${formatMXN(data.summary.totalDiscounts)}</div>
        </div>
      </div>
      <div class="section-title">Detalle de pagos</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th><th>Miembro</th><th>Concepto</th><th>Método</th><th>Monto</th>
          </tr>
        </thead>
        <tbody>
          ${data.payments.slice(0, 30).map(p => `<tr>
                  <td>${formatDateShort(p.date)}</td>
                  <td>${p.memberName}</td>
                  <td>${p.concept}</td>
                  <td>${p.paymentMethod ?? '—'}</td>
                  <td style="text-align:right;font-weight:600;">${formatMXN(p.amount)}</td>
                </tr>`).join('')}
        </tbody>
      </table>
    `;
  }
  if (error) {
    return <div className="p-10 text-center">
        <p className="text-rose-500 font-semibold">{error}</p>
      </div>;
  }
  return <div className="space-y-6">
      <ReportHeader title={"Financiero"} subtitle="Evolución de ingresos en el periodo seleccionado" preset={preset} range={range} actions={<div className="flex items-center gap-2">
            <ExportCsvButton columns={csvColumns} data={data?.payments ?? []} filename={`financiero-${range.from}`} />
            <ExportPdfButton meta={pdfMeta} buildContent={buildPdfContent} filename={`financiero-${range.from}`} />
          </div>} />

      <DateRangeFilter preset={preset} range={range} onPresetChange={setPreset} onCustomRange={setCustomRange} />

      {/* Summary cards */}
      <ReportSummaryGrid columns={4}>
        <ReportCard title="Ingresos totales" value={data ? formatMXN(data.summary.totalRevenue) : '—'} icon={<DollarSign className="w-5 h-5" />} color="primary" loading={isLoading} />
        <ReportCard title="Ticket promedio" value={data ? formatMXN(data.summary.avgTicket) : '—'} icon={<Receipt className="w-5 h-5" />} color="success" loading={isLoading} />
        <ReportCard title="Total de pagos" value={data?.summary.totalPayments ?? '—'} icon={<CreditCard className="w-5 h-5" />} color="info" loading={isLoading} />
        <ReportCard title="Descuentos aplicados" value={data ? formatMXN(data.summary.totalDiscounts) : '—'} icon={<Tag className="w-5 h-5" />} color="warning" loading={isLoading} />
      </ReportSummaryGrid>

      {/* Charts row 1 */}
      <ReportChartCard title="Ingresos por día" subtitle="Evolución de ingresos en el periodo seleccionado">
        {isLoading ? <LoadingState message="Cargando..." /> : <LineChartReport data={data?.byDay ?? []} color="#6366f1" formatValue={formatMXNCompact} showArea label="Ingresos" />}
      </ReportChartCard>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportChartCard title="Ingresos por plan" subtitle="Recaudación total por tipo de plan">
          {isLoading ? <LoadingState message="Cargando..." /> : <BarChartReport data={(data?.byPlan ?? []).map(p => ({
          label: p.planName,
          value: p.revenue
        }))} color="#6366f1" formatValue={formatMXNCompact} />}
        </ReportChartCard>

        <ReportChartCard title="Métodos de pago" subtitle="Distribución por forma de pago">
          {isLoading ? <LoadingState message="Cargando..." /> : <DonutChartReport data={(data?.byPaymentMethod ?? []).map(m => ({
          label: m.method,
          value: m.amount
        }))} formatValue={formatMXNCompact} />}
        </ReportChartCard>
      </div>

      {/* Plan breakdown table */}
      {data && data.byPlan.length > 0 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Desglose por plan</h3>
          <div className="space-y-3">
            {data.byPlan.map(plan => <div key={plan.planId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{plan.planName}</span>
                    <span className="text-sm font-bold text-slate-900 ml-2">{formatMXN(plan.revenue)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{
                width: `${plan.percentage}%`
              }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 w-12 text-right shrink-0">
                  {formatPercentage(plan.percentage)}
                </span>
              </div>)}
          </div>
        </div>}

      {/* Payments table */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Detalle de pagos</h3>
        <ReportTable<PaymentRow> columns={paymentColumns} data={data?.payments ?? []} loading={isLoading} keyField="id" maxRows={50} emptyMessage="No hay pagos registrados en este periodo" />
      </div>
    </div>;
}