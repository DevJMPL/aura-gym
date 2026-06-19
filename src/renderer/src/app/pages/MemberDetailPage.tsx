import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { memberService } from '../../features/members/services/memberService'
import { membershipService } from '../../features/memberships/services/membershipService'
import { MemberProfile } from '../../features/members/components/MemberProfile'
import { AssignMembershipModal } from '../../features/memberships/components/AssignMembershipModal'
import { attendanceService } from '../../features/attendance/services/attendanceService'
import { useTenant } from '../../contexts/TenantContext'
import { membershipPaymentsService } from '../../features/members/services/membershipPaymentsService'
import { RegisterPaymentModal } from '../../features/members/components/RegisterPaymentModal'
import type { Member, Membership, AttendanceRecord, MembershipCharge } from '../../types/database'
import { LoadingState, AlertBanner, Card, Button } from '../../components/ui'
import { PlusCircle, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
export function MemberDetailPage() {
  const dateLocale = 'es-MX'.startsWith('en') ? enUS : es
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeTenantId } = useTenant()
  const [member, setMember] = useState<Member | null>(null)
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [charges, setCharges] = useState<MembershipCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [paymentModalCharge, setPaymentModalCharge] = useState<MembershipCharge | null>(null)
  useEffect(() => {
    async function fetchMember() {
      if (!id || !activeTenantId) return
      try {
        setIsLoading(true)
        const [memberData, membershipData, daysData, historyData, chargesData] = await Promise.all([
          memberService.getById(activeTenantId, id),
          membershipService.getActiveMembership(activeTenantId, id),
          memberService.getTrainingDays(activeTenantId, id),
          attendanceService.getMemberHistory(activeTenantId, id),
          membershipPaymentsService.getMemberCharges(activeTenantId, id),
        ])
        setMember(memberData)
        setActiveMembership(membershipData)
        setTrainingDays(daysData)
        setAttendanceHistory(historyData)
        setCharges(chargesData)
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }
    fetchMember()
  }, [id, activeTenantId])
  const handleRefresh = () => {
    if (id && activeTenantId) {
      setIsLoading(true)
      Promise.all([
        memberService.getById(activeTenantId, id),
        membershipService.getActiveMembership(activeTenantId, id),
        memberService.getTrainingDays(activeTenantId, id),
        attendanceService.getMemberHistory(activeTenantId, id),
        membershipPaymentsService.getMemberCharges(activeTenantId, id),
      ])
        .then(([memberData, membershipData, daysData, historyData, chargesData]) => {
          setMember(memberData)
          setActiveMembership(membershipData)
          setTrainingDays(daysData)
          setAttendanceHistory(historyData)
          setCharges(chargesData)
        })
        .finally(() => setIsLoading(false))
    }
  }
  if (isLoading) return <LoadingState fullScreen message={'Cargando perfil...'} />
  if (error || !member) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <AlertBanner type="error" message={'No se pudo cargar la información del miembro.'} />
        <button onClick={() => navigate('/members')} className="text-primary-600 hover:underline">
          {'Volver a la lista'}
        </button>
      </div>
    )
  }
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/members')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{'Perfil del Miembro'}</h1>
          <p className="text-slate-500 mt-1">{'Detalles, membresías y asistencias'}</p>
        </div>
      </div>

      <MemberProfile
        member={member}
        trainingDays={trainingDays}
        attendanceHistory={attendanceHistory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={'Membresía Actual'}>
          {activeMembership ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div>
                  <h4 className="font-bold text-slate-900">
                    {(activeMembership.plan as unknown as { name?: string })?.name || 'Plan Activo'}
                  </h4>
                  <p className="text-sm text-slate-500 capitalize">
                    {(activeMembership.plan as unknown as { type?: string })?.type || 'Desconocido'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary-600">
                    {'Vence el'}{' '}
                    {format(new Date(activeMembership.end_date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs text-slate-400">
                    {'Inició'}{' '}
                    {format(new Date(activeMembership.start_date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAssignModalOpen(true)}
              >
                {'Renovar o Cambiar Plan'}
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p className="mb-4">{'Este miembro no tiene un plan activo.'}</p>
              <Button
                onClick={() => setIsAssignModalOpen(true)}
                icon={<PlusCircle className="w-4 h-4" />}
              >
                {'Asignar Membresía'}
              </Button>
            </div>
          )}
        </Card>

        <Card title={'Historial de Asistencia'}>
          {attendanceHistory.length > 0 ? (
            <div className="space-y-3">
              {attendanceHistory.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-900 capitalize">
                      {format(new Date(record.check_in_at), 'EEEE d MMMM', {
                        locale: dateLocale,
                      })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(record.check_in_at), 'h:mm a', {
                        locale: dateLocale,
                      })}{' '}
                      •{' '}
                      {record.status === 'valid'
                        ? 'Permitido'
                        : record.status === 'denied'
                          ? 'Denegado'
                          : 'Duplicado'}
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${record.status === 'valid' ? 'bg-green-500' : record.status === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`}
                  />
                </div>
              ))}
              {attendanceHistory.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-slate-500">{'members.showingLast'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p>{'Este miembro aún no tiene registros de asistencia.'}</p>
            </div>
          )}
        </Card>
      </div>

      <Card title={'Historial Financiero'}>
        {charges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-xl">Fecha</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Pagado</th>
                  <th className="px-4 py-3 font-medium">Adeudo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium rounded-r-xl text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {format(new Date(charge.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {(charge.plan as any)?.name ?? 'Desconocido'}
                    </td>
                    <td className="px-4 py-4">${Number(charge.total).toFixed(2)}</td>
                    <td className="px-4 py-4 text-green-600">
                      ${Number(charge.amount_paid).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 font-bold text-red-600">
                      ${Number(charge.balance_due).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          charge.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : charge.payment_status === 'partially_paid'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {charge.payment_status === 'paid'
                          ? 'Pagado'
                          : charge.payment_status === 'partially_paid'
                            ? 'Parcial'
                            : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {charge.balance_due > 0 && charge.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPaymentModalCharge(charge)}
                        >
                          Abonar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 flex flex-col items-center">
            <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
            <p>Este miembro no tiene cargos ni pagos registrados.</p>
          </div>
        )}
      </Card>

      <AssignMembershipModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        memberId={member.id}
        onSuccess={handleRefresh}
      />

      <RegisterPaymentModal
        isOpen={!!paymentModalCharge}
        onClose={() => setPaymentModalCharge(null)}
        charge={paymentModalCharge}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
