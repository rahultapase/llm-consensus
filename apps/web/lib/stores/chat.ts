import { create } from "zustand";
import { PRESETS } from "@/components/council/presets";
import type {
  StreamingStage,
  Stage1Response,
  Stage2Response,
  Stage2Metadata,
  Stage3Response,
} from "@/lib/streaming/types";

type CouncilMode = "fast" | "reasoning";

interface ChatState {
  // ── Conversation state ─────────────────────────────────────────
  currentConversationId: string | null;
  isLoading: boolean;

  // ── Temporary chat ─────────────────────────────────────────────
  isTemporary: boolean;
  setIsTemporary: (val: boolean) => void;
  toggleTemporaryChat: () => void;

  // ── Council configuration ──────────────────────────────────────
  councilMode: CouncilMode;
  fastModelIds: string[];
  reasoningModelIds: string[];
  preset: string;
  councilModels: string[] | undefined;
  chairmanModel: string | undefined;

  // ── Streaming state ────────────────────────────────────────────
  streamingStage: StreamingStage;
  stage1Data: Stage1Response[] | null;
  stage2Data: {
    rankings: Stage2Response[];
    metadata: Stage2Metadata;
  } | null;
  stage3Data: Stage3Response | null;
  streamingError: string | null;
  generatedTitle: string | null;

  // ── Actions: conversation ──────────────────────────────────────
  setCurrentConversation: (id: string | null) => void;
  setLoading: (loading: boolean) => void;

  // ── Actions: council config ────────────────────────────────────
  setCouncilMode: (mode: CouncilMode) => void;
  setFastModelIds: (ids: string[]) => void;
  setReasoningModelIds: (ids: string[]) => void;
  setPreset: (preset: string) => void;
  setCouncilModels: (models: string[] | undefined) => void;
  setChairmanModel: (model: string | undefined) => void;

  // ── Actions: streaming ─────────────────────────────────────────
  setStreamingStage: (stage: StreamingStage) => void;
  setStage1Data: (data: Stage1Response[]) => void;
  setStage2Data: (data: {
    rankings: Stage2Response[];
    metadata: Stage2Metadata;
  }) => void;
  setStage3Data: (data: Stage3Response) => void;
  setStreamingError: (error: string) => void;
  setGeneratedTitle: (title: string) => void;
  resetStreaming: () => void;
}

const initialStreaming = {
  streamingStage: "idle" as StreamingStage,
  stage1Data: null,
  stage2Data: null,
  stage3Data: null,
  streamingError: null,
  generatedTitle: null,
};

/** Grok is always the chairman regardless of which models are toggled on. */
const CHAIRMAN_MODEL = "x-ai/grok-4.1-fast";

/** Helper: sync preset, councilModels, chairmanModel from mode + per-mode IDs */
function syncFromMode(
  mode: CouncilMode,
  fastIds: string[],
  reasoningIds: string[]
) {
  const ids = mode === "fast" ? fastIds : reasoningIds;
  return { preset: mode, councilModels: ids, chairmanModel: CHAIRMAN_MODEL };
}

export const useChatStore = create<ChatState>((set, get) => ({
  // ── Conversation state ─────────────────────────────────────────
  currentConversationId: null,
  isLoading: false,

  // ── Temporary chat ─────────────────────────────────────────────
  isTemporary: false,
  setIsTemporary: (val) => set({ isTemporary: val }),
  toggleTemporaryChat: () => set((s) => ({ isTemporary: !s.isTemporary })),

  // ── Council configuration ──────────────────────────────────────
  councilMode: "fast",
  fastModelIds: [...PRESETS.fast.defaultEnabledModels],
  reasoningModelIds: [...PRESETS.reasoning.defaultEnabledModels],
  preset: "fast",
  councilModels: undefined,
  chairmanModel: undefined,

  // ── Streaming state ────────────────────────────────────────────
  ...initialStreaming,

  // ── Actions: conversation ──────────────────────────────────────
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),

  // ── Actions: council config ────────────────────────────────────
  setCouncilMode: (mode) => {
    const s = get();
    set({ councilMode: mode, ...syncFromMode(mode, s.fastModelIds, s.reasoningModelIds) });
  },
  setFastModelIds: (ids) => {
    const s = get();
    set({
      fastModelIds: ids,
      ...(s.councilMode === "fast" ? syncFromMode("fast", ids, s.reasoningModelIds) : {}),
    });
  },
  setReasoningModelIds: (ids) => {
    const s = get();
    set({
      reasoningModelIds: ids,
      ...(s.councilMode === "reasoning" ? syncFromMode("reasoning", s.fastModelIds, ids) : {}),
    });
  },
  setPreset: (preset) => set({ preset }),
  setCouncilModels: (models) => set({ councilModels: models }),
  setChairmanModel: (model) => set({ chairmanModel: model }),

  // ── Actions: streaming ─────────────────────────────────────────
  setStreamingStage: (stage) => set({ streamingStage: stage }),
  setStage1Data: (data) =>
    set({ stage1Data: data, streamingStage: "stage1" }),
  setStage2Data: (data) =>
    set({ stage2Data: data, streamingStage: "stage2" }),
  setStage3Data: (data) =>
    set({ stage3Data: data, streamingStage: "stage3" }),
  setStreamingError: (error) =>
    set({ streamingError: error, streamingStage: "error" }),
  setGeneratedTitle: (title) => set({ generatedTitle: title }),
  resetStreaming: () => set(initialStreaming),
}));
