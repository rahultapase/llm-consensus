"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChatStore } from "@/lib/stores/chat";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";
import { ScrollToBottom } from "./scroll-to-bottom";
import { cn } from "@/lib/utils";
import type { Stage1Response, Stage2Response, Stage2Metadata, Stage3Response } from "@/lib/streaming/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage1?: Stage1Response[];
  stage2?: { rankings: Stage2Response[]; metadata: Stage2Metadata };
  stage3?: Stage3Response;
}

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    streamingStage,
    stage1Data,
    stage2Data,
    stage3Data,
    streamingError,
  } = useChatStore();

  const isStreaming =
    streamingStage !== "idle" &&
    streamingStage !== "complete" &&
    streamingStage !== "persisted" &&
    streamingStage !== "cancelled" &&
    streamingStage !== "error";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom("smooth");
    }
  }, [messages.length, stage1Data, stage2Data, stage3Data, showScrollButton, scrollToBottom]);

  // Initial scroll — instant
  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  // Track scroll position to show/hide scroll-to-bottom button
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 120);
  }

  // Determine if we should show a live/recently-completed streaming assistant message.
  // Show when actively streaming OR when stage data exists from a completed stream
  // and the last message is a user message (no stored assistant response yet).
  const hasStageData = !!(stage1Data || stage2Data || stage3Data || streamingError);
  const lastMessageIsUser =
    messages.length > 0 && messages[messages.length - 1]?.role === "user";
  const hasLiveStream = (isStreaming || hasStageData) && lastMessageIsUser;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll scrollbar-chat"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
          {messages.map((msg) => {
            if (msg.role === "user") {
              return <UserMessage key={msg.id} content={msg.content} />;
            }

            // Stored assistant message from DB
            return (
              <AssistantMessage
                key={msg.id}
                streamingStage="complete"
                stage1Data={msg.stage1 ?? null}
                stage2Data={msg.stage2 ?? null}
                stage3Data={msg.stage3 ?? null}
                streamingError={null}
              />
            );
          })}

          {/* Live streaming assistant message */}
          {hasLiveStream && (
            <AssistantMessage
              streamingStage={streamingStage}
              stage1Data={stage1Data}
              stage2Data={stage2Data}
              stage3Data={stage3Data}
              streamingError={streamingError}
            />
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      <ScrollToBottom
        visible={showScrollButton}
        onClick={() => {
          setShowScrollButton(false);
          scrollToBottom("smooth");
        }}
      />
    </div>
  );
}
