"use client";

import { useState } from "react";
import { BarChart2, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stage2Response, Stage2Metadata } from "@/lib/streaming/types";

interface Stage2Props {
  rankings: Stage2Response[];
  metadata: Stage2Metadata;
  className?: string;
}

// Medal styles for top 3
const MEDAL_STYLES = [
  {
    numeral: "text-amber-500",
    bg: "bg-amber-500/8",
    bar: "bg-amber-400/40",
    label: "text-amber-500/80",
  },
  {
    numeral: "text-zinc-400",
    bg: "bg-zinc-500/5",
    bar: "bg-zinc-400/30",
    label: "text-zinc-400/80",
  },
  {
    numeral: "text-orange-700/70 dark:text-orange-400/60",
    bg: "bg-orange-500/5",
    bar: "bg-orange-400/25",
    label: "text-orange-700/60 dark:text-orange-400/60",
  },
];

const DEFAULT_MEDAL = {
  numeral: "text-muted-foreground/50",
  bg: "",
  bar: "bg-border/40",
  label: "text-muted-foreground/60",
};

export function Stage2({ rankings, metadata, className }: Stage2Props) {
  const [showEvals, setShowEvals] = useState(false);

  if (rankings.length === 0) return null;

  const { label_to_model, aggregate_rankings } = metadata;

  const sorted = [...aggregate_rankings].sort(
    (a, b) => a.average_rank - b.average_rank
  );

  // Normalize scores: worst rank = model count (e.g. 4), best = 1
  const maxRank = sorted.length;
  const minScore = sorted[sorted.length - 1]?.average_rank ?? maxRank;
  const maxScore = sorted[0]?.average_rank ?? 1;
  const range = minScore - maxScore || 1;

  function scoreBarWidth(avg: number) {
    // 100% for best rank, shrinks toward 25% for worst
    return Math.round(25 + ((minScore - avg) / range) * 75);
  }

  return (
    <div className={cn("flex flex-col gap-4 stage-enter", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <BarChart2 className="size-3 shrink-0 text-muted-foreground/60" />
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/75">
          Stage 2 — Peer Rankings
        </span>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      {/* Aggregate ranking table */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="border-b border-border/60 px-4 py-2.5">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/70">
            Aggregate Rankings
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {sorted.map((entry, i) => {
            const medal = MEDAL_STYLES[i] ?? DEFAULT_MEDAL;
            const barPct = scoreBarWidth(entry.average_rank);
            return (
              <div
                key={entry.model}
                className={cn("relative flex items-center gap-4 px-4 py-3 overflow-hidden", medal.bg)}
              >
                {/* Score bar (behind content) */}
                <div
                  className={cn("absolute inset-y-0 left-0 transition-all duration-700", medal.bar)}
                  style={{ width: `${barPct}%`, opacity: 0.35 }}
                />

                {/* Rank numeral */}
                <span
                  className={cn(
                    "relative w-7 shrink-0 font-mono text-2xl font-bold leading-none tabular-nums",
                    medal.numeral
                  )}
                >
                  {i + 1}
                </span>

                {/* Model name */}
                <div className="relative flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-xs font-medium text-foreground/75">
                    {shortModelName(entry.model)}
                  </span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground/55">
                    {entry.model}
                  </span>
                </div>

                {/* Score chip */}
                <div className="relative shrink-0 text-right">
                  <span className={cn("font-mono text-sm font-semibold tabular-nums", medal.label)}>
                    {entry.average_rank.toFixed(2)}
                  </span>
                  <span className="ml-0.5 text-[10px] text-muted-foreground/55">
                    avg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual evaluations — styled toggle */}
      {rankings.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowEvals((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5",
              "text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              showEvals
                ? "border-border/70 bg-muted/40 text-foreground/80"
                : "border-border/50 bg-transparent text-muted-foreground/70 hover:border-border/70 hover:bg-muted/30 hover:text-muted-foreground/85"
            )}
          >
            <Users className="size-3.5 shrink-0 text-muted-foreground/65" />
            <span className="flex-1 text-left">Individual evaluations</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums transition-colors",
                showEvals
                  ? "bg-muted/60 text-foreground/60"
                  : "bg-muted/40 text-muted-foreground/50"
              )}
            >
              {rankings.length}
            </span>
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200",
                showEvals && "rotate-90"
              )}
            />
          </button>

          {showEvals && (
            <div className="flex flex-col gap-2 pt-0.5">
              {rankings.map((r) => (
                <EvaluationCard
                  key={r.model}
                  evaluation={r}
                  labelToModel={label_to_model}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Position badge styles for rank 1–4
const RANK_STYLES = [
  { dot: "bg-amber-400/90", text: "text-amber-500" },
  { dot: "bg-zinc-400/80", text: "text-zinc-400" },
  { dot: "bg-orange-400/75", text: "text-orange-500/90" },
  { dot: "bg-muted-foreground/40", text: "text-muted-foreground/65" },
];

function EvaluationCard({
  evaluation,
  labelToModel,
}: {
  evaluation: Stage2Response;
  labelToModel: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/55 bg-card/50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-3.5 py-2">
        <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/65">
          Ranked by
        </span>
        <span className="font-mono text-[11px] font-medium text-foreground/85">
          {shortModelName(evaluation.model)}
        </span>
      </div>

      {/* Ranked list */}
        <ol className="flex flex-col divide-y divide-border/35 px-0">
        {evaluation.parsed_ranking.map((label, i) => {
          const model = labelToModel[label] ?? label;
          const style = RANK_STYLES[i] ?? RANK_STYLES[RANK_STYLES.length - 1];
          return (
            <li key={label} className="flex items-center gap-3 px-3.5 py-2">
              <span
                className={cn(
                  "w-4 shrink-0 font-mono text-[10px] font-semibold tabular-nums",
                  style.text
                )}
              >
                {i + 1}
              </span>
              <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/85">
                {shortModelName(model)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function shortModelName(model: string): string {
  return model.split("/").pop() ?? model;
}
