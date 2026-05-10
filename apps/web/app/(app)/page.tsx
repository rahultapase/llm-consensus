import { HomePageClient } from "@/components/chat/home-page-client";
import { adminSupabase } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

async function getInitialUsername() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.username ?? null;
}

export default async function HomePage() {
  const initialUsername = await getInitialUsername();

  return <HomePageClient initialUsername={initialUsername} />;
}

