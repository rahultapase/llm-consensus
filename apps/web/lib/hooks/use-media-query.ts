"use client";

import { useSyncExternalStore } from "react";

function subscribeMediaQuery(query: string, onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => window.matchMedia(query).matches,
    () => false
  );
}