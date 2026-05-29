-- ============================================================
-- Migration 006: Attendance Records
-- Check-in records with daily uniqueness constraint
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_in_method TEXT DEFAULT 'member_code',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent double check-in on same day
CREATE UNIQUE INDEX idx_attendance_daily
  ON attendance_records(member_id, ((check_in_at AT TIME ZONE 'UTC')::date));

CREATE INDEX idx_attendance_member ON attendance_records(member_id);
CREATE INDEX idx_attendance_date ON attendance_records(check_in_at);
CREATE INDEX idx_attendance_member_date ON attendance_records(member_id, check_in_at DESC);
