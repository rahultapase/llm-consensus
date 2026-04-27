"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/lib/stores/chat";
import { MessageInput, type MessageInputHandle } from "@/components/chat/message-input";
import { WelcomeScreen } from "@/components/chat/welcome-screen";

export default function HomePage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setCurrentConversation, isTemporary } = useChatStore();

  const inputRef = useRef<MessageInputHandle>(null);

  const createMutation = useMutation(
    trpc.conversation.create.mutationOptions({
      onSuccess: (conv) => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.list.queryKey(),
        });
        setCurrentConversation(conv.id);
        router.push(`/c/${conv.id}`);
      },
    })
  );

  function handleSend(content: string) {
    sessionStorage.setItem("pendingMessage", content);
    if (isTemporary) {
      router.push("/temp");
    } else {
      createMutation.mutate({});
    }
  }

  return (
    <div className="flex h-full flex-col pt-12">
      <WelcomeScreen onSuggestionClick={(text) => inputRef.current?.setValue(text)} />
      <MessageInput
        ref={inputRef}
        onSend={handleSend}
        onAbort={() => {}}
        isStreaming={createMutation.isPending}
        placeholder="Ask the council…"
      />
    </div>
  );
}

