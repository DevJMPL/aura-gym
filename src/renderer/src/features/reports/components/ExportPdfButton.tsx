// ============================================================
// ExportPdfButton Component
// ============================================================

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { pdfService } from '../services/pdf.service';
import { buildPdfHtml } from '../utils/reportFormatters';
import type { ReportPDFMeta } from '../types/reports.types';
interface ExportPdfButtonProps {
  meta: ReportPDFMeta;
  /** Should return an HTML string representing the report body content */
  buildContent: () => string;
  filename?: string;
}
export function ExportPdfButton({
  meta,
  buildContent,
  filename
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleExport() {
    try {
      setLoading(true);
      setError(null);
      const contentHtml = buildContent();
      const fullHtml = buildPdfHtml(meta, contentHtml);
      const name = filename ?? `reporte-${meta.reportType}-${meta.dateRange.from}`;
      await pdfService.exportToPdf(fullHtml, name);
    } catch (err) {
      setError((err as Error)?.message ?? 'Error al exportar');
    } finally {
      setLoading(false);
    }
  }
  return <div className="flex flex-col items-end gap-1">
      <button onClick={handleExport} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md cursor-pointer">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {loading ? "Generando..." : "Exportar PDF"}
      </button>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>;
}