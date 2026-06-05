import { supabase } from '../../../lib/supabase/client'
import type { PosProduct, PosProductFormData } from '../../../types/database'

export const posProductService = {
  async getAll(search?: string): Promise<PosProduct[]> {
    let query = supabase.from('pos_products').select('*').order('name')

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `name.ilike.${term},sku.ilike.${term},barcode.ilike.${term},category.ilike.${term}`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data as PosProduct[]
  },

  async getActive(search?: string): Promise<PosProduct[]> {
    let query = supabase.from('pos_products').select('*').eq('is_active', true).order('name')

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `name.ilike.${term},sku.ilike.${term},barcode.ilike.${term},category.ilike.${term}`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data as PosProduct[]
  },

  async create(product: PosProductFormData): Promise<PosProduct> {
    const payload = normalizeProduct(product)
    const { data, error } = await supabase.from('pos_products').insert(payload).select().single()
    if (error) throw error
    return data as PosProduct
  },

  async update(id: string, product: Partial<PosProductFormData>): Promise<PosProduct> {
    const payload = normalizeProduct(product)
    const { data, error } = await supabase
      .from('pos_products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as PosProduct
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('pos_products')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },
}

function normalizeProduct(product: Partial<PosProductFormData>) {
  return {
    ...product,
    sku: product.sku?.trim() || null,
    barcode: product.barcode?.trim() || null,
    description: product.description?.trim() || null,
    category: product.category?.trim() || null,
    image_url: product.image_url?.trim() || null,
  }
}
