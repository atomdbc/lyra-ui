"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, History, Maximize2, Minimize2, Plus, SlidersHorizontal } from "lucide-react";
import { useAiCommandSubmission } from "@/hooks/use-ai-command-submission";
import { usePaperPositions } from "@/hooks/use-paper-positions";
import { useAiThreadMessages } from "@/hooks/use-ai-thread-messages";
import { useAiThreads } from "@/hooks/use-ai-threads";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { useAiTradeEntryStore } from "@/stores/ai-trade-entry-store";
import { useAiStore } from "@/stores/ai-store";
import { AiSignalCard } from "@/components/workspace/context/ai-signal-card";
import {
  buildTurnsFromInsights,
  buildTurnsFromMessages,
  mergeChatTurns,
} from "@/components/workspace/context/ai-chat-turns";
import { WorkspaceAiThreadHistory } from "@/components/workspace/context/workspace-ai-thread-history";
import { WorkspaceAiOpportunitySettings } from "@/components/workspace/context/workspace-ai-opportunity-settings";
import { useUIStore } from "@/stores/ui-store";

function resizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
}

export function WorkspaceAiPanel({ active, detached = false }: { active: boolean; detached?: boolean }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { submitAiCommand } = useAiCommandSubmission();
  const auth = useWorkspaceAuth();
  const { threads, createThread, creatingThread } = useAiThreads();
  const positions = usePaperPositions();
  const currentThreadId = useAiStore((state) => state.currentThreadId);
  const setCurrentThreadId = useAiStore((state) => state.setCurrentThreadId);
  const liveInsights = useAiStore((state) => state.insights);
  const openTradeEntry = useAiTradeEntryStore((state) => state.open);
  const aiPanelDetached = useUIStore((state) => state.aiPanelDetached);
  const detachAiPanel = useUIStore((state) => state.detachAiPanel);
  const dockAiPanel = useUIStore((state) => state.dockAiPanel);
  const messagesQuery = useAiThreadMessages(currentThreadId);

  const persistedTurns = useMemo(
    () =>
      buildTurnsFromMessages(
        (messagesQuery.data?.messages ?? []).filter((message) => message.role === "user" || message.role === "assistant")
      ),
    [messagesQuery.data?.messages]
  );
  const localTurns = useMemo(
    () => buildTurnsFromInsights(liveInsights, currentThreadId),
    [currentThreadId, liveInsights]
  );
  const turns = useMemo(() => {
    return mergeChatTurns(persistedTurns, localTurns);
  }, [localTurns, persistedTurns]);
  const currentThread = threads.find((thread) => thread.id === currentThreadId) ?? null;

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);
  useEffect(() => resizeTextarea(inputRef.current), [prompt]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns]);
  const runPrompt = async (value: string) => {
    const nextPrompt = value.trim();
    if (!nextPrompt) return;
    setPrompt("");
    await submitAiCommand(nextPrompt);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runPrompt(prompt);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void runPrompt(prompt);
    }
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)] px-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.14em] text-foreground/40">Lyra AI</p>
          <p className="truncate text-[12px] font-medium text-foreground/88">{currentThread?.title ?? "New thread"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (detached ? dockAiPanel() : detachAiPanel())}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78"
            aria-label={detached ? "Dock AI panel" : "Detach AI panel"}
          >
            {detached || aiPanelDetached ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
      <WorkspaceAiOpportunitySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {turns.length === 0 ? (
          <div className="flex h-full items-center justify-center px-2">
            <p className="max-w-md text-center text-[12px] leading-[1.5] text-foreground/45">
              {auth.authenticated ? (
                <>
                  Ask about this market or your paper book. Trade ideas only appear inside a{" "}
                  <code className="rounded border border-[var(--line)] px-1 font-mono text-[11px] text-foreground/55">
                    {"<signal>"}
                  </code>{" "}
                  block when there is a concrete edge.
                </>
              ) : (
                "Connect a wallet for workspace-aware answers (positions, balance, activity)."
              )}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[760px] flex-col gap-3">
            {turns.map((turn) => (
              <div key={turn.id} className="space-y-2">
                {turn.prompt ? (
                  <div className="flex justify-end">
                    <div className="max-w-[72%] border border-[var(--line-strong)] bg-foreground/[0.04] px-3 py-2">
                      <p className="text-[12px] leading-[1.5] text-foreground/88">{turn.prompt}</p>
                    </div>
                  </div>
                ) : null}
                <AiSignalCard
                  content={turn.response}
                  signal={turn.signal}
                  status={turn.status}
                  onQuickPrompt={(nextPrompt) => void runPrompt(nextPrompt)}
                  onEnterTrade={
                    turn.signal && !positions.some((position) => position.productId === turn.signal?.productId)
                      ? openTradeEntry
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[var(--line)] px-4 py-3">
        <div className="mx-auto flex max-w-[760px] items-end gap-2 border border-[var(--line-strong)] bg-background px-3 py-2">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message Lyra…"
            className="max-h-[120px] min-h-[22px] flex-1 resize-none overflow-y-auto bg-transparent text-[12px] leading-5 text-foreground outline-none placeholder:text-[var(--placeholder)]"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Send AI prompt"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </section>
  );
}
