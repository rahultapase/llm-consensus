"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = usePreferencesStore();
  const isMobile = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      document.cookie = "theme=dark; path=/; max-age=31536000; SameSite=Lax";
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      document.cookie = "theme=light; path=/; max-age=31536000; SameSite=Lax";
    }
  }, [theme]);

  return (
    <>
      {children}
      {!isMobile && (
        <Toaster
          theme={theme as "dark" | "light"}
          position="bottom-right"
          closeButton
          expand={false}
          duration={3500}
          style={{ "--width": "230px", "--offset": "20px" } as React.CSSProperties}
          toastOptions={{
            style: { fontSize: "13px" },
            classNames: {
              closeButton: "sonner-close-right",
            },
          }}
        />
      )}
    </>
  );
}
