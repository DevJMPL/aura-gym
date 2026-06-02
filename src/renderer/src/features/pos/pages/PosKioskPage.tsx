import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { Button } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import { memberService } from '../../members/services/memberService'
import { posProductService } from '../services/posProductService'
import { posSaleService } from '../services/posSaleService'
import { posCategoryService } from '../services/posCategoryService'
import type { Member, PaymentMethod, PosCartItem, PosProduct } from '../../../types/database'

const money = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

export function PosKioskPage() {
  const { appUser } = useAuth()
  const [products, setProducts] = useState<PosProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cart, setCart] = useState<PosCartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [guestName, setGuestName] = useState('Invitado')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paidAmount, setPaidAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOverCart, setIsDragOverCart] = useState(false)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [dropPulse, setDropPulse] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart]
  )
  const balanceDue = Math.max(0, cartTotal - paidAmount)
  const changeDue = Math.max(0, paidAmount - cartTotal)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [productData, categoryData] = await Promise.all([
        posProductService.getActive(),
        posCategoryService.getAll(),
      ])
      setProducts(productData)
      setCategories(categoryData)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el kiosko de venta.')
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
    setPaidAmount(Math.ceil(cartTotal))
  }, [cartTotal])

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const category = selectedCategory.trim().toLowerCase()

    return products.filter(
      (product) =>
        (!category || product.category?.toLowerCase() === category) &&
        (!term ||
          [product.name, product.category, product.sku, product.barcode]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(term)))
    )
  }, [products, search, selectedCategory])

  const addToCart = (product: PosProduct) => {
    if (!product.is_active || (product.track_inventory && product.stock_quantity <= 0)) return

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

    setLastAddedId(product.id)
    setDropPulse(true)
    window.setTimeout(() => setLastAddedId(null), 700)
    window.setTimeout(() => setDropPulse(false), 450)
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

  const onDropToCart = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOverCart(false)
    const productId = event.dataTransfer.getData('text/plain')
    const product = products.find((item) => item.id === productId)
    if (product) addToCart(product)
  }

  const resetSale = () => {
    setCart([])
    setSelectedMember(null)
    setMemberSearch('')
    setGuestName('Invitado')
    setPaymentMethod('cash')
    setPaidAmount(0)
  }

  const completeSale = async () => {
    setError(null)
    setMessage(null)
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

      setMessage(`Venta ${sale.sale_number} registrada.`)
      resetSale()
      await loadData()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo registrar la venta.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[1fr_410px] gap-6 items-start">
      <section className="space-y-4 min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Punto de venta</h2>
            <p className="text-sm text-slate-500">
              Selecciona productos y cobra desde el carrito lateral.
            </p>
          </div>
          <p className="hidden text-xs font-semibold text-slate-400 sm:block">
            Arrastrar y soltar disponible
          </p>
        </div>

        <KioskToolbar
          search={search}
          selectedCategory={selectedCategory}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={setSelectedCategory}
        />

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-40 rounded-2xl bg-white border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {visibleProducts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  No hay productos para vender
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Crea productos activos en administracion para que aparezcan en este kiosko.
                </p>
                <Link
                  to="/pos/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                >
                  Administrar productos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleProducts.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    isLastAdded={lastAddedId === product.id}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <aside
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOverCart(true)
        }}
        onDragLeave={() => setIsDragOverCart(false)}
        onDrop={onDropToCart}
        className={`bg-white rounded-3xl border shadow-sm sticky top-8 overflow-hidden transition-all duration-300 ${
          isDragOverCart || dropPulse
            ? 'border-primary-300 ring-4 ring-primary-100 scale-[1.01] shadow-lg'
            : 'border-slate-200'
        }`}
      >
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Carrito</h2>
            <p className="text-xs text-slate-500">{cart.length} producto(s)</p>
          </div>
          <div className="relative">
            {dropPulse && (
              <span className="absolute inset-0 rounded-full bg-primary-200 animate-ping" />
            )}
            <div className="relative w-11 h-11 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div
            className={`rounded-2xl border border-dashed p-3 transition-colors ${isDragOverCart ? 'border-primary-300 bg-primary-50' : 'border-transparent'}`}
          >
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm font-medium">Suelta productos aqui</p>
                  <p className="text-xs">Tambien puedes tocar una tarjeta</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className={`flex gap-3 rounded-2xl p-2 transition-all duration-300 ${
                      lastAddedId === item.product.id ? 'bg-primary-50 scale-[1.02]' : 'bg-white'
                    }`}
                  >
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
                          className="ml-auto cursor-pointer text-slate-400 transition-colors hover:text-rose-600"
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
          </div>

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
              <span className="text-xs font-semibold text-slate-500">Metodo</span>
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
              <span className="text-xs font-semibold text-slate-500">Paga con</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <QuickPayButton label="Exacto" onClick={() => setPaidAmount(Math.ceil(cartTotal))} />
            {[50, 100, 200, 500].map((amount) => (
              <QuickPayButton
                key={amount}
                label={`+$${amount}`}
                onClick={() => setPaidAmount((current) => current + amount)}
              />
            ))}
            {[100, 200, 500].map((amount) => (
              <QuickPayButton
                key={`set-${amount}`}
                label={`$${amount}`}
                onClick={() => setPaidAmount(amount)}
              />
            ))}
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-inner">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Total</span>
              <strong className="text-white">{money(cartTotal)}</strong>
            </div>
            <div className="flex justify-between text-sm text-slate-300 mt-2">
              <span>Paga con</span>
              <strong className="text-white">{money(paidAmount)}</strong>
            </div>
            <div className="flex justify-between text-sm text-slate-300 mt-2">
              <span>Cambio</span>
              <strong className="text-emerald-300">{money(changeDue)}</strong>
            </div>
            <div className="flex justify-between text-sm text-slate-300 mt-2">
              <span>Saldo restante</span>
              <strong className={balanceDue > 0 ? 'text-amber-300' : 'text-emerald-300'}>
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
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </aside>
    </div>
  )
}

