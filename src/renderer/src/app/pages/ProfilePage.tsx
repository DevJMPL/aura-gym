import { useState } from 'react'
import { Dumbbell, LogOut, User, Mail, ShieldCheck, MapPin, Phone, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGym } from '../../contexts/GymContext'
import { Card, Button, Badge, PhotoCapture } from '../../components/ui'
import { storageService } from '../../lib/supabase/storageService'
import { supabase } from '../../lib/supabase/client'

export function ProfilePage() {
  const { appUser, user, signOut, refreshUser } = useAuth()
  const { gym } = useGym()
  const navigate = useNavigate()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleCapture = async (base64Image: string) => {
    if (!appUser) return
    setIsCapturing(false)
    setIsUploading(true)
    try {
      const fileName = `admin-${appUser.id}-${Date.now()}.jpg`
      const url = await storageService.uploadAvatar(base64Image, fileName)
      await supabase.from('app_users').update({ photo_url: url }).eq('id', appUser.id)
      await refreshUser()
    } catch (error) {
      console.error('Error saving photo:', error)
      alert('Hubo un error al guardar la foto.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Perfil del Administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Owner Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center p-6 text-center shadow-lg shadow-slate-200/40 relative">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 text-3xl font-bold border-4 border-white shadow-md mb-4 overflow-hidden">
                {appUser?.photo_url ? (
                  <img src={appUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  appUser?.full_name?.[0]?.toUpperCase() || 'A'
                )}
              </div>
              <button
                onClick={() => setIsCapturing(true)}
                disabled={isUploading}
                className="absolute bottom-4 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-primary-600 shadow-sm transition-colors group-hover:scale-110 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{appUser?.full_name || 'Administrador'}</h2>
            <div className="mt-2">
              <Badge variant="info">
                <div className="flex items-center capitalize">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {appUser?.role || 'Propietario'}
                </div>
              </Badge>
            </div>

            <div className="w-full mt-6 space-y-3 text-left">
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 mr-3" />
                <span className="truncate">{user?.email || 'admin@example.com'}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <User className="w-4 h-4 text-slate-400 mr-3" />
                <span className="truncate">ID: {appUser?.id?.substring(0, 8)}...</span>
              </div>
            </div>

            <Button 
              variant="danger" 
              className="w-full mt-6 group"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Cerrar Sesión
            </Button>
          </Card>
        </div>

        {/* Gym Information */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 shadow-lg shadow-slate-200/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Información del Gimnasio</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                Editar Configuración
              </Button>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shrink-0 shadow-md">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{gym?.name || 'Aura Gym'}</h3>
                <p className="text-sm text-slate-500 mt-1">Gimnasio configurado y activo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Moneda</label>
                <div className="text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                  {gym?.currency || 'USD'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Zona Horaria</label>
                <div className="text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                  {gym?.timezone || 'UTC'}
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Dirección (Próximamente)</label>
                <div className="flex items-center text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg italic">
                  <MapPin className="w-4 h-4 mr-2" />
                  Añadir dirección...
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Teléfono (Próximamente)</label>
                <div className="flex items-center text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg italic">
                  <Phone className="w-4 h-4 mr-2" />
                  Añadir teléfono...
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {isCapturing && (
        <PhotoCapture
          onCapture={handleCapture}
          onCancel={() => setIsCapturing(false)}
        />
      )}
    </div>
  )
}
