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
      title="This conversation view crashed"
      description="The authenticated app shell is still intact. Retry this segment to recover the current view and continue working."
    />
  );
}