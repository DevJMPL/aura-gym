-- ============================================================
-- Migration: Update Attendance Records
-- Adds new columns for the robust attendance module
-- ============================================================

ALTER TABLE attendance_records
  ALTER COLUMN member_id DROP NOT NULL,
  ADD COLUMN membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  ADD COLUMN check_in_date DATE,
  ADD COLUMN status TEXT DEFAULT 'valid',
  ADD COLUMN access_result TEXT DEFAULT 'allowed',
  ADD COLUMN denial_reason TEXT,
  ADD COLUMN registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing records if any
UPDATE attendance_records SET check_in_date = (check_in_at AT TIME ZONE 'UTC')::date WHERE check_in_date IS NULL;

-- Replace daily index: Only prevent duplicates for valid allowed check-ins
DROP INDEX IF EXISTS idx_attendance_daily;

CREATE UNIQUE INDEX idx_attendance_daily_valid
  ON attendance_records(member_id, check_in_date)
  WHERE member_id IS NOT NULL AND status = 'valid';

-- Trigger for updated_at
CREATE TRIGGER set_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
