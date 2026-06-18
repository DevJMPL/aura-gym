import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Camera, User as UserIcon } from 'lucide-react'
import { memberService } from '../../features/members/services/memberService'
import { TrainingDaysSelector } from '../../features/members/components/TrainingDaysSelector'
import { Button, Input, Select, Card, AlertBanner, PhotoCapture } from '../../components/ui'
import { storageService } from '../../lib/supabase/storageService'
import { useTenant } from '../../contexts/TenantContext'
import type { MemberFormData } from '../../types/database'

export function MemberFormPage() {
  const { id } = useParams()
  const { activeTenantId } = useTenant()
  const STATUS_OPTIONS = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'suspended', label: 'Suspendido' },
  ]

  const isEditing = Boolean(id && id !== 'new')
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [base64Photo, setBase64Photo] = useState<string | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null)

  const memberSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    username: z.string().optional(),
    email: z.string().email('Email inválido').or(z.literal('')),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'expired'] as const),
  })

  type MemberFormValues = z.infer<typeof memberSchema>

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: 'active',
      username: '',
      email: '',
      phone: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (isEditing && id && activeTenantId) {
      Promise.all([
        memberService.getById(activeTenantId, id),
        memberService.getTrainingDays(activeTenantId, id),
      ])
        .then(([member, days]) => {
          reset({
            full_name: member.full_name,
            username: member.username || '',
            email: member.email || '',
            phone: member.phone || '',
            date_of_birth: member.date_of_birth || '',
            notes: member.notes || '',
            status: member.status,
          })
          setExistingPhoto(member.photo_url || null)
          setTrainingDays(days)
        })
        .catch((err) => {
          setError(`${'Error al cargar el miembro:'} ${err.message}`)
        })
    }
  }, [id, isEditing, reset, activeTenantId])

  const onSubmit = async (data: MemberFormValues) => {
    try {
      setError(null)
      if (!activeTenantId) {
        setError('No se pudo determinar el gimnasio activo.')
        return
      }

      let memberId = id

      let photoUrl = existingPhoto
      if (base64Photo) {
        const fileName = `member-${Date.now()}.jpg`
        photoUrl = await storageService.uploadAvatar(base64Photo, fileName)
      }

      const payload: Partial<MemberFormData> & { photo_url?: string | null } = {
        ...data,
        username: data.username || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        date_of_birth: data.date_of_birth || undefined,
        notes: data.notes || undefined,
        photo_url: photoUrl,
      }

      if (isEditing && id) {
        await memberService.update(activeTenantId, id, payload)
      } else {
        const newMember = await memberService.create(activeTenantId, payload as MemberFormData)
        memberId = newMember.id
      }

      if (memberId) {
        await memberService.saveTrainingDays(activeTenantId, memberId, trainingDays)
      }

      navigate(`/members/${memberId}`, { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('members_username_key')) {
        setError('Ese @Username ya está en uso. Por favor, elige uno diferente.')
      } else {
        setError(err instanceof Error ? err.message : 'Error al guardar el miembro')
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Editar Miembro' : 'Nuevo Miembro'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditing
              ? 'Actualiza los datos del cliente'
              : 'Registra un nuevo cliente en el gimnasio'}
          </p>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 overflow-hidden">
                {base64Photo || existingPhoto ? (
                  <img
                    src={base64Photo || existingPhoto!}
                    alt="Member preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCapturing(true)}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-primary-600 shadow-sm transition-colors group-hover:scale-110"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={'Nombre Completo *'}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label={'@Username (opcional)'}
              error={errors.username?.message}
              placeholder="Ej: juanchin99"
              {...register('username')}
            />

            <Input
              label={'Correo Electrónico'}
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input label={'Teléfono'} error={errors.phone?.message} {...register('phone')} />

            <Input
              label={'Fecha de Nacimiento'}
              type="date"
              error={errors.date_of_birth?.message}
              {...register('date_of_birth')}
            />

            <div className="md:col-span-2">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label={'Estado'}
                    options={STATUS_OPTIONS}
                    error={errors.status?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <TrainingDaysSelector selectedDays={trainingDays} onChange={setTrainingDays} />
            </div>

            <div className="md:col-span-2">
              <Input
                label={'Notas Adicionales'}
                error={errors.notes?.message}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {'Cancelar'}
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={<Save className="w-4 h-4" />}>
              {'Guardar Miembro'}
            </Button>
          </div>
        </form>
      </Card>

      {isCapturing && (
        <PhotoCapture
          onCapture={(base64) => {
            setBase64Photo(base64)
            setIsCapturing(false)
          }}
          onCancel={() => setIsCapturing(false)}
        />
      )}
    </div>
  )
}
