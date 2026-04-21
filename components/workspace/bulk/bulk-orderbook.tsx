"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/core/market/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useLiveMarketTrades } from "@/hooks/use-live-market-trades";
import { cn } from "@/lib/utils";

type Tab = "book" | "trades";
type Row = { price: number; size: number; total: number };

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

function timeLabel(ms: number) {
  const date = new Date(ms);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function BulkOrderbook() {
  const { activeMarketSnapshot, activeProductId } = useWorkspaceStore();
  const mid = activeMarketSnapshot?.price ?? 0;
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<Tab>("book");

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 320);
    return () => clearInterval(interval);
  }, []);

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

  const liveTrades = useLiveMarketTrades(activeProductId || null, 80);

  return (
    <section className="flex h-full min-h-0 w-full flex-col border-x border-[var(--line)] bg-[var(--panel)]">
      <div className="flex h-8 items-center gap-4 border-b border-[var(--line)] px-2 text-[11px]">
        <button
          type="button"
          onClick={() => setTab("book")}
          className={cn(
            "font-medium transition",
            tab === "book" ? "text-foreground" : "text-foreground/45 hover:text-foreground/80"
          )}
        >
          Order Book
        </button>
        <button
          type="button"
          onClick={() => setTab("trades")}
          className={cn(
            "font-medium transition",
            tab === "trades" ? "text-foreground" : "text-foreground/45 hover:text-foreground/80"
          )}
        >
          Trades
        </button>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-foreground/55">
          <span>USD</span>
          <span>0.1</span>
        </div>
      </div>

      {tab === "book" ? (
        <>
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
            <div
              className="absolute inset-y-0 left-0 bg-[var(--positive)]/15"
              style={{ width: `${buyShare * 100}%` }}
            />
            <div
              className="absolute inset-y-0 right-0 bg-[var(--negative)]/15"
              style={{ width: `${sellShare * 100}%` }}
            />
            <div className="relative flex h-full items-center justify-between px-2 text-[10px]">
              <span className="tabular-nums text-[var(--positive)]">
                B {(buyShare * 100).toFixed(2)}%
              </span>
              <span className="tabular-nums text-[var(--negative)]">
                {(sellShare * 100).toFixed(2)}% S
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 border-b border-[var(--line)] px-2 py-1 text-[9px] uppercase tracking-wider text-foreground/40">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto text-[11px]">
            {liveTrades.length === 0 ? (
              <div className="flex h-full items-center justify-center py-6 text-[11px] text-foreground/45">
                Waiting for trades…
              </div>
            ) : (
              liveTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-3 px-2 py-[2px] text-[10px] tabular-nums"
                >
                  <span
                    className={cn(
                      trade.side === "buy"
                        ? "text-[var(--positive)]"
                        : "text-[var(--negative)]"
                    )}
                  >
                    {formatPrice(trade.price)}
                  </span>
                  <span className="text-right text-foreground/75">
                    {trade.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-right text-foreground/50">
                    {timeLabel(trade.timestampMs)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
