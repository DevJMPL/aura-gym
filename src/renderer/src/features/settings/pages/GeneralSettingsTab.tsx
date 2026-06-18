import { useState } from 'react'
import { Save, FileText, Globe, DollarSign } from 'lucide-react'
import { useGym } from '../../../contexts/GymContext'
import { useTenant } from '../../../contexts/TenantContext'
import { Card, Button } from '../../../components/ui'
import { settingsService } from '../services/settings.service'

export function GeneralSettingsTab() {
  const { gym, refreshGym } = useGym()
  const { activeTenantId } = useTenant()
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [locale] = useState(gym?.locale || 'es-MX')
  const [currencyFormat, setCurrencyFormat] = useState(gym?.currency_format || 'es-MX')
  const [currency, setCurrency] = useState(gym?.currency || 'MXN')
  const [dateFormat, setDateFormat] = useState(gym?.date_format || 'DD/MM/YYYY')

  const [reportName, setReportName] = useState(gym?.report_name || '')
  const [reportFooterText, setReportFooterText] = useState(gym?.report_footer_text || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gym || !activeTenantId) return

    setIsSaving(true)
    try {
      await settingsService.updateGymSettings(activeTenantId, gym.id, {
        locale,
        currency_format: currencyFormat,
        currency,
        date_format: dateFormat,
        report_name: reportName,
        report_footer_text: reportFooterText,
      })
      await refreshGym()
    } catch (error) {
      console.error('Error saving general settings:', error)
      alert('Hubo un error al guardar la configuración.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{'Configuración General'}</h2>
          <p className="text-slate-500">
            {'Ajustes regionales y opciones para la generación de reportes PDF.'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Regional Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
            <Globe className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-900">{'Ajustes Regionales'}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Locale removed */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">{'Formato de Fecha'}</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">{'Moneda Base'}</label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="MXN, USD, EUR..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {'Formato de Moneda (Locale)'}
              </label>
              <select
                value={currencyFormat}
                onChange={(e) => setCurrencyFormat(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="es-MX">es-MX ($1,000.00)</option>
                <option value="en-US">en-US ($1,000.00)</option>
                <option value="es-ES">es-ES (1.000,00 €)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* PDF Reports Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {'Personalización de Reportes (PDF)'}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {'Nombre en Cabecera de Reportes'}
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder={'Ej. Aura Gym Oficial'}
              />
              <p className="text-xs text-slate-500">
                {'Si se deja vacío, se utilizará el Nombre Comercial del gimnasio.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {'Texto del Pie de Página'}
              </label>
              <textarea
                rows={2}
                value={reportFooterText}
                onChange={(e) => setReportFooterText(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                placeholder={'Documento generado confidencialmente...'}
              />
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
