"use client";

import { ErrorBoundary } from "@/components/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      title="The page hit an unexpected error"
      description="A render or data-loading error interrupted this route. Retry the segment to recover without reloading the whole app."
    />
  );
}