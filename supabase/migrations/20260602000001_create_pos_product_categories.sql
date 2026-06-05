-- ============================================================
-- POS product categories
-- Categories are managed from the database and used as picklists in
-- the product admin UI. Products keep the category text column for
-- simple reports and backwards compatibility.
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_name
  ON pos_product_categories(name);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_active
  ON pos_product_categories(is_active);

INSERT INTO pos_product_categories (name)
VALUES
  ('Bebidas'),
  ('Suplementos'),
  ('Snacks'),
  ('Accesorios'),
  ('Ropa')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pos_product_categories (name)
SELECT DISTINCT TRIM(category)
FROM pos_products
WHERE category IS NOT NULL
  AND TRIM(category) <> ''
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION update_pos_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pos_product_categories_updated_at ON pos_product_categories;
CREATE TRIGGER set_pos_product_categories_updated_at
  BEFORE UPDATE ON pos_product_categories
  FOR EACH ROW EXECUTE FUNCTION update_pos_product_categories_updated_at();

ALTER TABLE pos_product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read POS product categories"
  ON pos_product_categories;
CREATE POLICY "Authenticated users can read POS product categories"
  ON pos_product_categories FOR SELECT
  USING (is_authenticated_user());

DROP POLICY IF EXISTS "Authenticated users can manage POS product categories"
  ON pos_product_categories;
CREATE POLICY "Authenticated users can manage POS product categories"
  ON pos_product_categories FOR ALL
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());
