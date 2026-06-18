import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { Button, Input, AlertBanner } from '../../../components/ui'

export function RegisterForm() {
  const registerSchema = z.object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  })

  type RegisterFormData = z.infer<typeof registerSchema>

  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    const { error: signUpError } = await signUp(data.email, data.password, data.fullName, 'admin')

    if (signUpError) {
      setError(signUpError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <AlertBanner type="error" message={error} />}

      <div className="space-y-4">
        <Input
          label={'Nombre Completo'}
          type="text"
          placeholder="Juan Pérez"
          icon={<User className="w-5 h-5" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label={'Correo Electrónico'}
          type="email"
          placeholder="admin@aura.gym"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={'Contraseña'}
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        {'Crear Cuenta'}
      </Button>
    </form>
  )
}
