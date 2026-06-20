-- Fix RLS policy for user_login_history so users can select their own inserted records

CREATE POLICY "Users can read their own login history"
  ON user_login_history FOR SELECT
  USING (
    user_id = get_auth_user_id()
  );
