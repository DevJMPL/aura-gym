import { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, Search } from 'lucide-react'
import { Button } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import type { PosSale } from '../../../types/database'
import { posSaleService } from '../services/posSaleService'

const money = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

export function PosBalancesPage() {
  const { appUser } = useAuth()
  const [sales, setSales] = useState<PosSale[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBalances = async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSales(await posSaleService.getPendingBalances())
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los saldos pendientes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBalances()
  }, [])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sales

    return sales.filter((sale) =>
      [sale.sale_number, sale.member?.full_name, sale.customer_name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    )
  }, [sales, search])

  const totals = useMemo(
    () => ({
      count: sales.length,
      balance: sales.reduce((sum, sale) => sum + sale.balance_due, 0),
    }),
    [sales]
  )

  const addPayment = async (sale: PosSale) => {
    const amount = Number(
      window.prompt(`Saldo pendiente: ${money(sale.balance_due)}. Ingresa abono:`)
    )
    if (!amount || amount <= 0) return

    try {
      await posSaleService.addPayment(sale, amount, 'cash', appUser?.id || null)
      await loadBalances()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saldos</h1>
        <p className="text-sm text-slate-500">
          Consulta ventas parciales de miembros y registra abonos pendientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Ventas con saldo</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totals.count}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-amber-700">Saldo total pendiente</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-800">{money(totals.balance)}</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio o miembro..."
          className={`${inputClass} pl-10`}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 rounded-2xl border border-slate-100 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BadgeDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900">Sin saldos pendientes</h3>
          <p className="text-sm text-slate-500">
            Cuando un miembro deje una venta parcial aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{sale.sale_number}</p>
                  <p className="text-sm text-slate-500">{sale.member?.full_name || 'Miembro'}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                  Pendiente
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 my-5">
                <Metric label="Total" value={money(sale.total_amount)} />
                <Metric label="Saldo" value={money(sale.balance_due)} emphasis />
              </div>
              <Button className="w-full" onClick={() => addPayment(sale)}>
                Registrar abono
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-extrabold ${emphasis ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

const inputClass =
  'block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400'
