import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User as UserIcon,
  PackageSearch,
  AlertCircle,
} from 'lucide-react'
import { Button, Input, Modal, Select } from '../../../components/ui'
import { useProducts } from '../hooks/useProducts'
import { posService, CreateSalePayload } from '../services/posService'
import { memberService } from '../../members/services/memberService'
import { useTenant } from '../../../contexts/TenantContext'
import type { Product, Member } from '../../../types/database'
import { formatCurrency } from '../../../utils/formatters'

interface CartItem extends Product {
  cartQuantity: number
}

export function POSPage() {
  const { activeTenantId } = useTenant()
  const { products, isLoading } = useProducts()

  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Search logic
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.filter((p) => p.is_active)

    const term = searchTerm.toLowerCase()
    return products.filter(
      (p) =>
        p.is_active &&
        (p.name.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase() === term ||
          p.sku?.toLowerCase().includes(term))
    )
  }, [products, searchTerm])

  // Barcode quick scan effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing but not focused on input, focus it
      // Especially useful for barcode scanners which type very fast
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        // Enforce stock limit unless allow_negative_stock is true
        if (!product.allow_negative_stock && existing.cartQuantity >= product.current_stock) {
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      }
      if (!product.allow_negative_stock && product.current_stock <= 0) {
        return prev
      }
      return [...prev, { ...product, cartQuantity: 1 }]
    })
  }

  // Auto-add product if exactly one matches the barcode exactly (scanner behavior)
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const exactMatch = products.find((p) => p.barcode === searchTerm && p.is_active)
      if (exactMatch) {
        addToCart(exactMatch)
        setSearchTerm('')
      }
    }
  }, [searchTerm, products])

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQ = item.cartQuantity + delta
          if (newQ <= 0) return item // handled by remove
          if (!item.allow_negative_stock && newQ > item.current_stock) return item
          return { ...item, cartQuantity: newQ }
        }
        return item
      })
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.sale_price * item.cartQuantity, 0)
  const total = subtotal // Add discounts here if needed

  // Checkout State
  const [checkoutMemberQuery, setCheckoutMemberQuery] = useState('')
  const [checkoutMembers, setCheckoutMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const [checkoutData, setCheckoutData] = useState({
    amountPaid: total,
    paymentMethod: 'cash',
    notes: '',
    externalName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleOpenCheckout = () => {
    setCheckoutData((prev) => ({ ...prev, amountPaid: total }))
    setIsCheckoutModalOpen(true)
  }

  const handleMemberSearch = async (query: string) => {
    setCheckoutMemberQuery(query)
    if (query.length < 3) {
      setCheckoutMembers([])
      return
    }
    if (activeTenantId) {
      const results = await memberService.searchMembers(activeTenantId, query)
      setCheckoutMembers(results)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTenantId || cart.length === 0) return

    if (checkoutData.amountPaid > total) {
      setCheckoutError('El monto pagado no puede ser mayor al total.')
      return
    }

    if (total - checkoutData.amountPaid > 0 && !selectedMember) {
      setCheckoutError('Para ventas con adeudo, es obligatorio seleccionar un miembro registrado.')
      return
    }

    setIsSubmitting(true)
    setCheckoutError(null)

    const payload: CreateSalePayload = {
      tenant_id: activeTenantId,
      member_id: selectedMember?.id,
      external_customer_name: !selectedMember ? checkoutData.externalName : undefined,
      subtotal,
      discount_total: 0,
      total,
      amount_paid: checkoutData.amountPaid,
      payment_method: checkoutData.paymentMethod,
      notes: checkoutData.notes,
      items: cart.map((item) => ({
        product_id: item.id,
        product_name_snapshot: item.name,
        quantity: item.cartQuantity,
        unit_price: item.sale_price,
        subtotal: item.sale_price * item.cartQuantity,
      })),
    }

    try {
      await posService.createSale(payload)
      // Reset POS
      setCart([])
      setIsCheckoutModalOpen(false)
      setSelectedMember(null)
      setCheckoutMemberQuery('')
      setCheckoutData({ amountPaid: 0, paymentMethod: 'cash', notes: '', externalName: '' })
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al procesar la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] -mx-4 -mb-8 overflow-hidden bg-slate-50">
      {/* Products Grid (Left Side) */}
      <div className="flex-1 flex flex-col p-6 border-r border-slate-200">
        <div className="mb-6">
          <Input
            ref={searchInputRef}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Buscar por nombre o escanear código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <PackageSearch className="w-12 h-12 mb-4 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const stockWarning = product.current_stock <= product.minimum_stock
                const outOfStock = product.current_stock <= 0 && !product.allow_negative_stock

                return (
                  <button
                    key={product.id}
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className={`flex flex-col items-start p-4 bg-white rounded-xl border text-left transition-all duration-200 min-h-[100px]
                      ${outOfStock ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md cursor-pointer active:scale-95'}`}
                  >
                    <div className="w-full flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 flex-1 pr-2">
                        {product.name}
                      </h3>
                      <span className="font-extrabold text-emerald-600 shrink-0">
                        {formatCurrency(product.sale_price)}
                      </span>
                    </div>
                    <div className="mt-auto pt-2 w-full flex justify-between items-center text-xs">
                      <span
                        className={`px-2 py-1 rounded-md font-medium ${
                          outOfStock
                            ? 'bg-red-50 text-red-700'
                            : stockWarning
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Stock: {product.current_stock}
                      </span>
                      {product.barcode && (
                        <span
                          className="text-slate-400 font-mono text-[10px] truncate max-w-[100px]"
                          title={product.barcode}
                        >
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart (Right Side) */}
      <div className="w-96 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900">Ticket de Venta</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 items-start p-3 rounded-xl border border-slate-100 bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-600 font-bold text-sm">
                      {formatCurrency(item.sale_price)}
                    </span>
                    <span className="text-slate-400 text-xs">x {item.cartQuantity}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.sale_price * item.cartQuantity)}
                  </span>
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-700">
                      {item.cartQuantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total a Pagar</span>
            <span className="text-3xl font-black text-slate-900">{formatCurrency(total)}</span>
          </div>

          <Button
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-200"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
          >
            Cobrar
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Finalizar Venta"
      >
        <form onSubmit={handleCheckout} className="space-y-6 mt-4">
          {checkoutError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{checkoutError}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
            <span className="font-medium text-slate-600">Total de Venta</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cliente (Opcional)
            </h3>

            {!selectedMember ? (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    icon={<UserIcon className="w-4 h-4 text-slate-400" />}
                    placeholder="Buscar miembro registrado..."
                    value={checkoutMemberQuery}
                    onChange={(e) => handleMemberSearch(e.target.value)}
                  />
                  {checkoutMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-48 overflow-y-auto">
                      {checkoutMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(m)
                            setCheckoutMembers([])
                            setCheckoutMemberQuery('')
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                            {m.full_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900">{m.full_name}</div>
                            <div className="text-xs text-slate-500">{m.member_code}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs text-slate-400 font-medium">O</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <Input
                  placeholder="Nombre de cliente público (opcional)"
                  value={checkoutData.externalName}
                  onChange={(e) =>
                    setCheckoutData((prev) => ({ ...prev, externalName: e.target.value }))
                  }
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold shadow-sm">
                    {selectedMember.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {selectedMember.full_name}
                    </div>
                    <div className="text-xs text-primary-600 font-medium">Miembro Activo</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 px-2"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pago</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Monto Pagado"
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={checkoutData.amountPaid === 0 ? '' : checkoutData.amountPaid}
                onChange={(e) =>
                  setCheckoutData((prev) => ({
                    ...prev,
                    amountPaid: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
              <Select
                label="Método de Pago"
                value={checkoutData.paymentMethod}
                onChange={(e) =>
                  setCheckoutData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                }
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'card', label: 'Tarjeta' },
                  { value: 'transfer', label: 'Transferencia' },
                  { value: 'other', label: 'Otro' },
                ]}
              />
            </div>

            {total - checkoutData.amountPaid > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-800">Saldo Pendiente (Adeudo)</span>
                  <span className="font-black text-amber-700">
                    {formatCurrency(total - checkoutData.amountPaid)}
                  </span>
                </div>
                {!selectedMember && (
                  <span className="text-xs font-medium text-red-600 mt-1">
                    * Debes seleccionar un miembro arriba para poder registrar una venta con adeudo.
                  </span>
                )}
              </div>
            )}

            <Input
              label="Notas (Opcional)"
              value={checkoutData.notes}
              onChange={(e) => setCheckoutData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Detalles adicionales sobre la venta..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCheckoutModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirmar Venta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
