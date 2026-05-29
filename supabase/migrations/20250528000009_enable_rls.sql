-- ============================================================
-- Migration 009: Row Level Security Policies
-- Enable RLS and create policies for all tables
-- ============================================================

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM app_users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is authenticated staff or admin
CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==================== app_users ====================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_users"
  ON app_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert app_users"
  ON app_users FOR INSERT
  WITH CHECK (is_admin() OR NOT EXISTS (SELECT 1 FROM app_users));

CREATE POLICY "Admin can update app_users"
  ON app_users FOR UPDATE
  USING (is_admin() OR auth_id = auth.uid());

CREATE POLICY "Admin can delete app_users"
  ON app_users FOR DELETE
  USING (is_admin());

-- ==================== gym_settings ====================
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gym_settings"
  ON gym_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert gym_settings"
  ON gym_settings FOR INSERT
  WITH CHECK (is_admin() OR NOT EXISTS (SELECT 1 FROM gym_settings));

CREATE POLICY "Admin can update gym_settings"
  ON gym_settings FOR UPDATE
  USING (is_admin());

-- ==================== members ====================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read members"
  ON members FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE
  USING (is_authenticated_user());

-- ==================== membership_plans ====================
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plans"
  ON membership_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage plans"
  ON membership_plans FOR ALL
  USING (is_admin());

-- ==================== memberships ====================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read memberships"
  ON memberships FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert memberships"
  ON memberships FOR INSERT
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can update memberships"
  ON memberships FOR UPDATE
  USING (is_authenticated_user());

-- ==================== attendance_records ====================
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read attendance"
  ON attendance_records FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (is_authenticated_user());

-- ==================== member_training_days ====================
ALTER TABLE member_training_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read training_days"
  ON member_training_days FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage training_days"
  ON member_training_days FOR ALL
  USING (is_authenticated_user());

-- ==================== payments ====================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Admin can manage payments"
  ON payments FOR ALL
  USING (is_admin());
