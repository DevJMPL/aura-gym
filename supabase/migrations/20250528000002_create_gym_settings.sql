-- ============================================================
-- Migration 002: Gym Settings
-- Single-row configuration table for the gym
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'MXN',
  timezone TEXT DEFAULT 'America/Mexico_City',
  opening_time TIME,
  closing_time TIME,
  business_days TEXT[] DEFAULT '{Mon,Tue,Wed,Thu,Fri,Sat}',
  is_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enforce single row (singleton pattern)
CREATE UNIQUE INDEX gym_settings_singleton ON gym_settings ((true));

CREATE TRIGGER set_gym_settings_updated_at
  BEFORE UPDATE ON gym_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
