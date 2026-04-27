"use client";

import { use, useMemo } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useHydrated } from "@/lib/hooks/use-hydrated";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const pendingMessage = useMemo(() => {
    if (!hydrated) {
      return null;
    }

    const pending = sessionStorage.getItem("pendingMessage");
    if (pending) {
      sessionStorage.removeItem("pendingMessage");
    }
    return pending;
  }, [hydrated]);

  return <ChatInterface conversationId={id} pendingMessage={pendingMessage} />;
}
