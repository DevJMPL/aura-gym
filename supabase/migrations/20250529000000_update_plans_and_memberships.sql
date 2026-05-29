-- ============================================================
-- Migration 011: Update Plans and Memberships
-- Adds biweekly support and discount fields
-- ============================================================

-- 1. Rename `price` to `base_price` in membership_plans
ALTER TABLE membership_plans RENAME COLUMN price TO base_price;

-- 2. Drop the existing check constraint on type and recreate it with 'biweekly'
ALTER TABLE membership_plans DROP CONSTRAINT IF EXISTS membership_plans_type_check;
ALTER TABLE membership_plans ADD CONSTRAINT membership_plans_type_check 
  CHECK (type IN ('inscription', 'visit', 'weekly', 'biweekly', 'monthly', 'annual', 'custom'));

-- 3. Add base_price, discount_type, and discount_value to memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2);

-- Migrate existing memberships to have base_price = price_paid (final_price)
UPDATE memberships SET base_price = price_paid WHERE base_price IS NULL;
ALTER TABLE memberships ALTER COLUMN base_price SET NOT NULL;

-- Note: In 'memberships', 'price_paid' acts as 'final_price'.
