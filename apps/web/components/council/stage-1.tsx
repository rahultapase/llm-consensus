"use client";

import { useState } from "react";
import { Tabs } from "radix-ui";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyMenuButton } from "@/components/chat/copy-menu-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { Stage1Response } from "@/lib/streaming/types";

interface Stage1Props {
  responses: Stage1Response[];
  className?: string;
}

// Cycles across any number of models
const BADGE_COLORS = [
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
] as const;

/** Extracts the last non-empty segment of a model path. */
function shortModelName(model: string): string {
  const parts = model.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? model;
}

export function Stage1({ responses, className }: Stage1Props) {
  const firstModel = responses[0]?.model ?? "";
  const [activeTab, setActiveTab] = useState(firstModel);

  if (responses.length === 0) return null;

  const visibleTab = responses.some((response) => response.model === activeTab)
    ? activeTab
    : firstModel;

  return (
    <div className={cn("flex flex-col gap-0 stage-enter", className)}>
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2.5">
        <Sparkles className="size-3 shrink-0 text-muted-foreground/60" />
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/75">
          Stage 1 — Council Responses
        </span>
        <div className="h-px flex-1 bg-border/70" />
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium tabular-nums text-primary/80">
          {responses.length} {responses.length === 1 ? "model" : "models"}
        </span>
      </div>

      <Tabs.Root value={visibleTab} onValueChange={setActiveTab}>
        {/* Tab strip */}
        <Tabs.List
          className="flex overflow-x-auto no-scrollbar rounded-t-xl border border-border/50 bg-muted/25"
          style={{ scrollbarWidth: "none" }}
          aria-label="Model responses"
        >
          {responses.map((r, i) => (
            <Tabs.Trigger
              key={r.model}
              value={r.model}
              className={cn(
                "relative shrink-0 flex items-center gap-1.5 px-3.5 py-2.5",
                "text-xs font-medium whitespace-nowrap",
                "focus-visible:outline-none",
                "transition-[color,background-color,box-shadow] duration-150",
                "data-[state=active]:bg-background/50",
                "data-[state=active]:text-foreground data-[state=active]:font-semibold",
                "data-[state=active]:shadow-[inset_0_2px_0_var(--color-tab-indicator),inset_1px_0_0_var(--color-border),inset_-1px_0_0_var(--color-border)]",
                "data-[state=inactive]:text-muted-foreground/50",
                "data-[state=inactive]:hover:bg-muted/40",
                "data-[state=inactive]:hover:text-muted-foreground/80"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                  BADGE_COLORS[i % BADGE_COLORS.length]
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              {shortModelName(r.model)}
            </Tabs.Trigger>
          ))}
          {/* Fills remaining space so the strip always spans full width */}
          <div className="flex-1 min-w-0" aria-hidden />
        </Tabs.List>

        {/* Tab panels */}
        {responses.map((r) => (
          <Tabs.Content
            key={r.model}
            value={r.model}
            className="focus-visible:outline-none"
          >
            <div className="group relative rounded-b-xl border-x border-b border-border/50 bg-card px-4 py-4">
              {/* Full model path — tooltip on hover for truncated values */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className="min-w-0 truncate font-mono text-[10px] text-muted-foreground/30"
                  title={r.model}
                >
                  {r.model}
                </span>
                <CopyMenuButton text={r.response} />
              </div>
              <MarkdownRenderer content={r.response} />
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}

