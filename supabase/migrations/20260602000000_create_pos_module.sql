-- ============================================================
-- POS module: products, sales, sale items and sale payments
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_products_name ON pos_products(name);
CREATE INDEX IF NOT EXISTS idx_pos_products_category ON pos_products(category);
CREATE INDEX IF NOT EXISTS idx_pos_products_barcode ON pos_products(barcode);
CREATE INDEX IF NOT EXISTS idx_pos_products_active ON pos_products(is_active);

CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_type TEXT NOT NULL DEFAULT 'guest' CHECK (customer_type IN ('member', 'guest')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  notes TEXT,
  sold_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pos_sales_member_customer_check CHECK (
    (customer_type = 'member' AND member_id IS NOT NULL) OR
    (customer_type = 'guest' AND member_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_member ON pos_sales(member_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_status ON pos_sales(status);
CREATE INDEX IF NOT EXISTS idx_pos_sales_sold_at ON pos_sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_balance ON pos_sales(balance_due) WHERE balance_due > 0;

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES pos_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale ON pos_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_product ON pos_sale_items(product_id);

CREATE TABLE IF NOT EXISTS pos_sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  received_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_sale ON pos_sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_paid_at ON pos_sale_payments(paid_at DESC);

CREATE OR REPLACE FUNCTION generate_pos_sale_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM pos_sales
  WHERE sale_number ~ '^POS-[0-9]+$';

  RETURN 'POS-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_pos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pos_products_updated_at ON pos_products;
CREATE TRIGGER set_pos_products_updated_at
  BEFORE UPDATE ON pos_products
  FOR EACH ROW EXECUTE FUNCTION update_pos_updated_at();

DROP TRIGGER IF EXISTS set_pos_sales_updated_at ON pos_sales;
CREATE TRIGGER set_pos_sales_updated_at
  BEFORE UPDATE ON pos_sales
  FOR EACH ROW EXECUTE FUNCTION update_pos_updated_at();

ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read POS products"
  ON pos_products FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage POS products"
  ON pos_products FOR ALL
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can read POS sales"
  ON pos_sales FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage POS sales"
  ON pos_sales FOR ALL
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can read POS sale items"
  ON pos_sale_items FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage POS sale items"
  ON pos_sale_items FOR ALL
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can read POS sale payments"
  ON pos_sale_payments FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage POS sale payments"
  ON pos_sale_payments FOR ALL
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public product image access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated product image upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated product image update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated product image delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
