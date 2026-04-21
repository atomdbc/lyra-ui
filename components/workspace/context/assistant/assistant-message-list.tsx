"use client";

import { ReactNode, useEffect, useRef } from "react";
import { AssistantMessageBubble } from "@/components/workspace/context/assistant/assistant-message-bubble";
import { AiConversationMessage } from "@/hooks/use-ai-conversation";
import { AiTradeEntryDraft } from "@/stores/ai-trade-entry-store";

type Props = {
  messages: AiConversationMessage[];
  empty: ReactNode;
  className?: string;
  onQuickPrompt?: (prompt: string) => void;
  onEnterTrade?: (draft: AiTradeEntryDraft) => void;
};

export function AssistantMessageList({
  messages,
  empty,
  className = "mx-auto flex max-w-[760px] flex-col gap-3",
  onQuickPrompt,
  onEnterTrade,
}: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className={className}>
      {messages.map((message) => (
        <AssistantMessageBubble
          key={message.id}
          message={message}
          onQuickPrompt={onQuickPrompt}
          onEnterTrade={onEnterTrade}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
