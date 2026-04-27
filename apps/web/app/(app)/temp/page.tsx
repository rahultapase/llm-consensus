"use client";

import { useState, useEffect } from "react";
import { useCouncilStream } from "@/lib/streaming/use-council-stream";
import { useChatStore } from "@/lib/stores/chat";
import { MessageInput } from "@/components/chat/message-input";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { UserMessage } from "@/components/chat/user-message";

interface TempMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function TempChatPage() {
  const [localMessages, setLocalMessages] = useState<TempMessage[]>([]);
  const { stage1Data, stage2Data, stage3Data, streamingStage, streamingError, resetStreaming } = useChatStore();
  const { send, abort, isStreaming } = useCouncilStream();

  // Clear streaming state on mount
  useEffect(() => {
    resetStreaming();
  }, []);

  // Pick up pending message from session storage
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingMessage");
    if (pending) {
      sessionStorage.removeItem("pendingMessage");
      handleSend(pending);
    }
  }, []);

  function handleSend(content: string) {
    setLocalMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    send(content);
  }

  const showAssistant =
    streamingStage !== "idle" &&
    streamingStage !== "cancelled";

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pt-14">
        <div className="mx-auto max-w-3xl space-y-6">
          {localMessages.length === 0 && !showAssistant && (
            <div className="flex h-full items-center justify-center py-24 text-sm text-muted-foreground/40">
              Temporary chat — nothing is saved
            </div>
          )}
          {localMessages.map((msg) => (
            <UserMessage key={msg.id} content={msg.content} />
          ))}
          {showAssistant && (
            <AssistantMessage
              stage1Data={stage1Data}
              stage2Data={stage2Data}
              stage3Data={stage3Data}
              streamingStage={streamingStage}
              streamingError={streamingError}
            />
          )}
        </div>
      </div>

      <MessageInput
        onSend={handleSend}
        onAbort={abort}
        isStreaming={isStreaming}
      />
    </div>
  );
}
