-- ============================================================
-- Migration: Membership Payments and Debts
-- ============================================================

-- Drop the old payments table and its policies/indexes
DROP TABLE IF EXISTS payments CASCADE;

-- 1. Membership Charges (Tracks the overall debt for a membership purchase/renewal)
CREATE TABLE IF NOT EXISTS membership_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partially_paid', 'pending', 'cancelled')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  due_date TIMESTAMPTZ,
  notes TEXT,
  
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_charges_tenant_id ON membership_charges(tenant_id);
CREATE INDEX idx_membership_charges_member_id ON membership_charges(member_id);
CREATE INDEX idx_membership_charges_payment_status ON membership_charges(payment_status);

-- 2. Membership Payments (Tracks individual payments made towards a charge)
CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id UUID NOT NULL REFERENCES membership_charges(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mixed', 'other')),
  notes TEXT,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_payments_charge_id ON membership_payments(charge_id);

-- Triggers for updated_at
CREATE TRIGGER set_membership_charges_updated_at BEFORE UPDATE ON membership_charges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE membership_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

-- Membership Charges Policies
CREATE POLICY "Users can read membership_charges" ON membership_charges FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can manage membership_charges" ON membership_charges FOR ALL USING (check_tenant_access(tenant_id));

-- Membership Payments Policies (inherit from charges)
CREATE POLICY "Users can read membership_payments" ON membership_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM membership_charges WHERE id = membership_payments.charge_id AND check_tenant_access(membership_charges.tenant_id))
);
CREATE POLICY "Users can manage membership_payments" ON membership_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM membership_charges WHERE id = membership_payments.charge_id AND check_tenant_access(membership_charges.tenant_id))
);

-- ============================================================
-- RPC Functions for Atomicity
-- ============================================================

-- Function to register a membership payment
CREATE OR REPLACE FUNCTION register_membership_payment(p_charge_id UUID, p_amount NUMERIC, p_method TEXT, p_notes TEXT)
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

  -- Get current charge info and lock
  SELECT total, amount_paid INTO v_total, v_current_paid
  FROM membership_charges
  WHERE id = p_charge_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active charge not found';
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
  INSERT INTO membership_payments (
    charge_id, amount, payment_method, notes, created_by
  ) VALUES (
    p_charge_id, p_amount, p_method, p_notes, v_user_id
  );

  -- Update charge header
  UPDATE membership_charges
  SET amount_paid = v_new_paid,
      balance_due = v_balance,
      payment_status = v_status
  WHERE id = p_charge_id;

  RETURN jsonb_build_object('success', true, 'balance_due', v_balance, 'payment_status', v_status);
END;
$$;

-- Function to create a membership charge (and optional initial payment)
CREATE OR REPLACE FUNCTION create_membership_charge(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_charge_id UUID;
  v_tenant_id UUID;
  v_member_id UUID;
  v_plan_id UUID;
  v_membership_id UUID;
  v_total NUMERIC;
  v_amount_paid NUMERIC;
  v_balance_due NUMERIC;
  v_payment_status TEXT;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := get_auth_user_id();

  -- Extract basic info
  v_tenant_id := (payload->>'tenant_id')::UUID;
  v_member_id := (payload->>'member_id')::UUID;
  v_plan_id := (payload->>'plan_id')::UUID;
  
  -- Handle nullable membership_id
  IF (payload->>'membership_id') IS NOT NULL THEN
    v_membership_id := (payload->>'membership_id')::UUID;
  END IF;

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

  -- 1. Insert Charge Header
  INSERT INTO membership_charges (
    tenant_id, member_id, plan_id, membership_id,
    subtotal, discount_total, total, amount_paid, balance_due, payment_status,
    due_date, notes, created_by
  ) VALUES (
    v_tenant_id,
    v_member_id,
    v_plan_id,
    v_membership_id,
    (payload->>'subtotal')::NUMERIC,
    (payload->>'discount_total')::NUMERIC,
    v_total,
    v_amount_paid,
    v_balance_due,
    v_payment_status,
    (payload->>'due_date')::TIMESTAMPTZ,
    payload->>'notes',
    v_user_id
  ) RETURNING id INTO v_charge_id;

  -- 2. Insert Initial Payment (if any)
  IF v_amount_paid > 0 THEN
    INSERT INTO membership_payments (
      charge_id, amount, payment_method, notes, created_by
    ) VALUES (
      v_charge_id,
      v_amount_paid,
      payload->>'payment_method',
      'Pago inicial de plan',
      v_user_id
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'charge_id', v_charge_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
