"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/core/market/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePaperAccountSummary } from "@/hooks/use-paper-account-summary";
import { usePaperTradeActions } from "@/hooks/use-paper-trade-actions";
import { useDemoAccount } from "@/hooks/use-demo-account";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getApproxLiquidationPrice,
  getEffectivePositionNotional,
} from "@/core/paper/leverage";
import {
  getPositionCurrentPrice,
  getPositionUnrealizedPnl,
} from "@/core/paper/metrics";
import type { PaperTrade } from "@/core/paper/types";
import {
  BulkPositionDetailDialog,
  type BulkPositionDetailRow,
} from "@/components/workspace/bulk/bulk-position-detail-dialog";
import { BulkTabStubDialog, type BulkStubTab } from "@/components/workspace/bulk/bulk-tab-stub-dialog";

type BulkTab =
  | "Positions"
  | "Radar"
  | "Open Orders"
  | "Balances"
  | "Order History"
  | "Trade History"
  | "Funding History"
  | "Position History";

const TABS: BulkTab[] = [
  "Positions",
  "Radar",
  "Open Orders",
  "Balances",
  "Order History",
  "Trade History",
  "Funding History",
  "Position History",
];

const STUB_TABS = new Set<BulkStubTab>([
  "Open Orders",
  "Order History",
  "Funding History",
  "Position History",
]);

function isStubTab(tab: BulkTab): tab is BulkStubTab {
  return STUB_TABS.has(tab as BulkStubTab);
}

import { BulkRadarPanel } from "@/components/workspace/bulk/bulk-radar-panel";

