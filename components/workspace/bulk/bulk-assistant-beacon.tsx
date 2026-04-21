"use client";

import { Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function BulkAssistantBeacon() {
  const openAiChat = useUIStore((state) => state.openAiChat);

  return (
    <button
      type="button"
      onClick={openAiChat}
      aria-label="Open Lyra Assistant"
      className={cn(
        "group fixed bottom-5 left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-[var(--panel)]/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur transition hover:border-yellow-400 hover:bg-[var(--panel-2)]"
      )}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
        <Sparkles className="h-3 w-3" />
        <span className="absolute inset-0 animate-ping rounded-full bg-yellow-400/40" />
      </span>
      <span>Ask Lyra</span>
      <span className="text-[10px] text-foreground/50">
        ⌘ K
      </span>
    </button>
  );
}
