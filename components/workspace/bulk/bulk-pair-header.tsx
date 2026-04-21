"use client";

import { useMarketUniverse } from "@/hooks/use-market-universe";
import { formatPrice, formatPercent, getPercentChange } from "@/core/market/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { BulkMarketPicker } from "@/components/workspace/bulk/bulk-market-picker";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col justify-center">
      <span className="text-[10px] uppercase tracking-[0.08em] text-foreground/40">
        {label}
      </span>
      <span className={`text-[11px] tabular-nums ${accent ?? "text-foreground/85"}`}>
        {value}
      </span>
    </div>
  );
}

export function BulkPairHeader() {
  const { activeProductId, activeMarketSnapshot } = useWorkspaceStore();
  const universe = useMarketUniverse();
  const market = universe.data?.find((m) => m.id === activeProductId) ?? null;

  const price = activeMarketSnapshot?.price ?? market?.current_price ?? 0;
  const change = getPercentChange(activeMarketSnapshot);
  const changeAbs =
    typeof change === "number" && price > 0 ? (price * change) / 100 : null;
  const changeClass =
    typeof change === "number"
      ? change >= 0
        ? "text-[var(--positive)]"
        : "text-[var(--negative)]"
      : "text-foreground/60";

  return (
    <div className="flex min-h-[52px] items-center gap-6 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)] px-3">
      <BulkMarketPicker />

      <div className="flex flex-col justify-center">
        <span className="text-[18px] font-semibold leading-tight tabular-nums text-foreground/95">
          {formatPrice(price)}
        </span>
        <span className={`text-[11px] tabular-nums ${changeClass}`}>
          {changeAbs !== null
            ? `${changeAbs >= 0 ? "+" : "-"}${Math.abs(changeAbs).toFixed(2)}`
            : "—"}{" "}
          {formatPercent(change)}
        </span>
      </div>

      <Stat label="Last Price" value={formatPrice(price)} />
      <Stat label="Oracle" value={formatPrice(price)} />
      <Stat
        label="24h Volume"
        value={
          market?.exchange_volume_24h
            ? `$${Math.round(market.exchange_volume_24h).toLocaleString()}`
            : "—"
        }
      />
      <Stat
        label="Open Interest"
        value={
          market?.open_interest
            ? `$${Math.round(market.open_interest).toLocaleString()}`
            : "—"
        }
      />
      <Stat label="Funding/Countdown" value="—" />
      <Stat label="Max Leverage" value={market?.max_leverage ? `${market.max_leverage}x` : "—"} />
      <Stat label="24h High" value={formatPrice(activeMarketSnapshot?.high24h)} />
      <Stat label="24h Low" value={formatPrice(activeMarketSnapshot?.low24h)} />
    </div>
  );
}
