import { useState, useEffect } from 'react'
import { Banknote, Search, AlertCircle, ShoppingCart, User } from 'lucide-react'
import { useTenant } from '../../contexts/TenantContext'
import { membershipPaymentsService } from '../../features/members/services/membershipPaymentsService'
import { posService } from '../../features/pos/services/posService'
import type { MembershipCharge, Sale } from '../../types/database'
import { LoadingState, Card, Button } from '../../components/ui'
import { format } from 'date-fns'
import { RegisterPaymentModal as MembershipPaymentModal } from '../../features/members/components/RegisterPaymentModal'
import { RegisterSalePaymentModal } from '../../features/pos/components/RegisterSalePaymentModal'

interface DebtItem {
  id: string
  type: 'membership' | 'pos'
  memberName: string
  memberId?: string
  concept: string
  total: number
  amountPaid: number
  balanceDue: number
  dueDate: string | null
  createdAt: string
  originalCharge?: MembershipCharge
  originalSale?: Sale
}

export function FinancesPage() {
  const { activeTenantId } = useTenant()
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedMembershipCharge, setSelectedMembershipCharge] = useState<MembershipCharge | null>(
    null
  )
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  useEffect(() => {
    fetchDebts()
  }, [activeTenantId])

  const fetchDebts = async () => {
    if (!activeTenantId) return
    setIsLoading(true)
    setError(null)

    try {
      // Fetch membership debts
      const membershipCharges = await membershipPaymentsService.getPendingCharges(activeTenantId)

      // Fetch all sales and filter for pending/partially_paid.
      // (posService.getSales only accepts one string for payment_status. We could call it twice or just fetch all and filter)
      const pendingSales = await posService.getSales(activeTenantId, { payment_status: 'pending' })
      const partiallyPaidSales = await posService.getSales(activeTenantId, {
        payment_status: 'partially_paid',
      })
      const allSales = [...pendingSales, ...partiallyPaidSales].filter(
        (s) => s.status !== 'cancelled'
      )

      const combinedDebts: DebtItem[] = [
        ...membershipCharges.map((c) => ({
          id: c.id,
          type: 'membership' as const,
          memberName: (c.member as any)?.full_name || 'Desconocido',
          memberId: c.member_id,
          concept: `Membresía: ${(c.plan as any)?.name || 'Desconocido'}`,
          total: c.total,
          amountPaid: c.amount_paid,
          balanceDue: c.balance_due,
          dueDate: c.due_date,
          createdAt: c.created_at,
          originalCharge: c,
        })),
        ...allSales.map((s) => ({
          id: s.id,
          type: 'pos' as const,
          memberName: (s.member as any)?.full_name || s.external_customer_name || 'Desconocido',
          memberId: s.member_id || undefined,
          concept: 'Venta de Productos (POS)',
          total: s.total,
          amountPaid: s.amount_paid,
          balanceDue: s.balance_due,
          dueDate: s.due_date,
          createdAt: s.created_at,
          originalSale: s,
        })),
      ]

      // Sort by due date (ascending), nulls at the end
      combinedDebts.sort((a, b) => {
        if (!a.dueDate && !b.dueDate)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

      setDebts(combinedDebts)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDebts = debts.filter(
    (d) =>
      d.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.concept.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balanceDue), 0)

  if (isLoading) return <LoadingState message="Cargando finanzas..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finanzas y Adeudos</h1>
        <p className="text-slate-500 mt-1">
          Monitorea y cobra los saldos pendientes de tus miembros
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white shadow-xl shadow-slate-900/20">
          <div className="flex items-center gap-3 mb-4 opacity-80">
            <Banknote className="w-5 h-5" />
            <h3 className="font-medium">Adeudo Total Pendiente</h3>
          </div>
          <div className="text-4xl font-black">${totalDebt.toFixed(2)}</div>
          <div className="mt-4 text-sm opacity-80 flex justify-between">
            <span>{debts.filter((d) => d.type === 'membership').length} de membresías</span>
            <span>{debts.filter((d) => d.type === 'pos').length} de POS</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Saldos Pendientes</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium rounded-l-xl">Tipo</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Adeudo</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium rounded-r-xl text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron adeudos.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      {debt.type === 'membership' ? (
                        <span className="flex items-center gap-1.5 text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <User className="w-3.5 h-3.5" />
                          Membresía
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          POS
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">{debt.memberName}</td>
                    <td className="px-4 py-4 text-slate-500">{debt.concept}</td>
                    <td className="px-4 py-4 font-black text-red-600">
                      ${Number(debt.balanceDue).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      {debt.dueDate ? (
                        <span
                          className={
                            new Date(debt.dueDate) < new Date() ? 'text-red-500 font-medium' : ''
                          }
                        >
                          {format(new Date(debt.dueDate), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin fecha</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {debt.type === 'membership' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMembershipCharge(debt.originalCharge!)}
                        >
                          Abonar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSale(debt.originalSale!)}
                        >
                          Abonar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <MembershipPaymentModal
        isOpen={!!selectedMembershipCharge}
        onClose={() => setSelectedMembershipCharge(null)}
        charge={selectedMembershipCharge}
        onSuccess={fetchDebts}
      />

      <RegisterSalePaymentModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        onSuccess={fetchDebts}
      />
    </div>
  )
}
