"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUIStore } from "@/stores/ui-store";
import { useLiveMarketTickers } from "@/hooks/use-live-market-tickers";

const READS: Array<(symbol: string, pct: number) => string> = [
  (symbol, pct) =>
    `${symbol} holding the ${Math.abs(pct).toFixed(2)}% range — wait for a cleaner trigger before adding risk.`,
  (symbol) =>
    `${symbol} looks like a mean-reversion candidate; only act if volume expands with the move.`,
  (symbol, pct) =>
    pct >= 0
      ? `${symbol} is up on the session — watch if buyers defend the prior high on a retest.`
      : `${symbol} is soft — fading the bounce looks cleaner than chasing the drop.`,
  (symbol) =>
    `${symbol}: no trade until structure confirms. Assistant is tracking levels quietly.`,
];

export function BulkMarketReadCard() {
  const { activeProductId, activeMarketSnapshot } = useWorkspaceStore();
  const openAiChat = useUIStore((state) => state.openAiChat);
  const tickers = useLiveMarketTickers([activeProductId].filter(Boolean) as string[]);
  const live = tickers[activeProductId];
  const symbol = (activeProductId || "BTC").replace(/-USD$/i, "");
  const price = live?.price ?? activeMarketSnapshot?.price ?? 0;
  const open24h = activeMarketSnapshot?.open24h ?? price;
  const pct = open24h ? ((price - open24h) / open24h) * 100 : 0;
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursor((value) => (value + 1) % READS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const read = useMemo(() => READS[cursor](symbol, pct), [cursor, symbol, pct]);

  return (
    <div className="border-b border-[var(--line)] bg-gradient-to-b from-yellow-500/5 to-transparent px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
          <Sparkles className="h-3 w-3" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-yellow-400/90">
          Lyra read · live
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[10px] tabular-nums",
            pct >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          {pct >= 0 ? "+" : ""}
          {pct.toFixed(2)}%
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-foreground/85">{read}</p>
      <button
        type="button"
        onClick={openAiChat}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-yellow-400 transition hover:text-yellow-300"
      >
        Ask Lyra for a deeper read
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
