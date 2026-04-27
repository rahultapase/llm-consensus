"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/lib/stores/chat";
import { useCouncilStream } from "@/lib/streaming/use-council-stream";
import { MessageList } from "./message-list";
import { MessageInput, type MessageInputHandle } from "./message-input";
import { WelcomeScreen } from "./welcome-screen";
import type { Stage1Response, Stage2Response, Stage2Metadata, AggregateRanking, Stage3Response } from "@/lib/streaming/types";

interface ChatInterfaceProps {
  conversationId: string | null;
  pendingMessage?: string | null;
}

export function ChatInterface({ conversationId, pendingMessage }: ChatInterfaceProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setCurrentConversation, setGeneratedTitle, generatedTitle, streamingStage, stage1Data } =
    useChatStore();

  const { send, abort, isStreaming } = useCouncilStream();

  // ── Pending user message ──────────────────────────────────────────────────
  // We track the user's message locally instead of relying on the AI SDK's
  // internal messages array (which uses temporary IDs that never match the DB
  // UUIDs, causing the duplicate-entry bug on query refresh).
  const [pendingUserMsg, setPendingUserMsg] = useState<string | null>(null);
  // Remember how many assistant turns existed in DB at send time so we can
  // detect when the new turn has been persisted.
  const dbAssistantCountAtSendRef = useRef(0);

  // Keep the store in sync with the route param
  useEffect(() => {
    setCurrentConversation(conversationId);
  }, [conversationId, setCurrentConversation]);

  // Load conversation from DB if we have an ID
  const { data: conversation } = useQuery({
    ...trpc.conversation.byId.queryOptions({ id: conversationId! }),
    enabled: !!conversationId,
  });

  // Update the title in DB when the stream generates one
  const updateTitleMutation = useMutation(
    trpc.conversation.updateTitle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.list.queryKey(),
        });
        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: trpc.conversation.byId.queryKey({ id: conversationId }),
          });
        }
      },
    })
  );

  useEffect(() => {
    if (generatedTitle && conversationId) {
      updateTitleMutation.mutate({ id: conversationId, title: generatedTitle });
      setGeneratedTitle("");
    }
  }, [generatedTitle, conversationId]);

  // When the route handler signals the DB insert is done, refresh the
  // conversation so the persisted messages replace the optimistic ones.
  useEffect(() => {
    if (streamingStage === "persisted" && conversationId) {
      queryClient.invalidateQueries({
        queryKey: trpc.conversation.byId.queryKey({ id: conversationId }),
      });
    }
  }, [streamingStage, conversationId]);

  // Handle cancellation (Stop button):
  //  • Before Stage 1 completes → nothing was persisted; clear the optimistic
  //    pending user message so the UI resets to its initial state.
  //  • After Stage 1+ completed → server persisted whatever stages finished;
  //    re-query the DB after a short delay so the persisted data replaces the
  //    live streaming state in the UI.
  useEffect(() => {
    if (streamingStage !== "cancelled" || !conversationId) return;
    if (stage1Data) {
      // Some stages completed → server is persisting async → refresh DB
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.byId.queryKey({ id: conversationId }),
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [streamingStage, conversationId, stage1Data]);

  // Group DB messages into turns: each turn = user msg OR assistant turn (council+ranking+synthesis)
  const allDbMsgs = conversation?.messages ?? [];
  const dbMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    stage1?: Stage1Response[];
    stage2?: { rankings: Stage2Response[]; metadata: Stage2Metadata };
    stage3?: Stage3Response;
  }> = [];

  let msgIdx = 0;
  while (msgIdx < allDbMsgs.length) {
    const msg = allDbMsgs[msgIdx];
    if (msg.role === "user") {
      dbMessages.push({ id: msg.id, role: "user", content: msg.content ?? "" });
      msgIdx++;
      continue;
    }
    // Collect consecutive assistant messages as one turn
    const turnMsgs: typeof allDbMsgs = [];
    while (msgIdx < allDbMsgs.length && allDbMsgs[msgIdx].role !== "user") {
      turnMsgs.push(allDbMsgs[msgIdx]);
      msgIdx++;
    }
    const councilMsg = turnMsgs.find((m) => m.stage === "council");
    const rankingMsg = turnMsgs.find((m) => m.stage === "ranking");
    const synthesisMsg = turnMsgs.find((m) => m.stage === "synthesis");
    const turnId = synthesisMsg?.id ?? rankingMsg?.id ?? councilMsg?.id ?? turnMsgs[0]?.id;
    if (!turnId) continue;

    const meta1 = councilMsg?.metadata as { responses: Stage1Response[] } | null;
    const meta2 = rankingMsg?.metadata as { rankings: Stage2Response[]; label_to_model: Record<string, string>; aggregate_rankings: AggregateRanking[] } | null;
    const meta3 = synthesisMsg?.metadata as Stage3Response | null;

    dbMessages.push({
      id: turnId,
      role: "assistant",
      content: synthesisMsg?.content ?? "",
      stage1: meta1?.responses ?? undefined,
      stage2: meta2
        ? { rankings: meta2.rankings, metadata: { label_to_model: meta2.label_to_model, aggregate_rankings: meta2.aggregate_rankings } }
        : undefined,
      stage3: meta3 ?? undefined,
    });
  }

  // Clear the pending message once the DB has a new assistant turn, which
  // means the full exchange (user + all stage messages) has been persisted.
  const dbAssistantCount = dbMessages.filter((m) => m.role === "assistant").length;
  useEffect(() => {
    if (pendingUserMsg && dbAssistantCount > dbAssistantCountAtSendRef.current) {
      setPendingUserMsg(null);
    }
  }, [dbAssistantCount, pendingUserMsg]);

  const visiblePendingUserMsg =
    streamingStage === "cancelled" && !stage1Data ? null : pendingUserMsg;

  // Build the final message list: DB messages + the optimistic pending user
  // message (only while the turn hasn't been persisted yet).
  const mergedMessages = [
    ...dbMessages,
    ...(visiblePendingUserMsg
      ? [{ id: "pending-user", role: "user" as const, content: visiblePendingUserMsg }]
      : []),
  ];

  // Wrap send so we capture the pending message for optimistic display.
  const handleSend = useCallback((content: string) => {
    dbAssistantCountAtSendRef.current = dbAssistantCount;
    setPendingUserMsg(content);
    send(content);
  }, [dbAssistantCount, send]);

  // Auto-send pending message (from home page → new conversation flow)
  useEffect(() => {
    if (pendingMessage && conversationId) {
      const timer = setTimeout(() => handleSend(pendingMessage), 50);
      return () => clearTimeout(timer);
    }
  }, [pendingMessage, conversationId]);

  const inputRef = useRef<MessageInputHandle>(null);
  const isEmpty = mergedMessages.length === 0 && !isStreaming;

  return (
    <div className="flex h-full flex-col pt-12">

      {isEmpty ? (
        <WelcomeScreen
          onSuggestionClick={(text) => inputRef.current?.setValue(text)}
        />
      ) : (
        <MessageList messages={mergedMessages} className="flex-1 min-h-0" />
      )}

      <div className="mt-auto">
        <MessageInput
          ref={inputRef}
          onSend={handleSend}
          onAbort={abort}
          isStreaming={isStreaming}
          disabled={!conversationId}
        />
      </div>
    </div>
  );
}
