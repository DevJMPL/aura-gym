import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { Button, Input, AlertBanner } from '../../../components/ui'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    const { error: signInError } = await signIn(data.email, data.password)

    if (signInError) {
      if (signInError === 'Invalid login credentials') {
        setError('Credenciales inválidas. Por favor, verifica tu correo y contraseña.')
      } else {
        setError(signInError)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <AlertBanner type="error" message={error} />}

      <div className="space-y-4">
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="admin@aura.gym"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        Iniciar Sesión
      </Button>
    </form>
  )
}
