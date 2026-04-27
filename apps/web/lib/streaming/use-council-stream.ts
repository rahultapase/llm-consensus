"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useCallback, useMemo } from "react";
import { useChatStore } from "@/lib/stores/chat";
import type {
  CouncilUIMessage,
  CouncilStreamRequest,
  Stage1Response,
  Stage2Response,
  Stage2Metadata,
  Stage3Response,
} from "./types";

/**
 * Custom hook wrapping AI SDK's useChat for consuming the multi-stage
 * council SSE stream. Bridges AI SDK streaming with the Zustand chat store.
 */
export function useCouncilStream() {
  const store = useChatStore();
  const cancelCalledRef = useRef(false);

  // Build transport with dynamic body (council params from store).
  // IMPORTANT: use getState() inside the callback so it always reads the
  // current Zustand state, not the stale closure from the first render.
  const transport = useMemo(
    () =>
      new DefaultChatTransport<CouncilUIMessage>({
        api: "/api/stream/council",
        body: () => {
          const s = useChatStore.getState();
          return {
            preset: s.preset,
            council_models: s.councilModels,
            chairman_model: s.chairmanModel,
            conversation_id: s.currentConversationId,
            council_mode: s.councilMode,
          };
        },
      }),
    []
  );

  const { messages, sendMessage, stop, status, error } =
    useChat<CouncilUIMessage>({
      transport,
      onData: (part) => {
        switch (part.type) {
          case "data-stage1_start":
            store.setStreamingStage("stage1");
            break;
          case "data-stage1_complete":
            store.setStage1Data(part.data as Stage1Response[]);
            break;
          case "data-stage2_start":
            store.setStreamingStage("stage2");
            break;
          case "data-stage2_complete": {
            const d = part.data as {
              rankings: Stage2Response[];
              metadata: Stage2Metadata;
            };
            store.setStage2Data(d);
            break;
          }
          case "data-stage3_start":
            store.setStreamingStage("stage3");
            break;
          case "data-stage3_complete":
            store.setStage3Data(part.data as Stage3Response);
            break;
          case "data-title_complete": {
            const titleData = part.data as { title: string };
            store.setGeneratedTitle(titleData.title);
            break;
          }
          case "data-complete":
            store.setStreamingStage("complete");
            break;
          case "data-persisted":
            store.setStreamingStage("persisted");
            break;
          case "data-cancelled":
            store.setStreamingStage("cancelled");
            break;
          case "data-error": {
            const errData = part.data as { message: string };
            store.setStreamingError(errData.message);
            break;
          }
        }
      },
      onFinish: () => {
        // Ensure stage is marked complete if not already
        if (
          store.streamingStage !== "error" &&
          store.streamingStage !== "cancelled" &&
          store.streamingStage !== "persisted"
        ) {
          store.setStreamingStage("complete");
        }
      },
      onError: (err) => {
        if (cancelCalledRef.current) {
          // Abort errors are expected when user cancels
          cancelCalledRef.current = false;
          return;
        }
        store.setStreamingError(err.message ?? "An unexpected error occurred");
      },
    });

  const send = useCallback(
    (content: string, params?: Partial<CouncilStreamRequest>) => {
      // Reset streaming state for new request
      store.resetStreaming();
      cancelCalledRef.current = false;

      // Override store params if provided
      if (params?.preset) store.setPreset(params.preset);
      if (params?.council_models)
        store.setCouncilModels(params.council_models);
      if (params?.chairman_model)
        store.setChairmanModel(params.chairman_model);

      sendMessage({ text: content });
    },
    [sendMessage, store]
  );

  const abort = useCallback(() => {
    cancelCalledRef.current = true;
    stop();
    store.setStreamingStage("cancelled");
  }, [stop, store]);

  return {
    /** Send a message to the council */
    send,
    /** Abort the current stream */
    abort,
    /** AI SDK managed messages (transient, for current stream only) */
    messages,
    /** Stream status from AI SDK */
    status,
    /** Whether currently streaming */
    isStreaming: status === "streaming" || status === "submitted",
    /** Current error */
    error,
  };
}
