"use client";

import Image from "next/image";
import { Copy, Share2 } from "lucide-react";
import type { PaperPosition, PaperTrade } from "@/core/paper/types";
import { formatPrice } from "@/core/market/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BulkPositionDetailRow = {
  position: PaperPosition;
  currentPrice: number;
  unrealized: number;
  notional: number;
  roePercent: number;
  liq: number | null;
};

function buildShareText(row: BulkPositionDetailRow, fillsOnPair: number) {
  const { position, currentPrice, unrealized, roePercent } = row;
  const pnlSign = unrealized >= 0 ? "+" : "";
  const roeSign = roePercent >= 0 ? "+" : "";
  return [
    `Lyra Paper · ${position.symbol} ${position.direction.toUpperCase()} ${position.leverage}x`,
    `Unrealized PnL: ${pnlSign}$${Math.abs(unrealized).toFixed(2)} (${roeSign}${roePercent.toFixed(2)}% ROE)`,
    `Entry ${formatPrice(position.entryPrice)} · Mark ${formatPrice(currentPrice)}`,
    `Margin $${position.marginUsed.toLocaleString("en-US", { maximumFractionDigits: 2 })} · Notional $${row.notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    `${fillsOnPair} fill(s) on this pair`,
    "lyra.build",
  ].join("\n");
}

function LyraPnlShareCard({
  row,
  fillsOnPair,
}: {
  row: BulkPositionDetailRow;
  fillsOnPair: number;
}) {
  const { position, currentPrice, unrealized, notional, roePercent, liq } = row;
  const pnlPositive = unrealized >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-gradient-to-br from-[var(--panel-2)] via-[var(--panel)] to-[#0a0c10] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      data-lyra-share-card
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.08] ring-1 ring-foreground/10">
            <Image src="/lyra.svg" alt="Lyra" width={26} height={26} className="opacity-95" unoptimized />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/45">Lyra Paper</p>
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              {position.symbol}{" "}
              <span
                className={cn(
                  "text-[12px] font-semibold uppercase",
                  position.direction === "long" ? "text-[var(--positive)]" : "text-[var(--negative)]"
                )}
              >
                {position.direction} {position.leverage}x
              </span>
            </p>
          </div>
        </div>
        <span className="rounded-full border border-foreground/10 bg-foreground/[0.04] px-2 py-0.5 text-[9px] text-foreground/50">
          {fillsOnPair} {fillsOnPair === 1 ? "trade" : "trades"}
        </span>
      </div>

      <div className="relative mt-6 border-t border-foreground/[0.08] pt-5">
        <p className="text-[10px] uppercase tracking-wider text-foreground/40">Unrealized PnL (USDT)</p>
        <p
          className={cn(
            "mt-1 font-mono text-[2rem] font-semibold leading-none tracking-tight tabular-nums",
            pnlPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          {pnlPositive ? "+" : "−"}$
          {Math.abs(unrealized).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p
          className={cn(
            "mt-2 font-mono text-[13px] font-medium tabular-nums",
            roePercent >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          ROE {roePercent >= 0 ? "+" : ""}
          {roePercent.toFixed(2)}%
        </p>
      </div>

      <dl className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
        <div>
          <dt className="text-foreground/40">Entry</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/90">{formatPrice(position.entryPrice)}</dd>
        </div>
        <div>
          <dt className="text-foreground/40">Mark</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/90">{formatPrice(currentPrice)}</dd>
        </div>
        <div>
          <dt className="text-foreground/40">Size</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/90">{position.quantity.toFixed(4)}</dd>
        </div>
        <div>
          <dt className="text-foreground/40">Notional</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/90">
            ${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/40">Margin</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/90">
            ${position.marginUsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/40">Liq. price</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground/80">{liq ? formatPrice(liq) : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function BulkPositionDetailDialog({
  open,
  onOpenChange,
  row,
  symbolTrades,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: BulkPositionDetailRow | null;
  symbolTrades: PaperTrade[];
}) {
  const fillsOnPair = row ? symbolTrades.length : 0;
  const shareText = row ? buildShareText(row, fillsOnPair) : "";
  const recent = row
    ? [...symbolTrades].sort((a, b) => b.executedAt.localeCompare(a.executedAt)).slice(0, 6)
    : [];

  const copyShare = async () => {
    if (!row) return;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      /* ignore */
    }
  };

  const nativeShare = async () => {
    if (!row) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lyra Paper position", text: shareText });
      } else {
        await copyShare();
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  return (
    <Dialog open={open && !!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,640px)] w-[min(420px,calc(100vw-24px))] overflow-y-auto rounded-2xl border-[var(--line-strong)] bg-[var(--panel)] p-0 sm:max-w-[420px]">
        {row ? (
          <>
        <DialogHeader className="border-b border-[var(--line)] px-4 pb-3 pt-4">
          <DialogTitle className="text-[13px] font-semibold">Position details</DialogTitle>
          <p className="text-[11px] text-foreground/50">
            {row.position.symbol} · {fillsOnPair} {fillsOnPair === 1 ? "fill" : "fills"} on this pair
          </p>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4 pt-3">
          <LyraPnlShareCard row={row} fillsOnPair={fillsOnPair} />

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="rounded-full" onClick={() => void copyShare()}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy summary
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full border border-foreground/10 bg-transparent"
              onClick={() => void nativeShare()}
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Share
            </Button>
          </div>

          {recent.length ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/80 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Recent fills</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-foreground/75">
                {recent.map((t) => (
                  <li
                    key={t.id}
                    className="border-b border-foreground/[0.06] pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span className="capitalize text-foreground/60">{t.action}</span>
                      <span className="font-mono text-[10px] tabular-nums text-foreground/45">
                        {new Date(t.executedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-foreground/85">
                      {t.quantity.toFixed(4)} @ {formatPrice(t.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
