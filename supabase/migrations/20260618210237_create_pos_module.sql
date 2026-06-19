-- ============================================================
-- Migration: Point of Sale (POS) Module
-- ============================================================

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_id ON product_categories(tenant_id);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  unit TEXT DEFAULT 'piece',
  sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
  purchase_cost NUMERIC(10, 2) DEFAULT 0 CHECK (purchase_cost >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  allow_negative_stock BOOLEAN DEFAULT false,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 3. Sales Header
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_number SERIAL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  external_customer_name TEXT,
  external_customer_phone TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partially_paid', 'pending', 'cancelled')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_member_id ON sales(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- 4. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- 5. Sale Payments
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mixed', 'other')),
  notes TEXT,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);

-- 6. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('initial_stock', 'purchase', 'sale', 'adjustment_in', 'adjustment_out', 'return', 'cancellation')),
  quantity INTEGER NOT NULL, -- positive for IN, negative for OUT
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  related_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);

-- ============================================================
-- Triggers for updated_at
-- ============================================================
CREATE TRIGGER set_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Product Categories
CREATE POLICY "Users can read product_categories" ON product_categories FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Admins can manage product_categories" ON product_categories FOR ALL USING (check_tenant_access(tenant_id, 'ADMIN'));

-- Products
CREATE POLICY "Users can read products" ON products FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (check_tenant_access(tenant_id, 'ADMIN'));

-- Sales
CREATE POLICY "Users can read sales" ON sales FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can manage sales" ON sales FOR ALL USING (check_tenant_access(tenant_id));

-- Sale Items (Inherit from sales via simple subquery, or we could just add tenant_id to sale_items. Since we didn't add tenant_id to sale_items, we check sales table)
CREATE POLICY "Users can read sale_items" ON sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND check_tenant_access(sales.tenant_id))
);
CREATE POLICY "Users can manage sale_items" ON sale_items FOR ALL USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND check_tenant_access(sales.tenant_id))
);

-- Sale Payments
CREATE POLICY "Users can read sale_payments" ON sale_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_payments.sale_id AND check_tenant_access(sales.tenant_id))
);
CREATE POLICY "Users can manage sale_payments" ON sale_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_payments.sale_id AND check_tenant_access(sales.tenant_id))
);

-- Inventory Movements
CREATE POLICY "Users can read inventory_movements" ON inventory_movements FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Admins can manage inventory_movements" ON inventory_movements FOR ALL USING (check_tenant_access(tenant_id, 'ADMIN'));
-- We allow any staff to CREATE an inventory movement if it's tied to a sale (but the RPC bypasses RLS for the exact insertions if declared SECURITY DEFINER)
-- We will use SECURITY DEFINER for our RPC to bypass RLS complexity inside the transaction.

-- ============================================================
-- RPC Functions for Atomicity
-- ============================================================

