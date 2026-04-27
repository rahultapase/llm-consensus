-- 0004_security_fixes.sql
-- Fix mutable search_path on SECURITY DEFINER and non-SECURITY DEFINER functions.
-- Without a fixed search_path, a malicious user with CREATE privilege could
-- shadow pg_catalog functions and hijack these triggers.

-- FIX 1: handle_new_user is SECURITY DEFINER — critical risk
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

-- FIX 2: update_updated_at is not SECURITY DEFINER — lower risk but best practice
ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;