function TradeFillDetailDialog({
  trade,
  open,
  onOpenChange,
}: {
  trade: PaperTrade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!trade) return null;
  return (
    <Dialog open={open && !!trade} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(400px,calc(100vw-24px))] rounded-2xl border-[var(--line-strong)] bg-[var(--panel)] p-0 sm:max-w-[400px]">
        <DialogHeader className="border-b border-[var(--line)] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/[0.08] ring-1 ring-foreground/10">
              <Image src="/lyra.svg" alt="Lyra" width={22} height={22} className="opacity-95" unoptimized />
            </div>
            <div>
              <DialogTitle className="text-left text-[13px] font-semibold">Fill details</DialogTitle>
              <p className="mt-0.5 text-[11px] text-foreground/50">{trade.symbol}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-2 px-4 pb-4 pt-3 text-[12px]">
          <Row label="Trade ID" value={<span className="break-all font-mono text-[10px]">{trade.id}</span>} />
          <Row label="Action" value={<span className="capitalize">{trade.action}</span>} />
          <Row label="Quantity" value={<span className="font-mono tabular-nums">{trade.quantity.toFixed(4)}</span>} />
          <Row label="Price" value={<span className="font-mono tabular-nums">{formatPrice(trade.price)}</span>} />
          <Row
            label="Realized PnL"
            value={
              <span
                className={cn(
                  "font-mono tabular-nums",
                  trade.realizedPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                )}
              >
                {trade.realizedPnl >= 0 ? "+" : ""}
                {formatPrice(trade.realizedPnl)}
              </span>
            }
          />
          <Row
            label="Time"
            value={<span className="text-foreground/65">{new Date(trade.executedAt).toLocaleString()}</span>}
          />
          {trade.note ? (
            <Row label="Note" value={<span className="text-foreground/60">{trade.note}</span>} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-foreground/[0.06] py-1.5 last:border-0">
      <span className="shrink-0 text-foreground/45">{label}</span>
      <div className="min-w-0 text-right text-foreground/90">{value}</div>
    </div>
  );
}

function BalanceSnapshotDialog({
  open,
  onOpenChange,
  currency,
  balance,
  equity,
  unrealizedPnl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  balance: number;
  equity: number;
  unrealizedPnl: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(400px,calc(100vw-24px))] rounded-2xl border-[var(--line-strong)] bg-[var(--panel)] p-0 sm:max-w-[400px]">
        <DialogHeader className="border-b border-[var(--line)] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/[0.08] ring-1 ring-foreground/10">
              <Image src="/lyra.svg" alt="Lyra" width={22} height={22} className="opacity-95" unoptimized />
            </div>
            <DialogTitle className="text-left text-[13px] font-semibold">Paper balance</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-1 px-4 pb-4 pt-3 text-[12px]">
          <Row label="Asset" value={currency} />
          <Row
            label="Cash"
            value={<span className="font-mono tabular-nums">${balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>}
          />
          <Row
            label="Equity"
            value={<span className="font-mono tabular-nums">${equity.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>}
          />
          <Row
            label="Unrealized PnL"
            value={
              <span
                className={cn(
                  "font-mono tabular-nums",
                  unrealizedPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                )}
              >
                {unrealizedPnl >= 0 ? "+" : ""}$
                {Math.abs(unrealizedPnl).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
            }
          />
          <p className="pt-2 text-[11px] leading-relaxed text-foreground/50">
            Equity includes open paper positions marked to the live feed. Cash moves when you open, add margin, or
            close.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center text-[11px] text-foreground/40">
      {message}
    </div>
  );
}

function PositionsPanel({ currentMarketOnly }: { currentMarketOnly: boolean }) {
  const { positions: livePositions, markets, trades: liveTrades } = usePaperAccountSummary();
  const demo = useDemoAccount();
  const positions = demo.active ? demo.positions : livePositions;
  const trades = useMemo(() => (demo.active ? [] : liveTrades), [demo.active, liveTrades]);
  const { activeProductId } = useWorkspaceStore();
  const tradeMutation = usePaperTradeActions();
  const [detailRow, setDetailRow] = useState<BulkPositionDetailRow | null>(null);

  const tradesByProduct = useMemo(() => {
    const map = new Map<string, PaperTrade[]>();
    for (const t of trades) {
      const list = map.get(t.productId) ?? [];
      list.push(t);
      map.set(t.productId, list);
    }
    return map;
  }, [trades]);

  const rows = useMemo(
    () =>
      (currentMarketOnly
        ? positions.filter((position) => position.productId === activeProductId)
        : positions
      ).map((position) => {
        const currentPrice = getPositionCurrentPrice(position, markets);
        const unrealized = getPositionUnrealizedPnl(position, markets);
        const notional = getEffectivePositionNotional(position.marginUsed, position.leverage);
        const roePercent = position.marginUsed > 0 ? (unrealized / position.marginUsed) * 100 : 0;
        const liq = getApproxLiquidationPrice({
          direction: position.direction,
          entryPrice: position.entryPrice,
          leverage: position.leverage,
        });
        return { position, currentPrice, unrealized, notional, roePercent, liq };
      }),
    [positions, markets, currentMarketOnly, activeProductId]
  );

  if (!rows.length) return <EmptyRow message="You have no positions yet." />;

  const dialogTrades = detailRow ? (tradesByProduct.get(detailRow.position.productId) ?? []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-[11px]">
      <BulkPositionDetailDialog
        open={detailRow !== null}
        onOpenChange={(next) => {
          if (!next) setDetailRow(null);
        }}
        row={detailRow}
        symbolTrades={dialogTrades}
      />
      <div className="grid shrink-0 grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_0.6fr] border-b border-[var(--line)] px-3 py-1.5 text-[9px] uppercase tracking-wider text-foreground/40">
        <span>Market</span>
        <span className="text-right">Size</span>
        <span className="text-right">Entry</span>
        <span className="text-right">Mark</span>
        <span className="text-right">PnL</span>
        <span className="text-right">ROE %</span>
        <span className="text-right">Liq. Price</span>
        <span className="text-right">Margin</span>
        <span className="text-right">Close</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map(({ position, currentPrice, unrealized, notional, roePercent, liq }) => (
          <div
            key={position.id}
            role="button"
            tabIndex={0}
            onClick={() =>
              setDetailRow({ position, currentPrice, unrealized, notional, roePercent, liq })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDetailRow({ position, currentPrice, unrealized, notional, roePercent, liq });
              }
            }}
            className="grid cursor-pointer grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_0.6fr] border-b border-[var(--line)] px-3 py-2 transition hover:bg-foreground/[0.05]"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground/90">{position.symbol}</span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  position.direction === "long"
                    ? "text-[var(--positive)]"
                    : "text-[var(--negative)]"
                )}
              >
                {position.direction} {position.leverage}x
              </span>
            </div>
            <span className="text-right tabular-nums text-foreground/80">
              {position.quantity.toFixed(4)}
            </span>
            <span className="text-right tabular-nums text-foreground/70">
              {formatPrice(position.entryPrice)}
            </span>
            <span className="text-right tabular-nums text-foreground/70">
              {formatPrice(currentPrice)}
            </span>
            <span
              className={cn(
                "text-right tabular-nums font-medium",
                unrealized >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {unrealized >= 0 ? "+" : ""}
              {formatPrice(unrealized)}
            </span>
            <span
              className={cn(
                "text-right tabular-nums",
                roePercent >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {roePercent >= 0 ? "+" : ""}
              {roePercent.toFixed(2)}%
            </span>
            <span className="text-right tabular-nums text-foreground/60">
              {liq ? formatPrice(liq) : "—"}
            </span>
            <span className="text-right tabular-nums text-foreground/60">
              ${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tradeMutation.mutate({
                    action: "close",
                    productId: position.productId,
                    symbol: position.symbol,
                    quantity: position.quantity,
                    price: currentPrice,
                    note: "Closed from terminal",
                  });
                }}
                className="rounded-[4px] border border-[var(--line-strong)] bg-[var(--panel-2)] px-2 py-0.5 text-[10px] font-medium text-foreground/85 transition hover:bg-foreground/[0.05]"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeHistoryPanel({ currentMarketOnly }: { currentMarketOnly: boolean }) {
  const { trades } = usePaperAccountSummary();
  const { activeProductId } = useWorkspaceStore();
  const [tradeDetail, setTradeDetail] = useState<PaperTrade | null>(null);

  const rows = useMemo(
    () => (currentMarketOnly ? trades.filter((trade) => trade.productId === activeProductId) : trades),
    [trades, currentMarketOnly, activeProductId]
  );
  if (!rows.length) return <EmptyRow message="No trades yet." />;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-[11px]">
      <TradeFillDetailDialog
        trade={tradeDetail}
        open={tradeDetail !== null}
        onOpenChange={(next) => {
          if (!next) setTradeDetail(null);
        }}
      />
      <div className="grid shrink-0 grid-cols-[1fr_0.8fr_1fr_1fr_1fr_1.2fr] border-b border-[var(--line)] px-3 py-1.5 text-[9px] uppercase tracking-wider text-foreground/40">
        <span>Market</span>
        <span>Action</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Price</span>
        <span className="text-right">Realized</span>
        <span className="text-right">Time</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((trade) => (
          <div
            key={trade.id}
            role="button"
            tabIndex={0}
            onClick={() => setTradeDetail(trade)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTradeDetail(trade);
              }
            }}
            className="grid cursor-pointer grid-cols-[1fr_0.8fr_1fr_1fr_1fr_1.2fr] border-b border-[var(--line)] px-3 py-2 text-foreground/80 transition hover:bg-foreground/[0.05]"
          >
            <span className="font-medium">{trade.symbol}</span>
            <span className="capitalize text-foreground/70">{trade.action}</span>
            <span className="text-right tabular-nums">{trade.quantity.toFixed(4)}</span>
            <span className="text-right tabular-nums">{formatPrice(trade.price)}</span>
            <span
              className={cn(
                "text-right tabular-nums",
                trade.realizedPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {trade.realizedPnl >= 0 ? "+" : ""}
              {formatPrice(trade.realizedPnl)}
            </span>
            <span className="text-right tabular-nums text-foreground/55">
              {new Date(trade.executedAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalancesPanel() {
  const { account, equity: liveEquity, unrealizedPnl: liveUnrealized } = usePaperAccountSummary();
  const demo = useDemoAccount();
  const [balanceModal, setBalanceModal] = useState(false);
  const currency = account?.currency ?? "USDT";
  const balance = account?.cashBalance ?? (demo.active ? demo.balance : 0);
  const equity = demo.active ? demo.equity : liveEquity;
  const unrealizedPnl = demo.active ? demo.unrealizedPnl : liveUnrealized;

  if (!account && !demo.active)
    return <EmptyRow message="Connect wallet to load paper balances." />;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-[11px]">
      <BalanceSnapshotDialog
        open={balanceModal}
        onOpenChange={setBalanceModal}
        currency={currency}
        balance={balance}
        equity={equity}
        unrealizedPnl={unrealizedPnl}
      />
      <div className="grid shrink-0 grid-cols-4 border-b border-[var(--line)] px-3 py-1.5 text-[9px] uppercase tracking-wider text-foreground/40">
        <span>Asset</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Equity</span>
        <span className="text-right">Unrealized PnL</span>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setBalanceModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setBalanceModal(true);
          }
        }}
        className="grid cursor-pointer grid-cols-4 border-b border-[var(--line)] px-3 py-2 text-foreground/85 transition hover:bg-foreground/[0.05]"
      >
        <span>{currency}</span>
        <span className="text-right tabular-nums">
          ${balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
        <span className="text-right tabular-nums">
          ${equity.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
        <span
          className={cn(
            "text-right tabular-nums",
            unrealizedPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          {unrealizedPnl >= 0 ? "+" : ""}${Math.abs(unrealizedPnl).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}

function bulkTabStubMessage(tab: BulkTab): string {
  switch (tab) {
    case "Open Orders":
      return "No resting order book in paper mode yet — limit and stop orders fill immediately against mark when rules are met.";
    case "Order History":
      return "Order-level history is not stored separately; use Trade History for executed fills.";
    case "Funding History":
      return "Funding is not simulated in paper trading.";
    case "Position History":
      return "Closed-position history will appear here once the ledger export ships. Trade History lists all fills for now.";
    default:
      return `${tab} is not available yet.`;
  }
}

export function BulkBottomTabs() {
  const [active, setActive] = useState<BulkTab>("Positions");
  const [currentMarket, setCurrentMarket] = useState(false);
  const [stubModalTab, setStubModalTab] = useState<BulkStubTab | null>(null);
  const { trades: liveTradesForTab } = usePaperAccountSummary();
  const demo = useDemoAccount();
  const tradeCountForLabel = demo.active ? 0 : liveTradesForTab.length;
  const bottomPanelTab = useWorkspaceStore((state) => state.bottomPanelTab);
  const setBottomPanelTab = useWorkspaceStore((state) => state.setBottomPanelTab);

  useEffect(() => {
    startTransition(() => {
      if (bottomPanelTab === "positions") {
        setActive("Positions");
        setStubModalTab(null);
      }
      if (bottomPanelTab === "trades") {
        setActive("Trade History");
        setStubModalTab(null);
      }
    });
  }, [bottomPanelTab]);

  const selectTab = (tab: BulkTab) => {
    setActive(tab);
    if (tab === "Positions") {
      setBottomPanelTab("positions");
      setStubModalTab(null);
    } else if (tab === "Radar") {
      setStubModalTab(null);
    } else if (tab === "Trade History") {
      setBottomPanelTab("trades");
      setStubModalTab(null);
    } else if (tab === "Balances") {
      setStubModalTab(null);
    } else if (isStubTab(tab)) {
      setStubModalTab(tab);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-[var(--line)] bg-[var(--panel)]">
      <BulkTabStubDialog
        tab={stubModalTab}
        open={stubModalTab !== null}
        onOpenChange={(next) => {
          if (!next) setStubModalTab(null);
        }}
      />
      <div className="flex h-8 min-h-8 items-center justify-between gap-2 border-b border-[var(--line)] px-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto text-[11px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectTab(tab)}
              className={cn(
                "relative inline-flex h-7 shrink-0 items-center px-1 transition",
                active === tab
                  ? "text-foreground"
                  : "text-foreground/50 hover:text-foreground/85"
              )}
            >
              {tab === "Positions" ? `Positions (${tradeCountForLabel})` : tab}
              {tab === active ? (
                <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-foreground" />
              ) : null}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-foreground/55">
          <input
            type="checkbox"
            checked={currentMarket}
            onChange={(event) => setCurrentMarket(event.target.checked)}
            className="h-3 w-3 accent-foreground"
          />
          Current Market
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {active === "Positions" ? (
          <PositionsPanel currentMarketOnly={currentMarket} />
        ) : active === "Radar" ? (
          <BulkRadarPanel />
        ) : active === "Trade History" ? (
          <TradeHistoryPanel currentMarketOnly={currentMarket} />
        ) : active === "Balances" ? (
          <BalancesPanel />
        ) : (
          <EmptyRow message={bulkTabStubMessage(active)} />
        )}
      </div>
    </div>
  );
}
