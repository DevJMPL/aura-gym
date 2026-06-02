import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { PosProduct } from '../../../types/database'
import { posProductService } from '../services/posProductService'
import { ProductModal } from '../components/ProductModal'
import { ProductFilters } from '../components/ProductFilters'
import { ProductPagination } from '../components/ProductPagination'
import { ProductStats } from '../components/ProductStats'
import { ProductTable } from '../components/ProductTable'
import { posCategoryService } from '../services/posCategoryService'

export function PosProductsPage() {
  const [products, setProducts] = useState<PosProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productToEdit, setProductToEdit] = useState<PosProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [productData, categoryData] = await Promise.all([
        posProductService.getAll(),
        posCategoryService.getAll(),
      ])
      setProducts(productData)
      setCategories(categoryData)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los productos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search, category, pageSize])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [product.name, product.sku, product.barcode, product.category]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(term))

      const matchesCategory = !category || product.category === category

      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const stats = useMemo(() => {
    const lowStock = products.filter(
      (product) => product.track_inventory && product.stock_quantity <= product.low_stock_threshold
    ).length

    return {
      total: products.length,
      active: products.filter((product) => product.is_active).length,
      lowStock,
    }
  }, [products])

  const openCreate = () => {
    setProductToEdit(null)
    setIsModalOpen(true)
  }

  const openEdit = (product: PosProduct) => {
    setProductToEdit(product)
    setIsModalOpen(true)
  }

  const toggleProduct = async (product: PosProduct) => {
    await posProductService.toggleActive(product.id, !product.is_active)
    await loadProducts()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500">
            Administra catálogo, precios, imágenes e inventario para el punto de venta.
          </p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />} className="cursor-pointer">
          Nuevo producto
        </Button>
      </div>

      <ProductStats total={stats.total} active={stats.active} lowStock={stats.lowStock} />

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <ProductTable
        products={paginatedProducts}
        isLoading={isLoading}
        search={search || category}
        filters={
          <ProductFilters
            search={search}
            category={category}
            categories={categories}
            pageSize={pageSize}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onPageSizeChange={setPageSize}
          />
        }
        pagination={
          <ProductPagination
            page={currentPage}
            pageCount={pageCount}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        }
        onCreate={openCreate}
        onEdit={openEdit}
        onToggle={toggleProduct}
      />

      <ProductModal
        isOpen={isModalOpen}
        productToEdit={productToEdit}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProducts}
      />
    </div>
  )
}
