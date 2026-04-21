"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createAiThreadRequest,
  streamLyraAiChat,
} from "@/core/services/ai-api";
import {
  createOptimisticAiMessage,
  normalizeAiPrompt,
  updateAiThreadMessages,
} from "@/core/services/ai-chat-cache";
import {
  aiThreadMessagesQueryKey,
  aiThreadsQueryKey,
} from "@/core/services/query-keys";
import { AiSignalSummary } from "@/core/ai/signal";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { useAiStore } from "@/stores/ai-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function useAiCommandSubmission() {
  const auth = useWorkspaceAuth();
  const queryClient = useQueryClient();
  const currentThreadId = useAiStore((state) => state.currentThreadId);
  const upsertThread = useAiStore((state) => state.upsertThread);
  const setCurrentThreadId = useAiStore((state) => state.setCurrentThreadId);

  const submitAiCommand = useCallback(
    async (rawPrompt: string) => {
      const prompt = normalizeAiPrompt(rawPrompt);
      if (!prompt) return null;
      if (!auth.ready || !auth.authenticated) {
        return null;
      }

      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const workspace = useWorkspaceStore.getState();
      const identity = {
        walletAddress: auth.walletAddress,
        email: auth.email,
        displayName: auth.displayName,
      };

      let threadId = currentThreadId;
      if (!threadId) {
        const { thread } = await createAiThreadRequest(
          accessToken,
          {
            selection: {
              workspaceId: workspace.activeWorkspaceId,
              activeProductId: workspace.activeProductId,
              activeTimeframe: workspace.activeTimeframe,
              focusedRegion: workspace.focusedRegion,
            },
          },
          identity
        );
        threadId = thread.id;
        upsertThread(thread);
        setCurrentThreadId(thread.id);
      }

      const userMessageId = `optimistic-user-${Date.now()}`;
      const assistantMessageId = `optimistic-assistant-${Date.now()}`;
      const messagesKey = [...aiThreadMessagesQueryKey, auth.userId, threadId];
      const setMessages = (updater: Parameters<typeof updateAiThreadMessages>[2]) =>
        updateAiThreadMessages(queryClient, messagesKey, updater);

      setMessages((current) => [
        ...current,
        createOptimisticAiMessage({
          id: userMessageId,
          threadId,
          role: "user",
          content: prompt,
        }),
        createOptimisticAiMessage({
          id: assistantMessageId,
          threadId,
          role: "assistant",
          content: "",
          metadata: { optimisticStatus: "streaming" },
        }),
      ]);

      upsertThread({
        ...(useAiStore.getState().threads.find((item) => item.id === threadId) ?? {
          id: threadId,
          workspaceUserId: auth.userId || "",
          workspaceId: workspace.activeWorkspaceId ?? "default",
          title: "New thread",
          titleSource: "system" as const,
          lastResponseId: null,
          createdAt: new Date().toISOString(),
        }),
        activeProductId: workspace.activeProductId,
        activeTimeframe: workspace.activeTimeframe,
        lastMessagePreview: prompt,
        updatedAt: new Date().toISOString(),
      });

      try {
        await streamLyraAiChat(
          accessToken,
          {
            message: prompt,
            threadId,
            selection: {
              workspaceId: workspace.activeWorkspaceId,
              activeProductId: workspace.activeProductId,
              activeTimeframe: workspace.activeTimeframe,
              focusedRegion: workspace.focusedRegion,
            },
            stream: true,
          },
          identity,
          {
            onDelta: ({ delta }) =>
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: `${message.content}${delta}` }
                    : message
                )
              ),
            onDone: ({ threadId: resolvedThreadId, content, responseId, signal }) => {
              if (resolvedThreadId && resolvedThreadId !== threadId) {
                threadId = resolvedThreadId;
                setCurrentThreadId(resolvedThreadId);
              }
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content: content || message.content,
                        metadata: {
                          optimisticStatus: "complete",
                          responseId,
                          signal: signal ?? null,
                        },
                      }
                    : message
                )
              );
              const existingThread = useAiStore.getState().threads.find(
                (item) => item.id === threadId
              );
              if (!existingThread) {
                return;
              }
              upsertThread({
                ...existingThread,
                lastResponseId: responseId,
                lastMessagePreview: content.slice(0, 180) || prompt,
                updatedAt: new Date().toISOString(),
              });
              void queryClient.invalidateQueries({
                queryKey: [...aiThreadsQueryKey, auth.userId],
              });
              void queryClient.invalidateQueries({ queryKey: messagesKey });
            },
          }
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to reach Lyra intelligence.";
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: message,
                  metadata: { optimisticStatus: "error", signal: null as AiSignalSummary | null },
                }
              : item
          )
        );
        return threadId;
      }

      return threadId;
    },
    [auth, currentThreadId, queryClient, setCurrentThreadId, upsertThread]
  );

  return { submitAiCommand };
}
