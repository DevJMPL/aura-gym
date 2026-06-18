import { useState, useRef } from 'react'
import { Dumbbell, Save, Upload, MapPin, Phone, Mail, Globe, Hash, Briefcase } from 'lucide-react'
import { useGym } from '../../../contexts/GymContext'
import { useTenant } from '../../../contexts/TenantContext'
import { Card, Button } from '../../../components/ui'
import { settingsService } from '../services/settings.service'

export function GymInfoTab() {
  const { gym, refreshGym } = useGym()
  const { activeTenantId } = useTenant()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState(gym?.name || '')
  const [legalName, setLegalName] = useState(gym?.legal_name || '')
  const [address, setAddress] = useState(gym?.address || '')
  const [phone, setPhone] = useState(gym?.phone || '')
  const [email, setEmail] = useState(gym?.email || '')
  const [website, setWebsite] = useState(gym?.website || '')
  const [timezone, setTimezone] = useState(gym?.timezone || 'America/Mexico_City')

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !gym || !activeTenantId) return

    setIsUploading(true)
    try {
      const url = await settingsService.uploadImage(file, 'gym-assets', `logo-${gym.id}`)
      await settingsService.updateGymSettings(activeTenantId, gym.id, { logo_url: url })
      await refreshGym()
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Hubo un error al subir el logotipo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gym || !activeTenantId) return

    setIsSaving(true)
    try {
      await settingsService.updateGymSettings(activeTenantId, gym.id, {
        name,
        legal_name: legalName,
        address,
        phone,
        email,
        website,
        timezone,
      })
      await refreshGym()
    } catch (error) {
      console.error('Error saving gym info:', error)
      alert('Hubo un error al guardar la información.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{'Información del Gimnasio'}</h2>
          <p className="text-slate-500">
            {'Configura los datos públicos y de contacto de tu negocio.'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="md:col-span-1">
          <Card className="p-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {'Logotipo'}
            </h3>

            <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-primary-400">
              {gym?.logo_url ? (
                <>
                  <img src={gym.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button
                      variant="ghost"
                      className="text-white border-white hover:bg-white/20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {'Reemplazar'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center p-4">
                  <Dumbbell className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">{'Sin logotipo'}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-primary-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {'Subir'}
                  </Button>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {'Recomendado: PNG o JPG cuadrado (ej. 512x512px). Máx 2MB.'}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleLogoChange}
            />
          </Card>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {'Nombre Comercial'}
                  </label>
                  <div className="relative">
                    <Dumbbell className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="Ej. Aura Gym"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {'Razón Social (Opcional)'}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="Ej. Operadora de Gimnasios S.A. de C.V."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{'Teléfono'}</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    {'Correo de Contacto'}
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="contacto@auragym.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">{'Dirección'}</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                      placeholder="Calle, Número, Colonia, Ciudad, Estado, C.P."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{'Sitio Web'}</label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="https://www.auragym.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{'Zona Horaria'}</label>
                  <div className="relative">
                    <Hash className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors appearance-none"
                    >
                      <option value="America/Mexico_City">America/Mexico_City</option>
                      <option value="America/Monterrey">America/Monterrey</option>
                      <option value="America/Cancun">America/Cancun</option>
                      <option value="America/Bogota">America/Bogota</option>
                      <option value="America/Argentina/Buenos_Aires">
                        America/Argentina/Buenos_Aires
                      </option>
                      <option value="Europe/Madrid">Europe/Madrid</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