function KioskToolbar({
  search,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}: {
  search: string
  selectedCategory: string
  categories: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
}) {
  const clearSearch = () => {
    onSearchChange('')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar producto, SKU o codigo..."
            aria-label="Buscar productos"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              aria-label="Limpiar busqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
          <CategoryChip
            label="Todos"
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            active={!selectedCategory}
            onClick={() => onCategoryChange('')}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              icon={<Tag className="w-3.5 h-3.5" />}
              active={selectedCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
          {categories.length === 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              Sin categorias
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-0.5 pb-1.5 pt-1 text-xs font-extrabold transition-colors duration-200 ${
        active
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-700'
      }`}
    >
      <span
        className={`transition-colors ${
          active ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-500'
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}

function ProductTile({
  product,
  isLastAdded,
  onAdd,
}: {
  product: PosProduct
  isLastAdded: boolean
  onAdd: () => void
}) {
  const soldOut = product.track_inventory && product.stock_quantity <= 0

  return (
    <button
      type="button"
      draggable={!soldOut}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', product.id)
        event.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={onAdd}
      disabled={soldOut}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${
        isLastAdded ? 'border-primary-300 ring-4 ring-primary-100 scale-[1.02]' : 'border-slate-200'
      }`}
    >
      <div className="relative aspect-[5/3] bg-slate-50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
          {product.track_inventory ? product.stock_quantity : 'Libre'}
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">{product.name}</p>
            <p className="text-xs text-slate-500 truncate">{product.category || 'Sin categoria'}</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-extrabold text-slate-800 transition-colors group-hover:bg-primary-50 group-hover:text-primary-700">
            {money(product.sale_price)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-xs font-bold ${soldOut ? 'text-rose-600' : product.stock_quantity <= product.low_stock_threshold ? 'text-amber-600' : 'text-slate-500'}`}
          >
            {product.track_inventory ? `Stock ${product.stock_quantity}` : 'Inventario libre'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-700">
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </span>
        </div>
      </div>
      {isLastAdded && (
        <div className="absolute right-3 bottom-3 rounded-full bg-emerald-500 p-2 text-white shadow-lg">
          <Check className="w-4 h-4" />
        </div>
      )}
    </button>
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
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-50 border border-primary-100">
          <UserRound className="w-5 h-5 text-primary-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {props.selectedMember.full_name}
            </p>
            <p className="text-xs text-slate-500">{props.selectedMember.member_code}</p>
          </div>
          <button
            onClick={() => props.setSelectedMember(null)}
            className="cursor-pointer text-xs font-bold text-primary-700 transition-colors hover:text-primary-900"
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
              placeholder="Nombre, usuario o codigo"
            />
          </label>
          {props.members.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {props.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => props.setSelectedMember(member)}
                  className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
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

function QtyButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 cursor-pointer rounded-lg border border-slate-200 text-slate-500 transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-center"
    >
      {icon}
    </button>
  )
}

function QuickPayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm"
    >
      {label}
    </button>
  )
}

const inputClass =
  'block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
