-- ============================================================
-- Migration 007: Member Training Days
-- Expected attendance days per member for streak calculation
-- ============================================================

CREATE TABLE IF NOT EXISTS member_training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, day_of_week)
);

CREATE INDEX idx_training_days_member ON member_training_days(member_id);
