import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BadgeDollarSign,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Package,
  ReceiptText,
  Search,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import type { PaymentMethod, PosSale } from '../../../types/database'
import { posSaleService } from '../services/posSaleService'

type DatePreset = 'today' | 'week' | 'month' | 'custom'
type SalesTab = 'sales' | 'balances'

const money = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const toDateInput = (date: Date) => {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

function getRangeForPreset(preset: DatePreset) {
  const today = startOfDay(new Date())
  const end = new Date(today)
  end.setDate(end.getDate() + 1)

  if (preset === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return { from: toDateInput(start), to: toDateInput(today) }
  }

  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toDateInput(start), to: toDateInput(today) }
  }

  return { from: toDateInput(today), to: toDateInput(today) }
}

function toQueryRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  end.setDate(end.getDate() + 1)
  return { fromIso: start.toISOString(), toIso: end.toISOString() }
}

export function PosSalesPage() {
  const { appUser } = useAuth()
  const todayRange = getRangeForPreset('today')
  const [sales, setSales] = useState<PosSale[]>([])
  const [pendingBalances, setPendingBalances] = useState<PosSale[]>([])
  const [selectedSale, setSelectedSale] = useState<PosSale | null>(null)
  const [search, setSearch] = useState('')
  const [balanceSearch, setBalanceSearch] = useState('')
  const [activeTab, setActiveTab] = useState<SalesTab>('sales')
  const [preset, setPreset] = useState<DatePreset>('today')
  const [dateFrom, setDateFrom] = useState(todayRange.from)
  const [dateTo, setDateTo] = useState(todayRange.to)
  const [paymentSale, setPaymentSale] = useState<PosSale | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSales() {
    setIsLoading(true)
    setError(null)

    try {
      const range = toQueryRange(dateFrom, dateTo)
      const [rangeSales, balances] = await Promise.all([
        posSaleService.getByDateRange(range.fromIso, range.toIso),
        posSaleService.getPendingBalances(),
      ])

      setSales(rangeSales)
      setPendingBalances(balances)
      if (rangeSales[0]) {
        setSelectedSale(await posSaleService.getById(rangeSales[0].id))
      } else {
        setSelectedSale(null)
      }
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las ventas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSales()
  }, [dateFrom, dateTo])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sales

    return sales.filter((sale) =>
      [
        sale.sale_number,
        sale.member?.full_name,
        sale.customer_name,
        sale.status,
        sale.payment_method,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    )
  }, [sales, search])

  const summary = useMemo(() => {
    const completedSales = sales.filter((sale) => sale.status !== 'cancelled')
    return {
      totalSold: completedSales.reduce((sum, sale) => sum + sale.total_amount, 0),
      totalPaid: completedSales.reduce((sum, sale) => sum + sale.paid_amount, 0),
      balanceDue: completedSales.reduce((sum, sale) => sum + sale.balance_due, 0),
      count: completedSales.length,
    }
  }, [sales])

  const filteredBalances = useMemo(() => {
    const term = balanceSearch.trim().toLowerCase()
    if (!term) return pendingBalances

    return pendingBalances.filter((sale) =>
      [sale.sale_number, sale.member?.full_name, sale.customer_name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    )
  }, [pendingBalances, balanceSearch])

  const filteredBalanceTotal = useMemo(
    () => filteredBalances.reduce((sum, sale) => sum + sale.balance_due, 0),
    [filteredBalances]
  )

  const selectPreset = (nextPreset: DatePreset) => {
    setPreset(nextPreset)
    if (nextPreset !== 'custom') {
      const range = getRangeForPreset(nextPreset)
      setDateFrom(range.from)
      setDateTo(range.to)
    }
  }

  const selectSale = async (sale: PosSale) => {
    setIsDetailLoading(true)
    try {
      setSelectedSale(await posSaleService.getById(sale.id))
    } finally {
      setIsDetailLoading(false)
    }
  }

  const openPaymentModal = (sale: PosSale) => {
    setError(null)
    setPaymentSale(sale)
    setPaymentAmount(String(Math.ceil(sale.balance_due)))
    setPaymentMethod('cash')
  }

  const closePaymentModal = () => {
    if (isPaymentSubmitting) return
    setPaymentSale(null)
    setPaymentAmount('')
  }

  const submitPayment = async () => {
    if (!paymentSale) return

    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      setError('Ingresa un abono mayor a cero.')
      return
    }

    setIsPaymentSubmitting(true)
    setError(null)
    try {
      await posSaleService.addPayment(paymentSale, amount, paymentMethod, appUser?.id || null)
      setPaymentSale(null)
      setPaymentAmount('')
      await loadSales()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.')
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">
            Consulta ventas, detalles de tickets y saldos pendientes.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
          <CalendarDays className="w-4 h-4 text-primary-600" />
          {dateFrom === dateTo ? dateFrom : `${dateFrom} - ${dateTo}`}
        </div>
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton
          active={activeTab === 'sales'}
          icon={<ReceiptText className="w-4 h-4" />}
          label="Ventas"
          onClick={() => setActiveTab('sales')}
        />
        <TabButton
          active={activeTab === 'balances'}
          icon={<WalletCards className="w-4 h-4" />}
          label="Saldos"
          onClick={() => setActiveTab('balances')}
        />
      </div>

      {activeTab === 'sales' ? (
        <>
          <SalesFilters
            search={search}
            preset={preset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchChange={setSearch}
            onPresetChange={selectPreset}
            onDateFromChange={(value) => {
              setPreset('custom')
              setDateFrom(value)
            }}
            onDateToChange={(value) => {
              setPreset('custom')
              setDateTo(value)
            }}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MetricCard
              title={preset === 'today' ? 'Vendido hoy' : 'Vendido'}
              value={money(summary.totalSold)}
              icon={<BadgeDollarSign className="w-5 h-5" />}
            />
            <MetricCard
              title="Pagado"
              value={money(summary.totalPaid)}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <MetricCard
              title="Ventas"
              value={String(summary.count)}
              icon={<ReceiptText className="w-5 h-5" />}
            />
            <MetricCard
              title="Saldos del rango"
              value={money(summary.balanceDue)}
              icon={<WalletCards className="w-5 h-5" />}
              tone={summary.balanceDue > 0 ? 'amber' : 'slate'}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5 items-start">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Ventas del periodo</h2>
                    <p className="text-xs text-slate-500">Pulsa una venta para ver sus detalles.</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                    {filteredSales.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead className="border-b border-slate-200 bg-white text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Folio</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Pago</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <SalesSkeleton />
                    ) : filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          No hay ventas para este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr
                          key={sale.id}
                          onClick={() => selectSale(sale)}
                          className={`cursor-pointer transition-colors ${
                            selectedSale?.id === sale.id
                              ? 'bg-primary-50/70'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-5 py-4 font-bold text-slate-900">{sale.sale_number}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <UserRound className="w-4 h-4 text-slate-300" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {sale.member?.full_name || sale.customer_name || 'Invitado'}
                                </p>
                                <p className="text-xs capitalize text-slate-500">
                                  {sale.customer_type}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {dateTime(sale.sold_at)}
                          </td>
                          <td className="px-5 py-4 text-xs capitalize text-slate-500">
                            {sale.payment_method || '-'}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-slate-900">
                            {money(sale.total_amount)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={sale.status} />
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="space-y-5">
              <SaleDetail sale={selectedSale} isLoading={isDetailLoading} />
            </div>
          </div>
        </>
      ) : (
        <BalancesManager
          sales={filteredBalances}
          total={filteredBalanceTotal}
          search={balanceSearch}
          isLoading={isLoading}
          onSearchChange={setBalanceSearch}
          onAddPayment={openPaymentModal}
        />
      )}

      {paymentSale && (
        <PaymentModal
          sale={paymentSale}
          amount={paymentAmount}
          method={paymentMethod}
          isSubmitting={isPaymentSubmitting}
          onAmountChange={setPaymentAmount}
          onMethodChange={setPaymentMethod}
          onClose={closePaymentModal}
          onSubmit={submitPayment}
        />
      )}
    </div>
  )
}

function SalesFilters({
  search,
  preset,
  dateFrom,
  dateTo,
  onSearchChange,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: {
  search: string
  preset: DatePreset
  dateFrom: string
  dateTo: string
  onSearchChange: (value: string) => void
  onPresetChange: (preset: DatePreset) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar folio, cliente o estado..."
              className={`${inputClass} pl-9 w-full sm:w-72`}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <select
              value={preset}
              onChange={(event) => onPresetChange(event.target.value as DatePreset)}
              className={`${inputClass} pl-9 pr-8 appearance-none cursor-pointer w-full sm:w-auto`}
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="custom">Rango</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <DateInput label="Desde" value={dateFrom} max={dateTo} onChange={onDateFromChange} />
          <DateInput label="Hasta" value={dateTo} min={dateFrom} onChange={onDateToChange} />
        </div>
      </div>
    </div>
  )
}

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative block">
      <span className="absolute -top-2 left-3 bg-slate-50 px-1 text-[10px] font-bold text-slate-400">
        {label}
      </span>
      <CalendarDays className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} pl-9 cursor-pointer w-full sm:w-auto`}
      />
    </label>
  )
}

function MetricCard({
  title,
  value,
  icon,
  tone = 'primary',
}: {
  title: string
  value: string
  icon: React.ReactNode
  tone?: 'primary' | 'amber' | 'slate'
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : tone === 'slate'
        ? 'bg-slate-50 text-slate-600 border-slate-100'
        : 'bg-primary-50 text-primary-700 border-primary-100'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}
      >
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function SalesSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <tr key={item}>
          <td colSpan={6} className="px-5 py-3">
            <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  )
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function SaleDetail({ sale, isLoading }: { sale: PosSale | null; isLoading: boolean }) {
  if (!sale) {
    return (
      <aside className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-900">Selecciona una venta</p>
        <p className="mt-1 text-sm text-slate-500">Al pulsarla apareceran sus detalles aqui.</p>
      </aside>
    )
  }

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden xl:sticky xl:top-8">
      <div className="p-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">Detalle de venta</p>
            <h2 className="text-xl font-extrabold text-slate-900">{sale.sale_number}</h2>
          </div>
          <StatusBadge status={sale.status} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Clock3 className="w-4 h-4" />
          {dateTime(sale.sold_at)}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {isLoading ? (
          <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-xs font-bold text-slate-500">Cliente</p>
              <p className="font-bold text-slate-900">
                {sale.member?.full_name || sale.customer_name || 'Invitado'}
              </p>
              <p className="text-xs text-slate-500 capitalize">{sale.customer_type}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">Productos</p>
              {(sale.items || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} x {money(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{money(item.line_total)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <Row label="Total" value={money(sale.total_amount)} />
              <Row label="Paga con" value={money(sale.tendered_amount ?? sale.paid_amount)} />
              <Row label="Pagado" value={money(sale.paid_amount)} />
              <Row label="Cambio" value={money(sale.change_amount ?? 0)} tone="emerald" />
              <Row
                label="Saldo"
                value={money(sale.balance_due)}
                tone={sale.balance_due > 0 ? 'amber' : 'emerald'}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function BalancesManager({
  sales,
  total,
  search,
  isLoading,
  onSearchChange,
  onAddPayment,
}: {
  sales: PosSale[]
  total: number
  search: string
  isLoading: boolean
  onSearchChange: (value: string) => void
  onAddPayment: (sale: PosSale) => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          title="Ventas con saldo"
          value={String(sales.length)}
          icon={<ReceiptText className="w-5 h-5" />}
          tone="slate"
        />
        <MetricCard
          title="Saldo pendiente"
          value={money(total)}
          icon={<WalletCards className="w-5 h-5" />}
          tone={total > 0 ? 'amber' : 'slate'}
        />
        <MetricCard title="Accion" value="Abonos" icon={<BadgeDollarSign className="w-5 h-5" />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Manejo de saldos</h2>
            <p className="text-xs text-slate-500">
              Registra abonos de ventas parciales de miembros.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar folio o miembro..."
              className={`${inputClass} pl-9 w-full`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3">Folio</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Pagado</th>
                <th className="px-5 py-3 text-right">Saldo</th>
                <th className="px-5 py-3">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <SalesSkeleton />
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <WalletCards className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No hay saldos pendientes.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-bold text-slate-900">{sale.sale_number}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {sale.member?.full_name || sale.customer_name || 'Invitado'}
                      </p>
                      <p className="text-xs text-slate-500">{dateTime(sale.sold_at)}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {money(sale.total_amount)}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {money(sale.paid_amount)}
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-amber-700">
                      {money(sale.balance_due)}
                    </td>
                    <td className="px-5 py-4">
                      <Button size="sm" onClick={() => onAddPayment(sale)}>
                        Registrar abono
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function PaymentModal({
  sale,
  amount,
  method,
  isSubmitting,
  onAmountChange,
  onMethodChange,
  onClose,
  onSubmit,
}: {
  sale: PosSale
  amount: string
  method: PaymentMethod
  isSubmitting: boolean
  onAmountChange: (value: string) => void
  onMethodChange: (value: PaymentMethod) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const numericAmount = Number(amount) || 0
  const remaining = Math.max(0, sale.balance_due - numericAmount)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 p-5">
          <div>
            <p className="text-xs font-bold text-slate-500">Registrar abono</p>
            <h2 className="text-lg font-extrabold text-slate-900">{sale.sale_number}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {sale.member?.full_name || sale.customer_name || 'Invitado'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Saldo actual</p>
              <p className="mt-1 font-extrabold text-amber-700">{money(sale.balance_due)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Restante</p>
              <p className="mt-1 font-extrabold text-slate-900">{money(remaining)}</p>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">Monto del abono</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">Metodo de pago</span>
            <select
              value={method}
              onChange={(event) => onMethodChange(event.target.value as PaymentMethod)}
              className={`${inputClass} mt-1 w-full cursor-pointer`}
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="other">Otro</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 p-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} isLoading={isSubmitting}>
            Guardar abono
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber' ? 'text-amber-300' : tone === 'emerald' ? 'text-emerald-300' : 'text-white'
  return (
    <div className="flex justify-between text-sm text-slate-300 mt-2 first:mt-0">
      <span>{label}</span>
      <strong className={toneClass}>{value}</strong>
    </div>
  )
}

function StatusBadge({ status }: { status: PosSale['status'] }) {
  const label = status === 'partial' ? 'Saldo' : status === 'cancelled' ? 'Cancelada' : 'Completa'
  const className =
    status === 'partial'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : status === 'cancelled'
        ? 'bg-rose-50 text-rose-700 border-rose-100'
        : 'bg-emerald-50 text-emerald-700 border-emerald-100'

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  )
}

const inputClass =
  'block px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow placeholder:text-slate-400'
