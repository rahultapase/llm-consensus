import { Sparkles, BarChart2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreamingStage } from "@/lib/streaming/types";

interface StageLoadingProps {
  stage: StreamingStage;
  className?: string;
}

const STAGES = [
  {
    key: "stage1" as StreamingStage,
    icon: Sparkles,
    label: "Council",
    detail: "Querying models in parallel",
  },
  {
    key: "stage2" as StreamingStage,
    icon: BarChart2,
    label: "Rankings",
    detail: "Peer evaluation",
  },
  {
    key: "stage3" as StreamingStage,
    icon: Crown,
    label: "Synthesis",
    detail: "Chairman summarizing",
  },
];

const STAGE_ORDER: StreamingStage[] = ["stage1", "stage2", "stage3"];

export function StageLoading({ stage, className }: StageLoadingProps) {
  const activeIndex = STAGE_ORDER.indexOf(stage);
  if (activeIndex === -1) return null;

  return (
    <div className={cn("flex flex-col gap-4 stage-enter", className)}>
      {/* Pipeline progress */}
      <div className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const Icon = s.icon;

          return (
            <div key={s.key} className="flex flex-1 items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border transition-all duration-300",
                    isActive && "border-amber-400/60 bg-amber-400/10 text-amber-400",
                    isDone && "border-border/60 bg-muted text-muted-foreground/60",
                    !isActive && !isDone && "border-border/30 bg-transparent text-muted-foreground/20"
                  )}
                >
                  {isActive ? (
                    <span className="relative flex size-3 items-center justify-center">
                      <span className="absolute inline-flex size-4 animate-ping rounded-full bg-amber-400/40" />
                      <Icon className="relative size-3.5" />
                    </span>
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide whitespace-nowrap",
                    isActive && "text-amber-400",
                    isDone && "text-muted-foreground/50",
                    !isActive && !isDone && "text-muted-foreground/20"
                  )}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {i < STAGES.length - 1 && (
                <div className="relative mx-2 flex-1 h-px bg-border/30">
                  {isDone && (
                    <div className="absolute inset-0 bg-border/60" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage detail + shimmer skeleton */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/40 p-4">
        {/* Detail text */}
        <div className="flex items-center gap-2">
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[11px] text-muted-foreground/50">
            {STAGES[activeIndex].detail}
          </span>
        </div>

        {/* Shimmer skeleton lines */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="shimmer-line h-3 w-full rounded-md" />
          <div className="shimmer-line h-3 w-[85%] rounded-md" />
          <div className="shimmer-line h-3 w-[65%] rounded-md" />
        </div>
      </div>
    </div>
  );
}

