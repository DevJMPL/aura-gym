-- ============================================================
-- Migration 010: Helper Functions
-- Utility functions for business logic
-- ============================================================

-- Check if a member has an active membership
CREATE OR REPLACE FUNCTION check_active_membership(p_member_id UUID)
RETURNS TABLE (
  has_active BOOLEAN,
  membership_id UUID,
  plan_name TEXT,
  end_date DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS has_active,
    m.id AS membership_id,
    mp.name AS plan_name,
    m.end_date,
    (m.end_date - CURRENT_DATE)::INTEGER AS days_remaining
  FROM memberships m
  JOIN membership_plans mp ON mp.id = m.plan_id
  WHERE m.member_id = p_member_id
    AND m.status = 'active'
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE
  ORDER BY m.end_date DESC
  LIMIT 1;

  -- If no rows returned, return a "no active membership" row
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DATE, NULL::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Auto-expire memberships (can be called periodically)
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE memberships
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND end_date < CURRENT_DATE;

  GET DIAGNOSTICS affected = ROW_COUNT;

  -- Also update member status for members with no active memberships
  UPDATE members m
  SET status = 'expired', updated_at = now()
  WHERE m.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM memberships ms
      WHERE ms.member_id = m.id
        AND ms.status = 'active'
        AND ms.end_date >= CURRENT_DATE
    )
    AND EXISTS (
      SELECT 1 FROM memberships ms
      WHERE ms.member_id = m.id
    );

  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get member dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_active_members BIGINT,
  total_expired_members BIGINT,
  expiring_soon BIGINT,
  today_attendance BIGINT,
  month_revenue NUMERIC,
  new_members_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM members WHERE status = 'active') AS total_active_members,
    (SELECT count(*) FROM members WHERE status = 'expired') AS total_expired_members,
    (SELECT count(DISTINCT m.member_id) FROM memberships m
     WHERE m.status = 'active'
       AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS expiring_soon,
    (SELECT count(*) FROM attendance_records
     WHERE check_in_at::date = CURRENT_DATE) AS today_attendance,
    (SELECT COALESCE(sum(amount), 0) FROM payments
     WHERE date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)) AS month_revenue,
    (SELECT count(*) FROM members
     WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) AS new_members_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
