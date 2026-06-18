-- Fix tenant SELECT policy so users can read the tenant they just created (since tenant_users isn't populated yet)
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
CREATE POLICY "Users can view their tenants" ON tenants 
FOR SELECT USING (
  owner_user_id = get_auth_user_id() 
  OR check_tenant_access(id)
);

-- Fix tenant_users role constraint to use lowercase admin/staff to match typescript types
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_role_check CHECK (role IN ('admin', 'staff', 'ADMIN', 'STAFF'));
