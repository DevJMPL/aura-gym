import { LoginForm } from '../../features/auth/components/LoginForm'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { LoadingState } from '../../components/ui'

export function LoginPage() {
  const { session, isLoading } = useAuth()

  // If still loading auth state, show a generic loading screen
  if (isLoading) {
    return <LoadingState fullScreen message={"Cargando..."} />
  }

  // If already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">{"Bienvenido de nuevo"}</h2>
        <p className="text-slate-500 mt-1">{"Ingresa a tu cuenta para continuar"}</p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center text-sm text-slate-500">
        <p>
          {"¿Olvidaste tu contraseña?"}{' '}
          <a
            href="#"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            {"Recuperar aquí"}
          </a>
        </p>
      </div>
    </div>
  )
}
