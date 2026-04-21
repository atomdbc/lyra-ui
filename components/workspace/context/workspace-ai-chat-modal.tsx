"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useAiCommandSubmission } from "@/hooks/use-ai-command-submission";
import { useAiConversation } from "@/hooks/use-ai-conversation";
import { useAiThreads } from "@/hooks/use-ai-threads";
import { usePaperPositions } from "@/hooks/use-paper-positions";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { AssistantComposer } from "@/components/workspace/context/assistant/assistant-composer";
import { AssistantMessageList } from "@/components/workspace/context/assistant/assistant-message-list";
import { useAiTradeEntryStore } from "@/stores/ai-trade-entry-store";
import { useAiStore } from "@/stores/ai-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";

function getDisplaySymbol(productId: string) {
  return productId?.replace(/-USD$/i, "") || "the market";
}

export function WorkspaceAiChatModal() {
  const open = useUIStore((state) => state.aiChatOpen);
  const close = useUIStore((state) => state.closeAiChat);
  const [prompt, setPrompt] = useState("");
  const { submitAiCommand } = useAiCommandSubmission();
  const auth = useWorkspaceAuth();
  const { threads, createThread } = useAiThreads();
  const positions = usePaperPositions();
  const currentThreadId = useAiStore((state) => state.currentThreadId);
  const openTradeEntry = useAiTradeEntryStore((state) => state.open);
  const activeProductId = useWorkspaceStore((state) => state.activeProductId);
  const activeTimeframe = useWorkspaceStore((state) => state.activeTimeframe);
  const conversation = useAiConversation(currentThreadId);

  const currentThread = threads.find((thread) => thread.id === currentThreadId) ?? null;
  const symbol = getDisplaySymbol(activeProductId);
  const suggestions = [
    `Quick read on ${symbol} right now`,
    `Anything cleaner than ${symbol} on the ${activeTimeframe}?`,
    `What would flip this bias on ${symbol}?`,
    "How is my book looking?",
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  if (!open) return null;

  const runPrompt = async (value: string) => {
    const nextPrompt = value.trim();
    if (!nextPrompt) return;
    setPrompt("");
    await submitAiCommand(nextPrompt);
  };

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

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <AssistantMessageList
          messages={conversation.messages}
          className="mx-auto flex max-w-[720px] flex-col gap-4"
          onQuickPrompt={(nextPrompt) => void runPrompt(nextPrompt)}
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
            <div className="mx-auto flex h-full max-w-[720px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[28px] font-semibold tracking-tight text-foreground/90">
                What should we look at?
              </p>
              <p className="mt-3 max-w-md text-[13px] leading-[1.55] text-foreground/55">
                Rebuilt from scratch: messages stream in-place, stay stacked,
                and remain in one timeline per thread.
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
          }
        />
      </main>

      <footer className="border-t border-[var(--line)] bg-background px-4 py-4">
        <AssistantComposer
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => void runPrompt(prompt)}
          disabled={!auth.authenticated}
          streaming={conversation.streaming}
          placeholder={auth.authenticated ? "Message Lyra…" : "Connect wallet to ask…"}
          size="modal"
        />
        <p className="mx-auto mt-2 max-w-[720px] text-center text-[10px] text-foreground/35">
          Enter to send · Shift+Enter for newline · Esc to close
        </p>
      </footer>
    </div>
  );
}
