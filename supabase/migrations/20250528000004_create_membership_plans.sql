-- ============================================================
-- Migration 004: Membership Plans
-- Configurable pricing plans for the gym
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inscription', 'visit', 'weekly', 'monthly', 'annual', 'custom')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_plans_type ON membership_plans(type);
CREATE INDEX idx_membership_plans_active ON membership_plans(is_active);

CREATE TRIGGER set_membership_plans_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
