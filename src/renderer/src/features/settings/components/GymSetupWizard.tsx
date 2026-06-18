import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, MapPin, Phone, Mail, Image as ImageIcon } from 'lucide-react'
import { tenantService } from '../services/tenantService'
import { useAuth } from '../../../contexts/AuthContext'

import { useTenant } from '../../../contexts/TenantContext'
import { Button, Input, Select, AlertBanner } from '../../../components/ui'
import { useNavigate } from 'react-router-dom'

const setupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  currency: z.string().min(1, 'Selecciona una moneda'),
  timezone: z.string().min(1, 'Selecciona una zona horaria'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  logo_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
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
  const { refreshTenants } = useTenant()
  const { appUser } = useAuth()
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
    if (!appUser) return
    try {
      setError(null)
      // Normalize empty strings to undefined
      const cleanData = {
        ...data,
        email: data.email || undefined,
        logo_url: data.logo_url || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      }
      await tenantService.createTenant(appUser.id, cleanData)
      await refreshTenants()
      // Redirect to select-gym so user picks which gym to use
      navigate('/select-gym', { replace: true })
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Correo (opcional)"
            placeholder="contacto@auragym.com"
            type="email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Teléfono (opcional)"
            placeholder="+52 123 456 7890"
            icon={<Phone className="w-5 h-5" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Input
          label="Dirección (opcional)"
          placeholder="Av. Reforma 123, Centro"
          icon={<MapPin className="w-5 h-5" />}
          error={errors.address?.message}
          {...register('address')}
        />

        <Input
          label="Logo URL (opcional)"
          placeholder="https://ejemplo.com/logo.png"
          icon={<ImageIcon className="w-5 h-5" />}
          error={errors.logo_url?.message}
          {...register('logo_url')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Completar Configuración
        </Button>
      </div>
    </form>
  )
}
