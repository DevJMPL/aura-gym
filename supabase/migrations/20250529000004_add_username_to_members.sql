-- ============================================================
-- Migration 004: Add username to members
-- Allow members to have a unique username for check-ins
-- ============================================================

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Index for frequent lookups during autocomplete
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);
