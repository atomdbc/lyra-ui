"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/core/market/format";
import { useWorkspaceStore } from "@/stores/workspace-store";

type Row = { price: number; size: number; total: number };

// Placeholder depth generator: recomputes on each tick so the orderbook feels
// alive while a real L2 feed is not yet wired up. Bias parameter tilts the
// generated liquidity so the B/S ratio drifts instead of sitting at 50/50.
function buildLevels(mid: number, side: "bids" | "asks", seed: number, bias: number) {
  if (!mid || mid <= 0) return [] as Row[];
  const rows: Row[] = [];
  let running = 0;
  const step = Math.max(0.5, mid * 0.00002);
  for (let i = 0; i < 14; i++) {
    const price = side === "asks" ? mid + (i + 1) * step : mid - (i + 1) * step;
    const noise = Math.sin((i + 1) * (seed * 0.001 + 0.37)) * 0.5 + 1;
    const sideBias = side === "bids" ? 1 + bias : 1 - bias;
    const size = Math.round((8_000 + noise * 60_000) * Math.max(0.25, sideBias));
    running += size;
    rows.push({ price, size, total: running });
  }
  return rows;
}

export function BulkOrderbook() {
  const { activeMarketSnapshot, activeProductId } = useWorkspaceStore();
  const mid = activeMarketSnapshot?.price ?? 0;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Faster heartbeat: ~3 fps keeps the depth bars and B/S meter alive without
    // burning the CPU. When we wire a real feed, this interval goes away.
    const interval = setInterval(() => setTick((value) => value + 1), 320);
    return () => clearInterval(interval);
  }, []);

  // Bias oscillates slowly to simulate buying/selling pressure ebbs.
  const bias = useMemo(() => Math.sin(tick * 0.07) * 0.35, [tick]);

  const asks = useMemo(() => buildLevels(mid, "asks", tick, bias).reverse(), [mid, tick, bias]);
  const bids = useMemo(() => buildLevels(mid, "bids", tick, bias), [mid, tick, bias]);
  const maxTotal = useMemo(
    () => Math.max(1, ...[...asks, ...bids].map((r) => r.total)),
    [asks, bids]
  );

  const bidTotal = useMemo(() => bids.reduce((sum, row) => sum + row.size, 0), [bids]);
  const askTotal = useMemo(() => asks.reduce((sum, row) => sum + row.size, 0), [asks]);
  const bsTotal = bidTotal + askTotal;
  const buyShare = bsTotal > 0 ? bidTotal / bsTotal : 0.5;
  const sellShare = 1 - buyShare;

  return (
    <section className="flex h-full min-h-0 w-full flex-col border-x border-[var(--line)] bg-[var(--panel)]">
      <div className="flex h-8 items-center gap-4 border-b border-[var(--line)] px-2 text-[11px]">
        <button className="font-medium text-foreground/90">Order Book</button>
        <button className="text-foreground/45 hover:text-foreground/80">Trades</button>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-foreground/55">
          <span>USD</span>
          <span>0.1</span>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-[var(--line)] px-2 py-1 text-[9px] uppercase tracking-wider text-foreground/40">
        <span>Price</span>
        <span className="text-right">Size (USD)</span>
        <span className="text-right">Sum (USD)</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-[10px]">
        <div className="flex flex-1 flex-col justify-end overflow-hidden">
          {asks.map((row, i) => (
            <div
              key={`a-${i}`}
              className="relative grid grid-cols-3 px-2 py-[2px] text-[var(--negative)]"
            >
              <div
                className="absolute inset-y-0 right-0 bg-[var(--negative)]/12"
                style={{ width: `${(row.total / maxTotal) * 100}%` }}
              />
              <span className="relative tabular-nums">{formatPrice(row.price)}</span>
              <span className="relative text-right tabular-nums text-foreground/70">
                {row.size.toLocaleString()}
              </span>
              <span className="relative text-right tabular-nums text-foreground/55">
                {row.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-y border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-[12px]">
          <span className="tabular-nums text-[var(--positive)]">{formatPrice(mid)} ↑</span>
          <span className="tabular-nums text-foreground/55">
            {activeProductId ? `Spread 0.00026%` : ""}
          </span>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {bids.map((row, i) => (
            <div
              key={`b-${i}`}
              className="relative grid grid-cols-3 px-2 py-[2px] text-[var(--positive)]"
            >
              <div
                className="absolute inset-y-0 right-0 bg-[var(--positive)]/12"
                style={{ width: `${(row.total / maxTotal) * 100}%` }}
              />
              <span className="relative tabular-nums">{formatPrice(row.price)}</span>
              <span className="relative text-right tabular-nums text-foreground/70">
                {row.size.toLocaleString()}
              </span>
              <span className="relative text-right tabular-nums text-foreground/55">
                {row.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-5 border-t border-[var(--line)] overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[var(--positive)]/15" style={{ width: `${buyShare * 100}%` }} />
        <div className="absolute inset-y-0 right-0 bg-[var(--negative)]/15" style={{ width: `${sellShare * 100}%` }} />
        <div className="relative flex h-full items-center justify-between px-2 text-[10px]">
          <span className="tabular-nums text-[var(--positive)]">
            B {(buyShare * 100).toFixed(2)}%
          </span>
          <span className="tabular-nums text-[var(--negative)]">
            {(sellShare * 100).toFixed(2)}% S
          </span>
        </div>
      </div>
    </section>
  );
}
