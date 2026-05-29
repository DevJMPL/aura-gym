-- ============================================================
-- Migration 008: Payments
-- Payment records for memberships and other concepts
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  concept TEXT NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  received_by UUID REFERENCES app_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_membership ON payments(membership_id);
