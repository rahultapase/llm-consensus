import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Admin Supabase client — bypasses RLS via service role key.
// Uses HTTPS (PostgREST), not TCP, to avoid IPv6-only DNS issues with direct postgres connections.
export const adminSupabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
