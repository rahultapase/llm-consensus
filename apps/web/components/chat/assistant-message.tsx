"use client";

import { cn } from "@/lib/utils";
import { Stage1 } from "@/components/council/stage-1";
import { Stage2 } from "@/components/council/stage-2";
import { Stage3 } from "@/components/council/stage-3";
import { StageLoading } from "@/components/council/stage-loading";
import type {
  Stage1Response,
  Stage2Response,
  Stage2Metadata,
  Stage3Response,
  StreamingStage,
} from "@/lib/streaming/types";

interface AssistantMessageProps {
  streamingStage: StreamingStage;
  stage1Data: Stage1Response[] | null;
  stage2Data: { rankings: Stage2Response[]; metadata: Stage2Metadata } | null;
  stage3Data: Stage3Response | null;
  streamingError: string | null;
  className?: string;
}

export function AssistantMessage({
  streamingStage,
  stage1Data,
  stage2Data,
  stage3Data,
  streamingError,
  className,
}: AssistantMessageProps) {
  const isActive =
    streamingStage !== "idle" &&
    streamingStage !== "complete" &&
    streamingStage !== "persisted" &&
    streamingStage !== "cancelled" &&
    streamingStage !== "error";

  const hasAnyData = !!(stage1Data || stage2Data || stage3Data);

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Vertical connector line column */}
      {hasAnyData && (
        <div className="relative flex w-px shrink-0 flex-col items-center self-stretch">
          <div
            className="absolute inset-y-2 w-px rounded-full"
            style={{ background: "var(--color-border)", opacity: 0.5 }}
          />
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Error state */}
        {streamingError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive stage-enter">
            {streamingError}
          </div>
        )}

        {/* Stage 1 — Individual responses */}
        {stage1Data && stage1Data.length > 0 ? (
          <Stage1 responses={stage1Data} />
        ) : isActive && streamingStage === "stage1" ? (
          <StageLoading stage="stage1" />
        ) : null}

        {/* Stage 2 — Peer rankings */}
        {stage2Data ? (
          <Stage2
            rankings={stage2Data.rankings}
            metadata={stage2Data.metadata}
          />
        ) : isActive && streamingStage === "stage2" ? (
          <StageLoading stage="stage2" />
        ) : null}

        {/* Stage 3 — Final synthesis */}
        {stage3Data ? (
          <Stage3 response={stage3Data} />
        ) : isActive && streamingStage === "stage3" ? (
          <StageLoading stage="stage3" />
        ) : null}
      </div>
    </div>
  );
}

