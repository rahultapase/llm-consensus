import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TRPCReactProvider } from "@/trpc/react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { UserLoader } from "@/components/layout/user-loader";
import { TopControls } from "@/components/layout/top-controls";
import { MainContent } from "@/components/layout/main-content";
import { LoginToast } from "@/components/layout/login-toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <TRPCReactProvider>
      <UserLoader />
      <LoginToast />
      <div className="h-dvh overflow-hidden" style={{ background: "var(--color-bg)" }}>
        <Sidebar />
        <TopControls />
        <MainContent>
          <AppShell>{children}</AppShell>
        </MainContent>
      </div>
    </TRPCReactProvider>
  );
}
