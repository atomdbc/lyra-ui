"use client";

import { cn } from "@/lib/utils";
import { AiConversationMessage } from "@/hooks/use-ai-conversation";
import { AiSignalCard } from "@/components/workspace/context/ai-signal-card";
import { AiTradeEntryDraft } from "@/stores/ai-trade-entry-store";

type Props = {
  message: AiConversationMessage;
  onQuickPrompt?: (prompt: string) => void;
  onEnterTrade?: (draft: AiTradeEntryDraft) => void;
};

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 text-foreground/45">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
    </span>
  );
}

export function AssistantMessageBubble({
  message,
  onQuickPrompt,
  onEnterTrade,
}: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-[14px] border border-[var(--line-strong)] bg-foreground/[0.05] px-4 py-2.5">
          <p className="whitespace-pre-wrap text-[13px] leading-[1.55] text-foreground/92">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[88%] rounded-[14px] border px-4 py-3",
          message.status === "error"
            ? "border-[var(--negative)]/30 bg-[var(--negative)]/5"
            : "border-[var(--line)] bg-[var(--panel)]"
        )}
      >
        {message.content ? (
          <AiSignalCard
            content={message.content}
            signal={message.signal}
            status={message.status}
            layout="chat"
            onQuickPrompt={onQuickPrompt}
            onEnterTrade={onEnterTrade}
          />
        ) : message.status === "streaming" ? (
          <StreamingDots />
        ) : (
          <p className="text-[13px] leading-[1.55] text-foreground/55">No response yet.</p>
        )}
      </div>
    </div>
  );
}
