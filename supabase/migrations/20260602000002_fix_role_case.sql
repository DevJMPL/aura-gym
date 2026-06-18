-- Fix check_tenant_access to be case-insensitive for roles
CREATE OR REPLACE FUNCTION check_tenant_access(t_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users tu
    JOIN app_users au ON tu.user_id = au.id
    WHERE au.auth_id = auth.uid() 
      AND tu.tenant_id = t_id
      AND tu.is_active = true
      AND (required_role IS NULL OR UPPER(tu.role) = UPPER(required_role))
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