-- Function to create a sale atomically
-- Payload is a JSON object with:
-- {
--   "tenant_id": "uuid",
--   "member_id": "uuid",
--   "external_customer_name": "text",
--   "external_customer_phone": "text",
--   "subtotal": 100,
--   "discount_total": 0,
--   "total": 100,
--   "amount_paid": 100,
--   "payment_method": "cash",
--   "due_date": "timestamp",
--   "notes": "text",
--   "items": [
--     { "product_id": "uuid", "product_name_snapshot": "Product 1", "quantity": 1, "unit_price": 100, "subtotal": 100 }
--   ]
-- }
CREATE OR REPLACE FUNCTION create_pos_sale(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id UUID;
  v_tenant_id UUID;
  v_member_id UUID;
  v_total NUMERIC;
  v_amount_paid NUMERIC;
  v_balance_due NUMERIC;
  v_payment_status TEXT;
  v_user_id UUID;
  
  item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
  v_allow_negative BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := get_auth_user_id();

  -- Extract basic info
  v_tenant_id := (payload->>'tenant_id')::UUID;
  v_member_id := (payload->>'member_id')::UUID;
  v_total := (payload->>'total')::NUMERIC;
  v_amount_paid := (payload->>'amount_paid')::NUMERIC;
  
  v_balance_due := v_total - v_amount_paid;
  
  IF v_balance_due < 0 THEN
    v_balance_due := 0;
  END IF;

  IF v_amount_paid >= v_total THEN
    v_payment_status := 'paid';
  ELSIF v_amount_paid > 0 THEN
    v_payment_status := 'partially_paid';
  ELSE
    v_payment_status := 'pending';
  END IF;

  -- 1. Insert Sales Header
  INSERT INTO sales (
    tenant_id, member_id, external_customer_name, external_customer_phone,
    subtotal, discount_total, total, amount_paid, balance_due, payment_status,
    due_date, notes, created_by
  ) VALUES (
    v_tenant_id,
    v_member_id,
    payload->>'external_customer_name',
    payload->>'external_customer_phone',
    (payload->>'subtotal')::NUMERIC,
    (payload->>'discount_total')::NUMERIC,
    v_total,
    v_amount_paid,
    v_balance_due,
    v_payment_status,
    (payload->>'due_date')::TIMESTAMPTZ,
    payload->>'notes',
    v_user_id
  ) RETURNING id INTO v_sale_id;

  -- 2. Insert Initial Payment (if any)
  IF v_amount_paid > 0 THEN
    INSERT INTO sale_payments (
      sale_id, amount, payment_method, notes, created_by
    ) VALUES (
      v_sale_id,
      v_amount_paid,
      payload->>'payment_method',
      'Pago inicial',
      v_user_id
    );
  END IF;

  -- 3. Loop through items, insert them, update stock, and insert movements
  FOR item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_quantity := (item->>'quantity')::INTEGER;

    -- Insert sale item
    INSERT INTO sale_items (
      sale_id, product_id, product_name_snapshot, quantity, unit_price, subtotal
    ) VALUES (
      v_sale_id,
      v_product_id,
      item->>'product_name_snapshot',
      v_quantity,
      (item->>'unit_price')::NUMERIC,
      (item->>'subtotal')::NUMERIC
    );

    -- Get current stock
    SELECT current_stock, allow_negative_stock 
    INTO v_current_stock, v_allow_negative 
    FROM products 
    WHERE id = v_product_id 
    FOR UPDATE; -- lock the row

    -- Check stock
    IF NOT v_allow_negative AND (v_current_stock - v_quantity < 0) THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', item->>'product_name_snapshot';
    END IF;

    -- Update stock
    UPDATE products 
    SET current_stock = current_stock - v_quantity 
    WHERE id = v_product_id;

    -- Insert inventory movement
    INSERT INTO inventory_movements (
      tenant_id, product_id, movement_type, quantity, previous_stock, new_stock, reason, related_sale_id, created_by
    ) VALUES (
      v_tenant_id,
      v_product_id,
      'sale',
      -v_quantity,
      v_current_stock,
      v_current_stock - v_quantity,
      'Venta POS',
      v_sale_id,
      v_user_id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Function to register a sale payment
CREATE OR REPLACE FUNCTION register_sale_payment(p_sale_id UUID, p_amount NUMERIC, p_method TEXT, p_notes TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total NUMERIC;
  v_current_paid NUMERIC;
  v_new_paid NUMERIC;
  v_balance NUMERIC;
  v_status TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := get_auth_user_id();

  -- Get current sale info and lock
  SELECT total, amount_paid INTO v_total, v_current_paid
  FROM sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  v_new_paid := v_current_paid + p_amount;
  IF v_new_paid > v_total THEN
    -- Limit the payment to the total to avoid negative balance
    p_amount := v_total - v_current_paid;
    v_new_paid := v_total;
  END IF;

  v_balance := v_total - v_new_paid;

  IF v_balance <= 0 THEN
    v_status := 'paid';
    v_balance := 0;
  ELSIF v_new_paid > 0 THEN
    v_status := 'partially_paid';
  ELSE
    v_status := 'pending';
  END IF;

  -- Insert payment
  INSERT INTO sale_payments (
    sale_id, amount, payment_method, notes, created_by
  ) VALUES (
    p_sale_id, p_amount, p_method, p_notes, v_user_id
  );

  -- Update sale header
  UPDATE sales
  SET amount_paid = v_new_paid,
      balance_due = v_balance,
      payment_status = v_status
  WHERE id = p_sale_id;

  RETURN jsonb_build_object('success', true, 'balance_due', v_balance, 'payment_status', v_status);
END;
$$;
