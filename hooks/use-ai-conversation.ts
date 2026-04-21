"use client";

import { useMemo } from "react";
import { AiMessage, JsonObject } from "@/core/ai/types";
import { AiSignalSummary } from "@/core/ai/signal";
import { useAiThreadMessages } from "@/hooks/use-ai-thread-messages";

export type AiConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status: "complete" | "streaming" | "error";
  signal: AiSignalSummary | null;
};

function readString(metadata: JsonObject | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function readSignal(metadata: JsonObject | null) {
  const value = metadata?.signal;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AiSignalSummary)
    : null;
}

function normalizeMessage(message: AiMessage): AiConversationMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    status:
      readString(message.metadata, "optimisticStatus") === "streaming"
        ? "streaming"
        : readString(message.metadata, "optimisticStatus") === "error"
          ? "error"
          : "complete",
    signal: readSignal(message.metadata),
  };
}

function sortMessages(messages: AiConversationMessage[]) {
  return [...messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function useAiConversation(threadId: string | null) {
  const query = useAiThreadMessages(threadId);

  const messages = useMemo(
    () =>
      sortMessages(
        (query.data?.messages ?? [])
          .map(normalizeMessage)
          .filter((message): message is AiConversationMessage => Boolean(message))
      ),
    [query.data?.messages]
  );

  return {
    ...query,
    messages,
    streaming: messages.some((message) => message.status === "streaming"),
  };
}
