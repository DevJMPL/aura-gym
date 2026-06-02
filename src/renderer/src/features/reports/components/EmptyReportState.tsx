// ============================================================
// EmptyReportState Component
// Shown when a report has no data for the selected period
// ============================================================

import { BarChart3 } from 'lucide-react';
interface EmptyReportStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}
export function EmptyReportState({
  title,
  message,
  icon
}: EmptyReportStateProps) {
  const displayTitle = title || "Sin datos para este periodo";
  const displayMessage = message || "No hay información disponible para el rango de fechas seleccionado. Intenta ampliar el periodo de consulta.";
  return <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        {icon ?? <BarChart3 className="w-9 h-9 text-slate-300" />}
      </div>
      <h3 className="text-slate-700 font-semibold text-lg mb-2">{displayTitle}</h3>
      <p className="text-slate-400 text-sm max-w-sm leading-relaxed">{displayMessage}</p>
    </div>;
}