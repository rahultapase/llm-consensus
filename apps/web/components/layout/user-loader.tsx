"use client";

import { useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/lib/stores/user";

export function UserLoader() {
  const trpc = useTRPC();
  const setUser = useUserStore((s) => s.setUser);
  const setProfileLoaded = useUserStore((s) => s.setProfileLoaded);

  const { data: profile, isSuccess, isError } = useQuery(trpc.user.profile.queryOptions());

  useEffect(() => {
    if (profile) {
      setUser({
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
      });
    } else if (isSuccess || isError) {
      // Query settled but no profile (unauthenticated) — still mark loaded
      setProfileLoaded();
    }
  }, [profile, isSuccess, isError, setUser, setProfileLoaded]);

  return null;
}
