"use client";

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
}

export function ErrorBoundary({
  error,
  reset,
  title,
  description,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-[50vh] items-center justify-center px-6 py-10"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border px-6 py-8 shadow-sm"
        style={{
          background: "var(--color-sidebar-bg)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Route error
        </p>
        <h1
          className="mt-3 text-2xl font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-sm leading-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>

        {process.env.NODE_ENV !== "production" ? (
          <pre
            className="mt-4 overflow-x-auto rounded-2xl border px-4 py-3 text-xs leading-5"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {error.message}
          </pre>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-90"
            onClick={() => reset()}
            type="button"
            style={{
              background: "var(--color-btn-primary-bg)",
              color: "var(--color-btn-primary-fg)",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}