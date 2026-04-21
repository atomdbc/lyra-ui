"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/core/market/format";
import { buildTradeStats } from "@/core/paper/trade-stats";
import { usePaperTrades } from "@/hooks/use-paper-trades";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ShareCardModal } from "@/components/workspace/bottom-panel/share-card-modal";

const PNL_EPSILON = 0.00005;

function formatQuantity(value: number) {
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRealizedPnl(value: number, action: "open" | "increase" | "close") {
  if (action === "open") return { label: "Opened", tone: "text-black/46" };
  if (action === "increase") return { label: "Added", tone: "text-black/46" };
  if (Math.abs(value) < PNL_EPSILON) return { label: "Flat", tone: "text-black/48" };
  return {
    label: `${value > 0 ? "+" : ""}${formatPrice(value)}`,
    tone: value > 0 ? "text-emerald-700" : "text-red-700",
  };
}

export function WorkspaceTradesPanel() {
  const trades = usePaperTrades();
  const setActiveProductId = useWorkspaceStore((state) => state.setActiveProductId);
  const recentTrades = useMemo(() => trades.slice(0, 24), [trades]);
  const stats = useMemo(() => buildTradeStats(recentTrades), [recentTrades]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ type: "session_pnl" | "trade_result"; payload: Record<string, unknown> } | null>(null);

  if (trades.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-black/42">
        Open your first trade to get started.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-5 border-b border-black/8">
        <div className="px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/32">Win rate</p>
          <p className="mt-1 text-[12px] font-medium text-black/84">
            {stats.winRate == null ? "N/A" : `${stats.winRate.toFixed(1)}%`}
          </p>
        </div>
        <div className="border-l border-black/6 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/32">Avg RR</p>
          <p className="mt-1 text-[12px] font-medium text-black/84">
            {stats.averageRr == null ? "N/A" : `${stats.averageRr.toFixed(2)}R`}
          </p>
        </div>
        <div className="border-l border-black/6 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/32">Best</p>
          <p className="mt-1 text-[12px] font-medium text-emerald-700">
            {stats.bestTradePnl == null ? "N/A" : `+${formatPrice(stats.bestTradePnl)}`}
          </p>
        </div>
        <div className="border-l border-black/6 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/32">Worst</p>
          <p className="mt-1 text-[12px] font-medium text-red-700">
            {stats.worstTradePnl == null ? "N/A" : formatPrice(stats.worstTradePnl)}
          </p>
        </div>
        <div className="border-l border-black/6 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/32">Today</p>
          <p className={["mt-1 text-[12px] font-medium", stats.dailyPnl >= 0 ? "text-emerald-700" : "text-red-700"].join(" ")}>
            {stats.dailyPnl >= 0 ? "+" : ""}
            {formatPrice(stats.dailyPnl)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/8 px-3 py-2">
        <p className="text-[10px] text-black/58">{recentTrades.length} recent trades</p>
        <button
          type="button"
          onClick={() =>
            setShareModal({
              type: "session_pnl",
              payload: {
                dailyPnl: stats.dailyPnl,
                realizedTotal: stats.realizedTotal,
                winRate: stats.winRate,
                averageRr: stats.averageRr,
              },
            })
          }
          className="h-7 border border-black/10 px-2 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02]"
        >
          Share session
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-[1fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] border-b border-black/8 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-black/32">
        <span>Market</span>
        <span>Action</span>
        <span>Qty</span>
        <span>Price</span>
        <span className="text-right">Result</span>
        <span className="text-right">Time</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {recentTrades.map((trade) => {
          const pnl = formatRealizedPnl(trade.realizedPnl, trade.action);
          const open = selectedTradeId === trade.id;
          return (
            <div key={trade.id} className="border-b border-black/6">
              <button
                type="button"
                onClick={() => {
                  setActiveProductId(trade.productId);
                  setSelectedTradeId((current) => (current === trade.id ? null : trade.id));
                }}
                className="grid w-full grid-cols-[1fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] items-center px-3 py-2 text-left transition hover:bg-black/[0.02]"
              >
                <span className="truncate text-[12px] font-medium text-black/84">{trade.symbol}</span>
                <span className="text-[11px] uppercase text-black/60">{trade.action}</span>
                <span className="text-[11px] text-black/72">{formatQuantity(trade.quantity)}</span>
                <span className="text-[11px] text-black/72">{formatPrice(trade.price)}</span>
                <span className={["text-right text-[11px] font-medium", pnl.tone].join(" ")}>{pnl.label}</span>
                <span className="text-right text-[10px] text-black/40">{formatTimestamp(trade.executedAt)}</span>
              </button>
              {open ? (
                <div className="space-y-2 border-t border-black/6 px-3 py-2 text-[10px] text-black/62">
                  <p>Note: {trade.userNote || "—"}</p>
                  <p>Strategy: {trade.strategyTag || "—"}</p>
                  <p>Planned RR: {trade.plannedRr ? `${trade.plannedRr.toFixed(2)}R` : "—"}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setShareModal({
                        type: "trade_result",
                        payload: {
                          symbol: trade.symbol,
                          action: trade.action,
                          entryPrice: trade.price,
                          realizedPnl: trade.realizedPnl,
                          strategyTag: trade.strategyTag,
                        },
                      })
                    }
                    className="h-7 border border-black/10 px-2 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02]"
                  >
                    Share trade
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <ShareCardModal
        open={Boolean(shareModal)}
        type={shareModal?.type ?? "session_pnl"}
        payload={shareModal?.payload ?? {}}
        onClose={() => setShareModal(null)}
      />
    </div>
  );
}
