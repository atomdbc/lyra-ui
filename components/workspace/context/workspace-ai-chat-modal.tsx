"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowUp, Plus, X } from "lucide-react";
import { useAiCommandSubmission } from "@/hooks/use-ai-command-submission";
import { useAiThreadMessages } from "@/hooks/use-ai-thread-messages";
import { useAiThreads } from "@/hooks/use-ai-threads";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { useAiStore } from "@/stores/ai-store";
import { usePaperPositions } from "@/hooks/use-paper-positions";
import { useAiTradeEntryStore } from "@/stores/ai-trade-entry-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  buildTurnsFromInsights,
  buildTurnsFromMessages,
  mergeChatTurns,
} from "@/components/workspace/context/ai-chat-turns";
import { AiSignalCard } from "@/components/workspace/context/ai-signal-card";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function resizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
}

function getDisplaySymbol(productId: string) {
  return productId?.replace(/-USD$/i, "") || "the market";
}

export function WorkspaceAiChatModal() {
  const open = useUIStore((s) => s.aiChatOpen);
  const close = useUIStore((s) => s.closeAiChat);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");

  const { submitAiCommand } = useAiCommandSubmission();
  const auth = useWorkspaceAuth();
  const { threads, createThread } = useAiThreads();
  const positions = usePaperPositions();
  const currentThreadId = useAiStore((state) => state.currentThreadId);
  const liveInsights = useAiStore((state) => state.insights);
  const messagesQuery = useAiThreadMessages(currentThreadId);
  const openTradeEntry = useAiTradeEntryStore((state) => state.open);
  const activeProductId = useWorkspaceStore((state) => state.activeProductId);
  const activeTimeframe = useWorkspaceStore((state) => state.activeTimeframe);

  const persistedTurns = useMemo(
    () =>
      buildTurnsFromMessages(
        (messagesQuery.data?.messages ?? []).filter(
          (message) => message.role === "user" || message.role === "assistant"
        )
      ),
    [messagesQuery.data?.messages]
  );
  const localTurns = useMemo(
    () => buildTurnsFromInsights(liveInsights, currentThreadId),
    [currentThreadId, liveInsights]
  );
  const turns = useMemo(
    () => mergeChatTurns(persistedTurns, localTurns),
    [persistedTurns, localTurns]
  );
  const currentThread = threads.find((t) => t.id === currentThreadId) ?? null;
  const streaming = turns.some((turn) => turn.status === "streaming");

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);
  useEffect(() => resizeTextarea(inputRef.current), [prompt]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

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

  const symbol = getDisplaySymbol(activeProductId);
  const suggestions = [
    `Quick read on ${symbol} right now`,
    `Anything cleaner than ${symbol} on the ${activeTimeframe}?`,
    `What would flip this bias on ${symbol}?`,
    `How is my book looking?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            Lyra Assistant
          </span>
          <span className="truncate text-[12px] text-foreground/75">
            {currentThread?.title ?? "New thread"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void createThread()}
            className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-2.5 text-[11px] text-foreground/75 transition hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close assistant"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-foreground/55 transition hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="mx-auto flex h-full max-w-[720px] flex-col items-center justify-center px-6 text-center">
            <p className="text-[28px] font-semibold tracking-tight text-foreground/90">
              What should we look at?
            </p>
            <p className="mt-3 max-w-md text-[13px] leading-[1.55] text-foreground/55">
              Ask Lyra about this market, your book, or what else is worth
              trading. Short answers by default — it&apos;ll dig in when you
              ask.
            </p>

            <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void runPrompt(suggestion)}
                  disabled={!auth.authenticated}
                  className={cn(
                    "rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-left text-[12px] text-foreground/75 transition",
                    auth.authenticated
                      ? "hover:border-[var(--line-strong)] hover:text-foreground"
                      : "opacity-50"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[720px] px-4 py-6">
            <div className="flex flex-col gap-8">
              {turns.map((turn) => (
                <div key={turn.id} className="flex flex-col gap-3">
                  {turn.prompt ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-[12px] bg-foreground/[0.06] px-4 py-2.5 text-[14px] leading-[1.55] text-foreground/90">
                        {turn.prompt}
                      </div>
                    </div>
                  ) : null}
                  <AiSignalCard
                    content={turn.response}
                    signal={turn.signal}
                    status={turn.status}
                    onQuickPrompt={(next) => void runPrompt(next)}
                    onEnterTrade={
                      turn.signal &&
                      !positions.some(
                        (position) => position.productId === turn.signal?.productId
                      )
                        ? openTradeEntry
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--line)] bg-background px-4 py-4">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto flex max-w-[720px] items-end gap-2 rounded-[14px] border border-[var(--line-strong)] bg-[var(--panel)] px-4 py-2.5 shadow-[0_2px_0_rgba(0,0,0,0.08)]">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                auth.authenticated ? "Message Lyra…" : "Connect wallet to ask…"
              }
              disabled={!auth.authenticated}
              className="max-h-[200px] min-h-[28px] flex-1 resize-none overflow-y-auto bg-transparent text-[14px] leading-[1.55] text-foreground outline-none placeholder:text-[var(--placeholder)] disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || !auth.authenticated || streaming}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-[720px] text-center text-[10px] text-foreground/35">
            Enter to send · Shift+Enter for newline · Esc to close
          </p>
        </form>
      </footer>
    </div>
  );
}
