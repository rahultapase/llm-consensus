"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyMenuButton } from "@/components/chat/copy-menu-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { Stage3Response } from "@/lib/streaming/types";

interface Stage3Props {
  response: Stage3Response;
  className?: string;
}

export function Stage3({ response, className }: Stage3Props) {
  return (
    <div className={cn("flex flex-col gap-3 stage-enter", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <Crown className="size-3 shrink-0 text-amber-500/80" />
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/75">
          Stage 3 — Synthesis
        </span>
        <div className="h-px flex-1 bg-border/70" />
        <span className="font-mono text-[10px] text-muted-foreground/65">
          {shortModelName(response.model)}
        </span>
      </div>

      {/* Gradient-border synthesis card */}
      {/* Outer wrapper provides the gradient border via padding + background */}
      <div
        className="rounded-[13px] p-px"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 35%, transparent), var(--color-border) 50%, transparent)",
        }}
      >
        <div
          className="relative rounded-xl px-5 py-5"
          style={{ background: "var(--color-bg)" }}
        >
          {/* Card header: Chairman label + copy */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                }}
              >
                <Crown
                  className="size-3"
                  style={{ color: "var(--color-accent)" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-accent)" }}
                >
                  Chairman
                </span>
              </div>
            </div>
            <CopyMenuButton text={response.response} />
          </div>

          <MarkdownRenderer content={response.response} />

          {/* Footer */}
          <div className="mt-5 flex items-center gap-2 border-t border-border/25 pt-3">
            <span className="font-mono text-[10px] text-muted-foreground/60">
              synthesized by
            </span>
            <span className="rounded-md border border-border/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground/75">
              {response.model}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortModelName(model: string): string {
  return model.split("/").pop() ?? model;
}

