"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function LoginToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("toast") === "login") {
      toast.success("Welcome! You're signed in.");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      const newUrl = pathname + (params.size > 0 ? `?${params.toString()}` : "");
      router.replace(newUrl);
    }
  }, []);

  return null;
}

export function LoginToast() {
  return (
    <Suspense fallback={null}>
      <LoginToastInner />
    </Suspense>
  );
}
