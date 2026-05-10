"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/chat/copy-button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const result = await codeToHtml(code, {
          lang: lang || "text",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
        });
        if (!cancelled) setHtml(result);
      } catch {
        // Unknown language — re-try as text
        try {
          const { codeToHtml } = await import("shiki");
          const result = await codeToHtml(code, {
            lang: "text",
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
            defaultColor: false,
          });
          if (!cancelled) setHtml(result);
        } catch {
          if (!cancelled) setHtml(null);
        }
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  return (
    <div className="group relative my-4 rounded-lg border border-border/40 overflow-hidden bg-muted/30">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/30 bg-muted/50 px-4 py-2">
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {lang || "text"}
        </span>
        <CopyButton text={code} />
      </div>

      {/* Highlighted code */}
      {html ? (
        <div
          className={cn(
            "overflow-x-auto p-4 text-sm",
            "[&_.shiki]:bg-transparent [&_pre]:bg-transparent!",
            // Shiki dual-theme: light/dark via CSS vars
            "[&_span[style*='--shiki-light']]:text-(--shiki-light)",
            "dark:[&_span[style*='--shiki-dark']]:text-(--shiki-dark)",
            "[&_pre]:p-0! [&_code]:text-xs! [&_code]:leading-relaxed"
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        // Fallback: plain monospace while highlighting loads
        <pre className="overflow-x-auto p-4">
          <code className="font-mono text-xs leading-relaxed text-foreground/80">
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}
