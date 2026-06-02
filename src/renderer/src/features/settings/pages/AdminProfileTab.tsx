import { useState } from 'react'
import { User, Mail, ShieldCheck, Camera, Calendar, Clock } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Button, Badge, PhotoCapture } from '../../../components/ui'
import { settingsService } from '../services/settings.service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function AdminProfileTab() {
  const { appUser, user, refreshUser } = useAuth()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(appUser?.full_name || '')

  const handleCapture = async (base64Image: string) => {
    if (!appUser) return
    setIsCapturing(false)
    setIsUploading(true)
    try {
      // Convert base64 to File
      const res = await fetch(base64Image)
      const blob = await res.blob()
      const file = new File([blob], `avatar.jpg`, { type: 'image/jpeg' })

      const url = await settingsService.uploadImage(file, 'avatars', `user-${appUser.id}`)
      await settingsService.updateProfile(appUser.id, { photo_url: url })
      await refreshUser()
    } catch (error) {
      console.error('Error saving photo:', error)
      alert("Hubo un error al guardar la foto.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (!appUser || !fullName.trim()) return
    try {
      await settingsService.updateProfile(appUser.id, { full_name: fullName })
      await refreshUser()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving name:', error)
      alert("Hubo un error al actualizar el nombre.")
    }
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{"Perfil del Administrador"}</h2>
        <p className="text-slate-500">{"Gestiona tu información personal y credenciales de acceso."}</p>
      </div>

      <Card className="p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4 shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 text-4xl font-bold border-4 border-white shadow-md overflow-hidden">
                {appUser?.photo_url ? (
                  <img src={appUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  appUser?.full_name?.[0]?.toUpperCase() || 'A'
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCapturing(true)}
                disabled={isUploading}
                className="absolute bottom-2 right-2 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-primary-600 shadow-md transition-transform group-hover:scale-110 disabled:opacity-50 cursor-pointer"
                title={"Cambiar fotografía"}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <Badge variant="default">
                <div className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {appUser?.role || 'Admin'}
                </div>
              </Badge>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{"Nombre Completo"}</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    />
                    <Button size="sm" onClick={handleSaveName}>{"Guardar"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>{"Cancelar"}</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 font-medium">{appUser?.full_name}</span>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-primary-600 hover:underline text-sm font-medium cursor-pointer">
                      {"Editar"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{"Correo Electrónico"}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 font-medium">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{"Miembro Desde"}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 font-medium">
                    {appUser?.created_at ? format(new Date(appUser.created_at), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{"Última Actualización"}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 font-medium">
                    {appUser?.updated_at ? format(new Date(appUser.updated_at), "d 'de' MMM, HH:mm", { locale: es }) : 'N/A'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Card>

      {isCapturing && (
        <PhotoCapture
          onCapture={handleCapture}
          onCancel={() => setIsCapturing(false)}
        />
      )}
    </div>
  )
}
