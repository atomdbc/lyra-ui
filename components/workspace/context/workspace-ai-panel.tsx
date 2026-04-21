"use client";

import { useState } from "react";
import {
  History,
  Maximize2,
  Minimize2,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useAiCommandSubmission } from "@/hooks/use-ai-command-submission";
import { useAiConversation } from "@/hooks/use-ai-conversation";
import { useAiThreads } from "@/hooks/use-ai-threads";
import { usePaperPositions } from "@/hooks/use-paper-positions";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { AssistantComposer } from "@/components/workspace/context/assistant/assistant-composer";
import { AssistantMessageList } from "@/components/workspace/context/assistant/assistant-message-list";
import { WorkspaceAiOpportunitySettings } from "@/components/workspace/context/workspace-ai-opportunity-settings";
import { WorkspaceAiThreadHistory } from "@/components/workspace/context/workspace-ai-thread-history";
import { useAiTradeEntryStore } from "@/stores/ai-trade-entry-store";
import { useAiStore } from "@/stores/ai-store";
import { useUIStore } from "@/stores/ui-store";

export function WorkspaceAiPanel({
  active,
  detached = false,
}: {
  active: boolean;
  detached?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { submitAiCommand } = useAiCommandSubmission();
  const auth = useWorkspaceAuth();
  const { threads, createThread, creatingThread } = useAiThreads();
  const positions = usePaperPositions();
  const currentThreadId = useAiStore((state) => state.currentThreadId);
  const setCurrentThreadId = useAiStore((state) => state.setCurrentThreadId);
  const openTradeEntry = useAiTradeEntryStore((state) => state.open);
  const aiPanelDetached = useUIStore((state) => state.aiPanelDetached);
  const detachAiPanel = useUIStore((state) => state.detachAiPanel);
  const dockAiPanel = useUIStore((state) => state.dockAiPanel);
  const conversation = useAiConversation(currentThreadId);

  const currentThread = threads.find((thread) => thread.id === currentThreadId) ?? null;

  const runPrompt = async () => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;
    setPrompt("");
    await submitAiCommand(nextPrompt);
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)] px-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.14em] text-foreground/40">Lyra AI</p>
          <p className="truncate text-[12px] font-medium text-foreground/88">
            {currentThread?.title ?? "New thread"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (detached ? dockAiPanel() : detachAiPanel())}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78"
            aria-label={detached ? "Dock AI panel" : "Detach AI panel"}
          >
            {detached || aiPanelDetached ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(false);
              setHistoryOpen((value) => !value);
            }}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78"
            aria-label="Show AI thread history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setHistoryOpen(false);
              setSettingsOpen((value) => !value);
            }}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78"
            aria-label="Open AI opportunity settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void createThread()}
            disabled={creatingThread}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78 disabled:text-foreground/22"
            aria-label="Start a new AI thread"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <WorkspaceAiThreadHistory
        open={historyOpen}
        threads={threads}
        currentThreadId={currentThreadId}
        onSelect={(threadId) => {
          setCurrentThreadId(threadId);
          setHistoryOpen(false);
        }}
        onCreate={() => {
          void createThread();
          setHistoryOpen(false);
        }}
      />
      <WorkspaceAiOpportunitySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <AssistantMessageList
          messages={conversation.messages}
          onQuickPrompt={(nextPrompt) => void submitAiCommand(nextPrompt)}
          onEnterTrade={(draft) => {
            if (
              !draft.signal ||
              positions.some((position) => position.productId === draft.signal?.productId)
            ) {
              return;
            }
            openTradeEntry(draft);
          }}
          empty={
            <div className="flex h-full items-center justify-center px-2">
              <p className="max-w-md text-center text-[12px] leading-[1.5] text-foreground/45">
                {auth.authenticated
                  ? "Rebuilt from scratch: one message timeline, live streaming, and no disappearing turns. Ask about this market or your paper book."
                  : "Connect a wallet for workspace-aware answers (positions, balance, activity)."}
              </p>
            </div>
          }
        />
      </div>

      <div className="border-t border-[var(--line)] px-4 py-3">
        <AssistantComposer
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => void runPrompt()}
          disabled={!auth.authenticated || !active}
          streaming={conversation.streaming}
          placeholder={
            auth.authenticated ? "Message Lyra…" : "Connect wallet to ask…"
          }
          size="panel"
        />
      </div>
    </section>
  );
}
