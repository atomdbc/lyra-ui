import { QueryClient } from "@tanstack/react-query";
import { AiMessage, JsonObject } from "@/core/ai/types";

export function normalizeAiPrompt(input: string) {
  return input.startsWith("/") ? input.slice(1).trim() : input.trim();
}

export function createOptimisticAiMessage(input: {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: JsonObject | null;
}) {
  return {
    id: input.id,
    threadId: input.threadId,
    role: input.role,
    content: input.content,
    toolName: null,
    toolCallId: null,
    metadata: input.metadata ?? null,
    createdAt: new Date().toISOString(),
  } satisfies AiMessage;
}

export function updateAiThreadMessages(
  queryClient: QueryClient,
  queryKey: ReadonlyArray<unknown>,
  updater: (current: AiMessage[]) => AiMessage[]
) {
  queryClient.setQueryData<{ messages: AiMessage[] }>(queryKey, (current) => ({
    messages: updater(current?.messages ?? []),
  }));
}
