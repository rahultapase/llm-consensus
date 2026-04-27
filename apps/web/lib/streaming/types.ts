import type { UIMessage } from "ai";

// ---------------------------------------------------------------------------
// Stage 1 — Individual model responses
// ---------------------------------------------------------------------------

export interface Stage1Response {
  model: string;
  response: string;
}

// ---------------------------------------------------------------------------
// Stage 2 — Rankings
// ---------------------------------------------------------------------------

export interface Stage2Response {
  model: string;
  ranking: string;
  parsed_ranking: string[];
}

export interface AggregateRanking {
  model: string;
  average_rank: number;
  rankings_count: number;
}

export interface Stage2Metadata {
  label_to_model: Record<string, string>;
  aggregate_rankings: AggregateRanking[];
}

// ---------------------------------------------------------------------------
// Stage 3 — Chairman synthesis
// ---------------------------------------------------------------------------

export interface Stage3Response {
  model: string;
  response: string;
}

// ---------------------------------------------------------------------------
// SSE events emitted by FastAPI (raw format before AI SDK transformation)
// ---------------------------------------------------------------------------

export type CouncilSSEEvent =
  | { type: "stage1_start" }
  | { type: "stage1_complete"; data: Stage1Response[] }
  | { type: "stage2_start" }
  | {
      type: "stage2_complete";
      data: Stage2Response[];
      metadata: Stage2Metadata;
    }
  | { type: "stage3_start" }
  | { type: "stage3_complete"; data: Stage3Response }
  | { type: "title_complete"; data: { title: string } }
  | { type: "complete" }
  | { type: "cancelled" }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// AI SDK data part types — maps to `data-{name}` in UIMessageStream
// ---------------------------------------------------------------------------

export type CouncilDataTypes = {
  stage1_start: Record<string, never>;
  stage1_complete: Stage1Response[];
  stage2_start: Record<string, never>;
  stage2_complete: { rankings: Stage2Response[]; metadata: Stage2Metadata };
  stage3_start: Record<string, never>;
  stage3_complete: Stage3Response;
  title_complete: { title: string };
  complete: Record<string, never>;
  persisted: Record<string, never>;
  cancelled: Record<string, never>;
  error: { message: string };
};

export type CouncilUIMessage = UIMessage<unknown, CouncilDataTypes>;

// ---------------------------------------------------------------------------
// Request shape sent from the hook to the Route Handler
// ---------------------------------------------------------------------------

export interface CouncilStreamRequest {
  content: string;
  preset?: string;
  council_models?: string[];
  chairman_model?: string;
  conversation_id?: string;
}

// ---------------------------------------------------------------------------
// Streaming state tracked in Zustand
// ---------------------------------------------------------------------------

export type StreamingStage =
  | "idle"
  | "stage1"
  | "stage2"
  | "stage3"
  | "complete"
  | "persisted"
  | "error"
  | "cancelled";

export interface StreamingState {
  stage: StreamingStage;
  stage1Data: Stage1Response[] | null;
  stage2Data: {
    rankings: Stage2Response[];
    metadata: Stage2Metadata;
  } | null;
  stage3Data: Stage3Response | null;
  error: string | null;
  generatedTitle: string | null;
}

export const INITIAL_STREAMING_STATE: StreamingState = {
  stage: "idle",
  stage1Data: null,
  stage2Data: null,
  stage3Data: null,
  error: null,
  generatedTitle: null,
};
