import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { memberService } from '../../features/members/services/memberService'
import { membershipService } from '../../features/memberships/services/membershipService'
import { MemberProfile } from '../../features/members/components/MemberProfile'
import { AssignMembershipModal } from '../../features/memberships/components/AssignMembershipModal'
import { attendanceService } from '../../features/attendance/services/attendanceService'
import type { Member, Membership, AttendanceRecord } from '../../types/database'
import { LoadingState, AlertBanner, Card, Button } from '../../components/ui'
import { PlusCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function MemberDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [member, setMember] = useState<Member | null>(null)
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  useEffect(() => {
    async function fetchMember() {
      if (!id) return
      try {
        setIsLoading(true)
        const [memberData, membershipData, daysData, historyData] = await Promise.all([
          memberService.getById(id),
          membershipService.getActiveMembership(id),
          memberService.getTrainingDays(id),
          attendanceService.getMemberHistory(id)
        ])
        setMember(memberData)
        setActiveMembership(membershipData)
        setTrainingDays(daysData)
        setAttendanceHistory(historyData)
      } catch (err: any) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMember()
  }, [id])

  const handleRefresh = () => {
    if (id) {
      setIsLoading(true)
      Promise.all([
        memberService.getById(id),
        membershipService.getActiveMembership(id),
        memberService.getTrainingDays(id),
        attendanceService.getMemberHistory(id)
      ])
        .then(([memberData, membershipData, daysData, historyData]) => {
          setMember(memberData)
          setActiveMembership(membershipData)
          setTrainingDays(daysData)
          setAttendanceHistory(historyData)
        })
        .finally(() => setIsLoading(false))
    }
  }

  if (isLoading) return <LoadingState fullScreen message="Cargando perfil..." />

  if (error || !member) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <AlertBanner type="error" message="No se pudo cargar la información del miembro." />
        <button onClick={() => navigate('/members')} className="text-primary-600 hover:underline">
          Volver a la lista
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
          <h1 className="text-2xl font-bold text-slate-900">Perfil del Miembro</h1>
          <p className="text-slate-500 mt-1">Detalles, membresías y asistencias</p>
        </div>
      </div>

      <MemberProfile member={member} trainingDays={trainingDays} attendanceHistory={attendanceHistory} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Membresía Actual">
          {activeMembership ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div>
                  <h4 className="font-bold text-slate-900">{(activeMembership as any).plan?.name || 'Plan Activo'}</h4>
                  <p className="text-sm text-slate-500 capitalize">{(activeMembership as any).plan?.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary-600">
                    Vence el {format(new Date(activeMembership.end_date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs text-slate-400">
                    Inició {format(new Date(activeMembership.start_date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsAssignModalOpen(true)}
              >
                Renovar o Cambiar Plan
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p className="mb-4">Este miembro no tiene un plan activo.</p>
              <Button onClick={() => setIsAssignModalOpen(true)} icon={<PlusCircle className="w-4 h-4" />}>
                Asignar Membresía
              </Button>
            </div>
          )}
        </Card>
        
        <Card title="Historial de Asistencia">
          {attendanceHistory.length > 0 ? (
            <div className="space-y-3">
              {attendanceHistory.slice(0, 5).map(record => (
                <div key={record.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900 capitalize">
                      {format(new Date(record.check_in_at), 'EEEE d MMMM', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(record.check_in_at), 'h:mm a', { locale: es })} • {
                        record.status === 'valid' ? 'Permitido' : 
                        record.status === 'denied' ? 'Denegado' : 'Duplicado'
                      }
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    record.status === 'valid' ? 'bg-green-500' : 
                    record.status === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                </div>
              ))}
              {attendanceHistory.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-slate-500">Mostrando últimos 5 de {attendanceHistory.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p>Este miembro aún no tiene registros de asistencia.</p>
            </div>
          )}
        </Card>
      </div>

      <AssignMembershipModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        memberId={member.id}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
