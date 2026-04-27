import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/db";
import { validateUsername } from "@/lib/auth/username";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const metadata = user?.user_metadata;
        const provider = user?.app_metadata?.provider as string | undefined;
        const isOAuth = provider && provider !== "email";

        if (user) {
          const metadataUsername =
            typeof metadata?.username === "string" ? metadata.username.trim() : null;
          const givenName = metadata?.given_name as string | undefined;
          const fullName = metadata?.full_name as string | undefined;
          const firstName = givenName ?? fullName?.split(" ")[0];
          const derivedUsername = firstName
            ? firstName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 32)
            : null;

          const usernameCandidate =
            metadataUsername && !validateUsername(metadataUsername)
              ? metadataUsername
              : derivedUsername && !validateUsername(derivedUsername)
                ? derivedUsername
                : null;

          if (usernameCandidate) {
            await adminSupabase
              .from("profiles")
              .update({ username: usernameCandidate, updated_at: new Date().toISOString() })
              .eq("id", user.id)
              .is("username", null);
          }
        }

        if (isOAuth) {
          const sep = next.includes("?") ? "&" : "?";
          return NextResponse.redirect(`${origin}${next}${sep}toast=login`);
        }
      } catch {
        // Non-fatal — fall through to default redirect
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
