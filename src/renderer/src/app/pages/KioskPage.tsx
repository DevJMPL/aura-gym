import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react'
import { useGym } from '../../contexts/GymContext'
import { useTenant } from '../../contexts/TenantContext'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceService } from '../../features/attendance/services/attendanceService'
import { memberService } from '../../features/members/services/memberService'
import { Modal, Input, Button } from '../../components/ui'
import type { Member } from '../../types/database'

export function KioskPage() {
  const navigate = useNavigate()
  const { gym } = useGym()
  const { activeTenantId } = useTenant()
  const { user, signIn } = useAuth()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'warning'>('idle')
  const [message, setMessage] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberPhoto, setMemberPhoto] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [showExitModal, setShowExitModal] = useState(false)
  const [password, setPassword] = useState('')
  const [exitError, setExitError] = useState('')
  const [isExiting, setIsExiting] = useState(false)

  const [suggestions, setSuggestions] = useState<Member[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Keep focus on the input unless we are showing suggestions or clicking away
  const handleBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    // Only force focus if we're in idle state and not showing suggestions or exit modal
    // This allows clicking on suggestions or modal inputs without the main input stealing focus back
    if (status === 'idle' && !showSuggestions && !showExitModal) {
      // Small delay to allow click events to fire first
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  // Search logic
  useEffect(() => {
    const search = async () => {
      if (!activeTenantId) return
      if (code.length >= 2) {
        try {
          const results = await memberService.searchMembers(activeTenantId, code)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error(error)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(search, 300) // debounce
    return () => clearTimeout(timeoutId)
  }, [code, activeTenantId])

  const processCheckIn = async (identifier: string) => {
    if (!activeTenantId) return
    setStatus('loading')
    setMemberPhoto(null)

    try {
      const result = await attendanceService.processCheckIn(activeTenantId, identifier)

      setMemberName(result.memberName || '')
      setMemberPhoto(result.memberPhoto || null)
      setMessage(result.message)

      if (result.success) {
        setStatus('success')
      } else if (result.status === 'duplicate') {
        setStatus('warning')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage('Error al verificar el código')
    }

    setCode('')
    setSuggestions([])
    setShowSuggestions(false)

    setTimeout(() => {
      setStatus('idle')
      setMessage('')
      setMemberName('')
      setMemberPhoto(null)
      // Focus back on input after reset
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }, 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    await processCheckIn(code)
  }

  const handleSelectMember = (member: Member) => {
    const identifier = member.username || member.member_code
    setCode(identifier)
    setShowSuggestions(false)
    processCheckIn(identifier)
  }

  const handleExitKiosk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsExiting(true)
    setExitError('')

    if (user?.email) {
      const { error } = await signIn(user.email, password)
      if (error) {
        setExitError('Contraseña incorrecta')
        setIsExiting(false)
      } else {
        setShowExitModal(false)
        navigate('/dashboard')
      }
    } else {
      setExitError('Error de usuario')
      setIsExiting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setPassword('')
          setExitError('')
          setShowExitModal(true)
        }}
        className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-900 rounded-xl backdrop-blur-md transition-all shadow-sm z-50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium text-sm">{'Salir del Kiosco'}</span>
      </button>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-white/50 transform transition-all duration-500 ease-in-out relative z-10 w-full">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 transform transition-transform hover:scale-105 duration-300 overflow-hidden">
            {gym?.logo_url ? (
              <img
                src={gym.logo_url}
                alt={gym.name || 'Aura Gym'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Dumbbell className="w-10 h-10 text-white" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {gym?.name || 'Aura Gym'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {'Ingresa tu código para entrenar'}
            </p>
          </div>

          <div className="w-full pt-8 pb-4 relative h-48 flex items-center justify-center">
            {/* Default Idle State */}
            <div
              className={`absolute w-full transition-all duration-500 transform ${status === 'idle' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
            >
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={handleBlur}
                  placeholder={'Nombre, @Username o Código'}
                  className="w-full text-center text-3xl font-bold tracking-tight text-slate-800 placeholder:text-slate-300 bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 px-4 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-300"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-0 disabled:scale-75 transition-all duration-300"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <ul className="max-h-60 overflow-y-auto py-2">
                    {suggestions.map((member) => (
                      <li
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-4 transition-colors border-b border-slate-50 last:border-0"
                      >
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <UserIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-bold text-slate-900">{member.full_name}</div>
                          <div className="text-sm text-slate-500 flex gap-2">
                            {member.username && (
                              <span className="font-medium text-primary-600">
                                @{member.username}
                              </span>
                            )}
                            <span>{member.member_code}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Loading State */}
            <div
              className={`absolute w-full flex flex-col items-center justify-center transition-all duration-500 transform ${status === 'loading' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}
            >
              <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium animate-pulse">
                {'Verificando acceso...'}
              </p>
            </div>

            {/* Success State */}
            <div
              className={`absolute w-full flex flex-col items-center justify-center transition-all duration-500 transform ${status === 'success' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
            >
              <div className="relative mb-4">
                <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-green-500 overflow-hidden shadow-lg shadow-green-500/30">
                  {memberPhoto ? (
                    <img
                      src={memberPhoto}
                      alt={memberName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 text-white border-4 border-white shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{memberName}</h2>
              <p className="text-green-600 font-medium text-lg mt-1">{message}</p>
            </div>

            {/* Warning State */}
            <div
              className={`absolute w-full flex flex-col items-center justify-center transition-all duration-500 transform ${status === 'warning' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
            >
              <div className="relative mb-4">
                <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-yellow-500 overflow-hidden shadow-lg shadow-yellow-500/30">
                  {memberPhoto ? (
                    <img
                      src={memberPhoto}
                      alt={memberName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-1 text-white border-4 border-white shadow-sm">
                  <Dumbbell className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{memberName}</h2>
              <p className="text-yellow-600 font-medium text-lg mt-1">{message}</p>
            </div>

            {/* Error State */}
            <div
              className={`absolute w-full flex flex-col items-center justify-center transition-all duration-500 transform ${status === 'error' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 animate-[shake_0.5s_ease-in-out]">
                <XCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{'Acceso Denegado'}</h2>
              <p className="text-red-600 font-medium text-lg mt-1">{message}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Verificación de Seguridad"
        size="sm"
      >
        <form onSubmit={handleExitKiosk} className="space-y-4">
          <p className="text-sm text-slate-600">
            Ingresa tu contraseña para salir del modo kiosco y volver a la administración.
          </p>

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoFocus
          />

          {exitError && <p className="text-sm text-red-600 font-medium">{exitError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowExitModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isExiting}>
              Verificar y Salir
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
