import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 } from 'lucide-react'
import { settingsService } from '../services/settingsService'
import { useGym } from '../../../contexts/GymContext'
import { Button, Input, Select, AlertBanner } from '../../../components/ui'
import { useNavigate } from 'react-router-dom'

const setupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  currency: z.string().min(1, 'Selecciona una moneda'),
  timezone: z.string().min(1, 'Selecciona una zona horaria'),
})

type SetupFormData = z.infer<typeof setupSchema>

const CURRENCIES = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
]

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
  { value: 'America/New_York', label: 'Nueva York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (PST)' },
]

export function GymSetupWizard() {
  const { refreshGym } = useGym()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      currency: 'MXN',
      timezone: 'America/Mexico_City',
    },
  })

  const onSubmit = async (data: SetupFormData) => {
    try {
      setError(null)
      await settingsService.createSettings({
        ...data,
        business_days: ['1', '2', '3', '4', '5', '6'],
        opening_time: '06:00',
        closing_time: '22:00',
      })
      await refreshGym()
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Error al configurar el gimnasio')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <AlertBanner type="error" message={error} />}

      <div className="space-y-5">
        <Input
          label="Nombre del Gimnasio"
          placeholder="Aura Gym Center"
          icon={<Building2 className="w-5 h-5" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Moneda Principal"
          options={CURRENCIES}
          error={errors.currency?.message}
          {...register('currency')}
        />

        <Select
          label="Zona Horaria"
          options={TIMEZONES}
          error={errors.timezone?.message}
          {...register('timezone')}
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Completar Configuración
        </Button>
      </div>
    </form>
  )
}
