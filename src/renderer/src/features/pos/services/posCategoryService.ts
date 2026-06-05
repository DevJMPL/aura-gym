import { supabase } from '../../../lib/supabase/client'
import type { PosProductCategory } from '../../../types/database'

export const posCategoryService = {
  async getAll(): Promise<string[]> {
    const { data, error } = await supabase
      .from('pos_product_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return (data as PosProductCategory[]).map((category) => category.name)
  },

  async create(name: string): Promise<string> {
    const cleanName = name.trim()
    if (!cleanName) throw new Error('Escribe el nombre de la categoría.')

    const { data, error } = await supabase
      .from('pos_product_categories')
      .insert({ name: cleanName })
      .select()
      .single()

    if (error) throw error
    return (data as PosProductCategory).name
  },
}
