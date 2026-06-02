-- ============================================================
-- Migration 012: Admin Settings Expansion & Audit Logs
-- ============================================================

-- 1. Expand gym_settings table
ALTER TABLE gym_settings
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS report_name TEXT,
ADD COLUMN IF NOT EXISTS report_logo_url TEXT,
ADD COLUMN IF NOT EXISTS report_footer_text TEXT,
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es-MX',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS currency_format TEXT DEFAULT 'es-MX';

-- 2. Create user_login_history table
CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  user_name TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at TIMESTAMPTZ,
  device_name TEXT,
  operating_system TEXT,
  app_version TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON user_login_history(login_at);

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- 4. Enable RLS
ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- user_login_history: Admins can read all. Users can insert their own (or let authenticated insert).
CREATE POLICY "Admins can read user_login_history"
  ON user_login_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_id = auth.uid()
      AND app_users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert user_login_history"
  ON user_login_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their own user_login_history"
  ON user_login_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_id = auth.uid()
      AND app_users.id = user_login_history.user_id
    )
  );

-- audit_logs: Admins can read all. Staff can insert (for access denied logs, etc).
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_id = auth.uid()
      AND app_users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
