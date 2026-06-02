import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  Edit2,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { Button } from '../../../components/ui'
import { memberService } from '../../members/services/memberService'
import type {
  Member,
  PaymentMethod,
  PosCartItem,
  PosProduct,
  PosSale,
} from '../../../types/database'
import { useAuth } from '../../../contexts/AuthContext'
import { posProductService } from '../services/posProductService'
import { posSaleService } from '../services/posSaleService'
import { ProductModal } from '../components/ProductModal'

type Tab = 'sale' | 'products' | 'balances'

const money = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

export function PosPage() {
  const { appUser } = useAuth()
  const [tab, setTab] = useState<Tab>('sale')
  const [products, setProducts] = useState<PosProduct[]>([])
  const [sales, setSales] = useState<PosSale[]>([])
  const [pendingSales, setPendingSales] = useState<PosSale[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cart, setCart] = useState<PosCartItem[]>([])
  const [search, setSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [guestName, setGuestName] = useState('Invitado')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paidAmount, setPaidAmount] = useState(0)
  const [saleMessage, setSaleMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<PosProduct | null>(null)

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart]
  )
  const balanceDue = Math.max(0, cartTotal - paidAmount)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [productData, recentSales, balances] = await Promise.all([
        posProductService.getAll(),
        posSaleService.getRecent(20),
        posSaleService.getPendingBalances(),
      ])
      setProducts(productData)
      setSales(recentSales)
      setPendingSales(balances)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el punto de venta.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  useEffect(() => {
    if (memberSearch.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([])
      return
    }

    memberService.searchMembers(memberSearch).then(setMembers).catch(console.error)
  }, [memberSearch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaidAmount(cartTotal)
  }, [cartTotal])

  const visibleProducts = products.filter((product) => {
    const term = search.toLowerCase()
    return (
      product.name.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    )
  })

  const addToCart = (product: PosProduct) => {
    if (!product.is_active) return
    if (product.track_inventory && product.stock_quantity <= 0) return

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      const currentQty = existing?.quantity || 0

      if (product.track_inventory && currentQty >= product.stock_quantity) return current

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }

      return [...current, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, nextQuantity: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item
          const capped = item.product.track_inventory
            ? Math.min(nextQuantity, item.product.stock_quantity)
            : nextQuantity
          return { ...item, quantity: capped }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const resetSale = () => {
    setCart([])
    setSelectedMember(null)
    setMemberSearch('')
    setGuestName('Invitado')
    setPaidAmount(0)
    setPaymentMethod('cash')
  }

  const completeSale = async () => {
    setError(null)
    setSaleMessage(null)
    setIsSubmitting(true)

    try {
      const sale = await posSaleService.createSale({
        customer_type: selectedMember ? 'member' : 'guest',
        member_id: selectedMember?.id || null,
        customer_name: selectedMember ? null : guestName,
        paid_amount: paidAmount,
        payment_method: paymentMethod,
        items: cart,
        sold_by: appUser?.id || null,
      })

      setSaleMessage(`Venta ${sale.sale_number} registrada correctamente.`)
      resetSale()
      await loadData()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo registrar la venta.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductSaved = async () => {
    await loadData()
  }

  const openCreateProduct = () => {
    setProductToEdit(null)
    setProductModalOpen(true)
  }

  const openEditProduct = (product: PosProduct) => {
    setProductToEdit(product)
    setProductModalOpen(true)
  }

  const addBalancePayment = async (sale: PosSale) => {
    const amount = Number(
      window.prompt(`Saldo pendiente: ${money(sale.balance_due)}. Ingresa abono:`)
    )
    if (!amount || amount <= 0) return

    try {
      await posSaleService.addPayment(sale, amount, 'cash', appUser?.id || null)
      await loadData()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo registrar el abono.'))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
          <p className="text-sm text-slate-500">
            Vende productos, controla inventario y gestiona saldos de miembros
          </p>
        </div>
        <Button onClick={openCreateProduct} icon={<Plus className="w-4 h-4" />}>
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <TabButton
          active={tab === 'sale'}
          onClick={() => setTab('sale')}
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Venta"
        />
        <TabButton
          active={tab === 'products'}
          onClick={() => setTab('products')}
          icon={<Boxes className="w-4 h-4" />}
          label="Productos"
        />
        <TabButton
          active={tab === 'balances'}
          onClick={() => setTab('balances')}
          icon={<BadgeDollarSign className="w-4 h-4" />}
          label="Saldos"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {saleMessage && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saleMessage}
        </div>
      )}

      {tab === 'sale' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
          <section className="space-y-4">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar producto, SKU, código o categoría..."
            />
            {isLoading ? (
              <SkeletonGrid />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-8 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Carrito</h2>
                <p className="text-xs text-slate-500">{cart.length} producto(s)</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">Agrega productos para iniciar</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400 m-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500">{money(item.product.sale_price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <QtyButton
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            icon={<Minus className="w-3 h-3" />}
                          />
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <QtyButton
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            icon={<Plus className="w-3 h-3" />}
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="ml-auto text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {money(item.product.sale_price * item.quantity)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <CustomerSelector
                  memberSearch={memberSearch}
                  setMemberSearch={setMemberSearch}
                  members={members}
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  guestName={guestName}
                  setGuestName={setGuestName}
                />

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Método</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className={inputClass}
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                      <option value="other">Otro</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Pago recibido</span>
                    <input
                      type="number"
                      min="0"
                      max={cartTotal}
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Total</span>
                    <strong className="text-slate-900">{money(cartTotal)}</strong>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Saldo restante</span>
                    <strong className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {money(balanceDue)}
                    </strong>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0}
                  isLoading={isSubmitting}
                  onClick={completeSale}
                >
                  Cobrar venta
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === 'products' && (
        <ProductsView
          products={visibleProducts}
          search={search}
          setSearch={setSearch}
          onEdit={openEditProduct}
          onToggle={async (product) => {
            await posProductService.toggleActive(product.id, !product.is_active)
            await loadData()
          }}
        />
      )}

      {tab === 'balances' && <BalancesView sales={pendingSales} onPay={addBalancePayment} />}

      {tab === 'sale' && sales.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">Ventas recientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {sales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-900">{sale.sale_number}</p>
                <p className="text-xs text-slate-500 truncate">
                  {sale.member?.full_name || sale.customer_name || 'Invitado'}
                </p>
                <p className="text-sm font-bold text-primary-700 mt-2">
                  {money(sale.total_amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductModal
        isOpen={productModalOpen}
        productToEdit={productToEdit}
        onClose={() => setProductModalOpen(false)}
        onSuccess={handleProductSaved}
      />
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: PosProduct; onAdd: () => void }) {
  const soldOut = product.track_inventory && product.stock_quantity <= 0

  return (
    <button
      onClick={onAdd}
      disabled={soldOut || !product.is_active}
      className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-primary-200 transition-all disabled:opacity-60 disabled:hover:shadow-none"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-8 h-8 text-slate-400 m-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{product.name}</p>
          <p className="text-xs text-slate-500 truncate">{product.category || 'Sin categoría'}</p>
          <p className="text-lg font-extrabold text-primary-700 mt-2">
            {money(product.sale_price)}
          </p>
          <p
            className={`text-xs mt-1 ${soldOut ? 'text-rose-600' : product.stock_quantity <= product.low_stock_threshold ? 'text-amber-600' : 'text-slate-500'}`}
          >
            {product.track_inventory
              ? `Stock: ${product.stock_quantity}`
              : 'Sin control de inventario'}
          </p>
        </div>
      </div>
    </button>
  )
}

function ProductsView({
  products,
  search,
  setSearch,
  onEdit,
  onToggle,
}: {
  products: PosProduct[]
  search: string
  setSearch: (value: string) => void
  onEdit: (product: PosProduct) => void
  onToggle: (product: PosProduct) => void
}) {
  return (
    <section className="space-y-4">
      <SearchBox value={search} onChange={setSearch} placeholder="Buscar productos..." />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_130px_120px_120px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
          <span>Producto</span>
          <span>Precio</span>
          <span>Inventario</span>
          <span className="text-right">Acciones</span>
        </div>
        {products.map((product) => (
          <div
            key={product.id}
            className="grid grid-cols-[1fr_130px_120px_120px] gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400 m-3" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {product.sku || product.category || 'Sin SKU'}
                </p>
              </div>
            </div>
            <span className="font-bold text-slate-900">{money(product.sale_price)}</span>
            <span
              className={
                product.stock_quantity <= product.low_stock_threshold
                  ? 'text-amber-700 font-semibold'
                  : 'text-slate-600'
              }
            >
              {product.track_inventory ? product.stock_quantity : 'Libre'}
            </span>
            <div className="flex justify-end gap-1">
              <button
                onClick={() => onEdit(product)}
                className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggle(product)}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
              >
                {product.is_active ? (
                  <Archive className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BalancesView({ sales, onPay }: { sales: PosSale[]; onPay: (sale: PosSale) => void }) {
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <BadgeDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900">Sin saldos pendientes</h3>
        <p className="text-sm text-slate-500">
          Cuando un miembro deje una venta parcial aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white rounded-2xl border border-slate-200 p-5">
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
          <Button className="w-full" onClick={() => onPay(sale)}>
            Registrar abono
          </Button>
        </div>
      ))}
    </div>
  )
}

function CustomerSelector(props: {
  memberSearch: string
  setMemberSearch: (value: string) => void
  members: Member[]
  selectedMember: Member | null
  setSelectedMember: (member: Member | null) => void
  guestName: string
  setGuestName: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      {props.selectedMember ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <UserRound className="w-5 h-5 text-primary-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {props.selectedMember.full_name}
            </p>
            <p className="text-xs text-slate-500">{props.selectedMember.member_code}</p>
          </div>
          <button
            onClick={() => props.setSelectedMember(null)}
            className="text-xs font-bold text-primary-700"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Buscar miembro</span>
            <input
              value={props.memberSearch}
              onChange={(e) => props.setMemberSearch(e.target.value)}
              className={inputClass}
              placeholder="Nombre, usuario o código"
            />
          </label>
          {props.members.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {props.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => props.setSelectedMember(member)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{member.full_name}</span>
                </button>
              ))}
            </div>
          )}
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Invitado</span>
            <input
              value={props.guestName}
              onChange={(e) => props.setGuestName(e.target.value)}
              className={inputClass}
            />
          </label>
        </>
      )}
    </div>
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
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${active ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
    >
      {icon}
      {label}
    </button>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative max-w-xl">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-10`}
      />
    </div>
  )
}

function QtyButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
    >
      {icon}
    </button>
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="bg-white rounded-2xl border border-slate-100 h-28 animate-pulse"
        />
      ))}
    </div>
  )
}

const inputClass =
  'block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
