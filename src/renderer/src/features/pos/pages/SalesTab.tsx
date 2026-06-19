import { useState } from 'react'
import { format } from 'date-fns'
import { CreditCard } from 'lucide-react'
import { Button, Table, Badge, Select, EmptyState } from '../../../components/ui'
import { useSales } from '../hooks/useSales'
import { RegisterSalePaymentModal } from '../components/RegisterSalePaymentModal'
import type { Sale } from '../../../types/database'
import { formatCurrency } from '../../../utils/formatters'

export function SalesTab() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { sales, isLoading, fetchSales } = useSales(statusFilter || undefined)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const handleOpenPayment = (sale: Sale) => {
    setSelectedSale(sale)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = async () => {
    await fetchSales()
    setIsPaymentModalOpen(false)
  }

  const columns = [
    {
      key: 'folio',
      header: 'Folio / Fecha',
      render: (row: Sale) => (
        <div>
          <div className="font-bold text-slate-900">#{row.sale_number}</div>
          <div className="text-xs text-slate-500">
            {format(new Date(row.created_at), 'dd/MM/yy HH:mm')}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (row: Sale) => (
        <span className="font-medium text-slate-800">
          {row.member?.full_name || row.external_customer_name || 'Público General'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: Sale) => (
        <span className="font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Adeudo',
      render: (row: Sale) => (
        <span className={`font-bold ${row.balance_due > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
          {formatCurrency(row.balance_due)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Sale) => {
        if (row.status === 'cancelled') return <Badge variant="default">Cancelada</Badge>
        switch (row.payment_status) {
          case 'paid':
            return <Badge variant="success">Pagado</Badge>
          case 'partially_paid':
            return <Badge variant="warning">Parcial</Badge>
          case 'pending':
            return <Badge variant="danger">Pendiente</Badge>
          default:
            return <Badge variant="default">{row.payment_status}</Badge>
        }
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row: Sale) => (
        <div className="flex items-center gap-2">
          {row.balance_due > 0 && row.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenPayment(row)}
              className="h-8 text-xs px-2 py-1"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Abonar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-bold text-slate-900">Historial de Ventas</h2>
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las ventas' },
              { value: 'paid', label: 'Totalmente Pagadas' },
              { value: 'partially_paid', label: 'Con Pagos Parciales' },
              { value: 'pending', label: 'Pendientes (Adeudos)' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Cargando ventas...</div>
      ) : sales.length === 0 ? (
        <EmptyState
          title="Sin ventas"
          description="Aquí aparecerán las ventas realizadas en el POS."
        />
      ) : (
        <Table columns={columns} data={sales} keyExtractor={(row) => row.id} />
      )}

      <RegisterSalePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        sale={selectedSale}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
