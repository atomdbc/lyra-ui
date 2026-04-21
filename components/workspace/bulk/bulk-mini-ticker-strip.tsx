"use client";

import { useMarketUniverse } from "@/hooks/use-market-universe";
import { formatPrice, formatPercent, getPercentChange } from "@/core/market/format";
import { useWorkspaceStore } from "@/stores/workspace-store";

const WATCH: string[] = ["SOL-USD", "ETH-USD", "BTC-USD"];

export function BulkMiniTickerStrip() {
  const { data } = useMarketUniverse();
  const setActiveProductId = useWorkspaceStore((state) => state.setActiveProductId);

  if (!data) return <div className="h-7 border-b border-[var(--line)] bg-[var(--panel)]" />;

  return (
    <div className="flex h-7 items-center gap-4 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)] px-3 text-[10px]">
      {WATCH.map((id) => {
        const market = data.find((m) => m.id === id);
        if (!market) return null;
        const change = getPercentChange({
          price: market.current_price ?? 0,
          open24h:
            typeof market.price_change_percentage_24h === "number" && market.current_price
              ? market.current_price / (1 + market.price_change_percentage_24h / 100)
              : market.current_price ?? 0,
        });
        const changeClass =
          typeof change === "number"
            ? change >= 0
              ? "text-[var(--positive)]"
              : "text-[var(--negative)]"
            : "text-foreground/40";
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveProductId(id)}
            className="inline-flex items-center gap-1 text-foreground/70 hover:text-foreground/90"
          >
            <span className="font-medium">{market.symbol}-USD</span>
            <span className="tabular-nums text-foreground/50">
              {formatPrice(market.current_price ?? undefined)}
            </span>
            <span className={["tabular-nums", changeClass].join(" ")}>{formatPercent(change)}</span>
          </button>
        );
      })}
    </div>
  );
}
