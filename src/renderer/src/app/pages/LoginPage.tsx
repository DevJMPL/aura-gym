import { useState } from 'react'
import { LoginForm } from '../../features/auth/components/LoginForm'
import { RegisterForm } from '../../features/auth/components/RegisterForm'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { LoadingState } from '../../components/ui'

export function LoginPage() {
  const { session, isLoading } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)

  // If still loading auth state, show a generic loading screen
  if (isLoading) {
    return <LoadingState fullScreen message={'Cargando...'} />
  }

  // If already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {isRegistering ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
        </h2>
        <p className="text-slate-500 mt-1">
          {isRegistering
            ? 'Regístrate para empezar a usar Aura Gym'
            : 'Ingresa a tu cuenta para continuar'}
        </p>
      </div>

      <div key={isRegistering ? 'register' : 'login'} className="animate-fade-in">
        {isRegistering ? <RegisterForm /> : <LoginForm />}
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        {isRegistering ? (
          <p>
            {'¿Ya tienes una cuenta? '}{' '}
            <button
              onClick={() => setIsRegistering(false)}
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              {'Iniciar Sesión'}
            </button>
          </p>
        ) : (
          <div className="space-y-4">
            <p>
              {'¿Olvidaste tu contraseña?'}{' '}
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                {'Recuperar aquí'}
              </a>
            </p>
            <p>
              {'¿No tienes cuenta? '}{' '}
              <button
                onClick={() => setIsRegistering(true)}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                {'Regístrate'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
