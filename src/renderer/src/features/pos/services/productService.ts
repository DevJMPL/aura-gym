import { supabase } from '../../../lib/supabase/client'
import type { Product, ProductCategory } from '../../../types/database'

export const productService = {
  async getCategories(tenantId: string) {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (error) throw error
    return data as ProductCategory[]
  },

  async createCategory(tenantId: string, category: Partial<ProductCategory>) {
    const { data, error } = await supabase
      .from('product_categories')
      .insert({ ...category, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data as ProductCategory
  },

  async updateCategory(categoryId: string, updates: Partial<ProductCategory>) {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error
    return data as ProductCategory
  },

  async getProducts(tenantId: string, categoryId?: string) {
    let query = supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('tenant_id', tenantId)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.order('name')

    if (error) throw error
    return data as Product[]
  },

  async createProduct(tenantId: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, tenant_id: tenantId })
      .select('*, category:product_categories(*)')
      .single()

    if (error) throw error
    return data as Product
  },

  async updateProduct(productId: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select('*, category:product_categories(*)')
      .single()

    if (error) throw error
    return data as Product
  },

  async toggleProductStatus(productId: string, isActive: boolean) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)

    if (error) throw error
  },

  async searchProducts(tenantId: string, searchTerm: string) {
    // Search by name, sku or barcode
    const { data, error } = await supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.eq.${searchTerm}`)
      .order('name')
      .limit(20)

    if (error) throw error
    return data as Product[]
  },
}
