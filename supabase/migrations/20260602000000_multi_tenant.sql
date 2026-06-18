-- ============================================================
-- Migration 013: Multi-Tenancy (Multi-Gym) Support
-- ============================================================

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create tenant_users table
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Add updated_at triggers
CREATE TRIGGER set_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tenant_users_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Add tenant_id to all operational tables
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE member_training_days ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE user_login_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Data Migration for existing records
DO $$
DECLARE
  default_tenant_id UUID;
  first_admin_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM app_users) THEN
    IF NOT EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
      SELECT id INTO first_admin_id FROM app_users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1;
      
      IF first_admin_id IS NULL THEN
        SELECT id INTO first_admin_id FROM app_users ORDER BY created_at ASC LIMIT 1;
      END IF;

      INSERT INTO tenants (name, slug, owner_user_id) 
      VALUES ('Mi Gimnasio', 'mi-gimnasio-default', first_admin_id)
      RETURNING id INTO default_tenant_id;
      
      INSERT INTO tenant_users (tenant_id, user_id, role)
      SELECT default_tenant_id, id, CASE WHEN role = 'admin' THEN 'ADMIN' ELSE 'STAFF' END
      FROM app_users;
      
      UPDATE gym_settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE members SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE membership_plans SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE memberships SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE attendance_records SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE member_training_days SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE payments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE user_login_history SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
      UPDATE audit_logs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
  END IF;
END $$;

-- 5. Fix gym_settings constraints
ALTER TABLE gym_settings DROP CONSTRAINT IF EXISTS gym_settings_singleton;
DROP INDEX IF EXISTS gym_settings_singleton;
CREATE UNIQUE INDEX IF NOT EXISTS gym_settings_tenant_id_idx ON gym_settings (tenant_id);

-- 6. Enforce NOT NULL for tenant_id
ALTER TABLE gym_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE membership_plans ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE memberships ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE member_training_days ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_login_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN tenant_id SET NOT NULL;

-- 7. Add indexes for tenant_id performance
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_tenant_id ON membership_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id ON attendance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_training_days_tenant_id ON member_training_days(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_tenant_id ON user_login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- 8. Enable RLS for new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 9. Helper functions for multi-tenant RLS
CREATE OR REPLACE FUNCTION get_auth_user_id()
RETURNS UUID AS $$
  SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION check_tenant_access(t_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users tu
    JOIN app_users au ON tu.user_id = au.id
    WHERE au.auth_id = auth.uid() 
      AND tu.tenant_id = t_id
      AND tu.is_active = true
      AND (required_role IS NULL OR tu.role = required_role)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 10. Multi-Tenant RLS Policies
-- TENANTS
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
CREATE POLICY "Users can view their tenants" ON tenants FOR SELECT USING (check_tenant_access(id));

DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
CREATE POLICY "Users can create tenants" ON tenants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners or Admins can update their tenants" ON tenants;
CREATE POLICY "Owners or Admins can update their tenants" ON tenants FOR UPDATE USING (owner_user_id = get_auth_user_id() OR check_tenant_access(id, 'ADMIN'));

-- TENANT_USERS
DROP POLICY IF EXISTS "Users can view users in their tenants" ON tenant_users;
CREATE POLICY "Users can view users in their tenants" ON tenant_users FOR SELECT USING (check_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Owners and Admins can manage tenant_users" ON tenant_users;
CREATE POLICY "Owners and Admins can manage tenant_users" ON tenant_users FOR ALL 
USING (
  check_tenant_access(tenant_id, 'ADMIN') OR 
  EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_user_id = get_auth_user_id())
);

-- APP_USERS
DROP POLICY IF EXISTS "Authenticated users can read app_users" ON app_users;
CREATE POLICY "Authenticated users can read app_users" ON app_users FOR SELECT USING (auth.uid() IS NOT NULL);

-- DROP OLD POLICIES for operational tables
DO $$ 
DECLARE 
  t_name text;
  p_name text;
BEGIN
  FOR t_name, p_name IN 
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN (
      'gym_settings', 'members', 'membership_plans', 'memberships', 
      'attendance_records', 'member_training_days', 'payments', 
      'user_login_history', 'audit_logs'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_name, t_name);
  END LOOP;
END $$;

-- CREATE NEW POLICIES (Data Isolation via tenant_id)
-- gym_settings
CREATE POLICY "Users can read gym_settings" ON gym_settings FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Admins can manage gym_settings" ON gym_settings FOR ALL USING (check_tenant_access(tenant_id, 'ADMIN'));

-- members
CREATE POLICY "Users can read members" ON members FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can insert members" ON members FOR INSERT WITH CHECK (check_tenant_access(tenant_id));
CREATE POLICY "Users can update members" ON members FOR UPDATE USING (check_tenant_access(tenant_id));

-- membership_plans
CREATE POLICY "Users can read plans" ON membership_plans FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Admins can manage plans" ON membership_plans FOR ALL USING (check_tenant_access(tenant_id, 'ADMIN'));

-- memberships
CREATE POLICY "Users can read memberships" ON memberships FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can manage memberships" ON memberships FOR ALL USING (check_tenant_access(tenant_id));

-- attendance_records
CREATE POLICY "Users can read attendance" ON attendance_records FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can manage attendance" ON attendance_records FOR ALL USING (check_tenant_access(tenant_id));

-- member_training_days
CREATE POLICY "Users can read training_days" ON member_training_days FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can manage training_days" ON member_training_days FOR ALL USING (check_tenant_access(tenant_id));

-- payments
CREATE POLICY "Users can read payments" ON payments FOR SELECT USING (check_tenant_access(tenant_id));
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (check_tenant_access(tenant_id));
CREATE POLICY "Admins can update payments" ON payments FOR UPDATE USING (check_tenant_access(tenant_id, 'ADMIN'));

-- user_login_history
CREATE POLICY "Admins can read login history" ON user_login_history FOR SELECT USING (check_tenant_access(tenant_id, 'ADMIN'));
CREATE POLICY "Users can insert login history" ON user_login_history FOR INSERT WITH CHECK (check_tenant_access(tenant_id));

-- audit_logs
CREATE POLICY "Admins can read audit_logs" ON audit_logs FOR SELECT USING (check_tenant_access(tenant_id, 'ADMIN'));
CREATE POLICY "Users can insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (check_tenant_access(tenant_id));
