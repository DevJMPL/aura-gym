-- ============================================================
-- Migration 012: Sync auth.users to app_users
-- Backfills missing user profiles and creates an auto-sync trigger
-- ============================================================

-- 1. Backfill existing users from auth.users into app_users
INSERT INTO public.app_users (auth_id, email, full_name, role, is_active)
SELECT 
  id as auth_id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'admin') as role,
  true as is_active
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

-- 2. Create function to automatically handle new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, email, full_name, role, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'admin'),
    true
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
