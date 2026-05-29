-- ============================================================
-- Migration 003: Members
-- Gym members with unique check-in codes
-- ============================================================

-- Sequence for generating member codes
CREATE SEQUENCE IF NOT EXISTS member_code_seq START WITH 1;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  photo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'suspended', 'inactive')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for frequent lookups
CREATE INDEX idx_members_code ON members(member_code);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_full_name ON members(full_name);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_email ON members(email);

CREATE TRIGGER set_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate member codes like AUR-0001
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
BEGIN
  next_val := nextval('member_code_seq');
  RETURN 'AUR-' || lpad(next_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
