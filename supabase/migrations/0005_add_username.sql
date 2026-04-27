-- 0005_add_username.sql
-- The username column already exists (nullable TEXT from 0001_initial_schema.sql).
-- Usernames are NOT unique — multiple users may share the same username.
-- The unique index was dropped in favour of simplicity (no signup conflicts).

-- DROP INDEX IF EXISTS idx_profiles_username_unique; (already dropped in prod)
