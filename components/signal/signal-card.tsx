"use client";

import { ExternalLink, Rocket, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { SignalAlert } from "@/core/signal/signal-types";
import {
  dexScreenerSolanaPairUrl,
  pumpFunCoinUrl,
} from "@/core/signal/token-explorer-urls";
import {
  formatUsd,
  formatWallet,
  ruleLabel,
  severityBucket,
  severityDot,
  timeAgo,
  timestampLabel,
} from "@/components/signal/signal-format";
import { cn } from "@/lib/utils";

type Props = {
  alert: SignalAlert;
  active: boolean;
  onSelect: () => void;
  now: number;
};

function actionIcon(alert: SignalAlert) {
  if (alert.event.action === "create") return Rocket;
  if (alert.event.action === "sell") return TrendingDown;
  if (alert.event.action === "buy") return TrendingUp;
  if (alert.event.action === "migrate") return Sparkles;
  return Sparkles;
}

function laneHint(alert: SignalAlert): string {
  if (alert.event.action === "create") return "New launch";
  if (alert.primaryRule === "bonding_migration" || alert.event.action === "migrate") {
    return "Graduated";
  }
  if (alert.primaryRule === "large_wallet_usd") return "Whale print";
  if (alert.primaryRule === "volume_acceleration") return "Volume surge";
  if (alert.primaryRule === "early_buy_index" && alert.event.action === "buy") {
    return "Early cluster";
  }
  return ruleLabel(alert.primaryRule);
}

export function SignalCard({ alert, active, onSelect, now }: Props) {
  const severity = severityBucket(alert);
  const Icon = actionIcon(alert);
  const createdMs = new Date(alert.createdAt).getTime();
  const fresh = now - createdMs < 8_000;
  const symbol =
    alert.event.metadata?.pump?.symbol?.toUpperCase() ??
    alert.event.token.slice(0, 6);
  const name = alert.event.metadata?.pump?.name;
  const showUsd = alert.event.sizeUsd >= 500;
  const mint = alert.event.token;
  const hint = laneHint(alert);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full gap-0 overflow-hidden rounded-[14px] border text-left transition",
        "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--line-strong)] hover:bg-foreground/[0.02]",
        active && "border-foreground/25 bg-foreground/[0.04] ring-1 ring-foreground/10",
        fresh && "shadow-[0_0_0_1px_rgba(250,204,21,0.12)]",
      )}
    >
      <span
        className={cn(
          "w-[3px] shrink-0",
          severity === "critical" && "bg-red-400",
          severity === "alert" && "bg-amber-400",
          severity === "notable" && "bg-sky-400",
          severity === "info" && "bg-foreground/25",
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-foreground/50">
          <span className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.12em] text-foreground/40">
            <span className={cn("h-1.5 w-1.5 rounded-full", severityDot(severity))} />
            {hint}
          </span>
          <span className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-px font-mono text-[9px] uppercase tracking-wide text-foreground/65">
            {alert.event.action}
          </span>
          {showUsd ? (
            <span className="font-mono tabular-nums text-foreground/80">
              {formatUsd(alert.event.sizeUsd)}
            </span>
          ) : null}
          <span
            className="ml-auto font-mono text-[10px] tabular-nums text-foreground/40"
            title={timestampLabel(alert.createdAt)}
          >
            {timeAgo(alert.createdAt)}
          </span>
        </div>

        <p className="text-[14px] font-medium leading-snug tracking-[-0.01em] text-foreground/92">
          <Icon className="mr-1.5 inline-block h-4 w-4 -translate-y-0.5 text-foreground/40" />
          {alert.sentence}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)]/80 pt-2 text-[10px] text-foreground/45">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate font-semibold text-foreground/85">{symbol}</span>
            {name ? (
              <span className="max-w-[140px] truncate text-foreground/40">{name}</span>
            ) : null}
            <span className="inline-flex items-center gap-1 font-mono">
              <Wallet className="h-3 w-3 shrink-0 opacity-50" />
              {formatWallet(alert.event.wallet)}
            </span>
            <span className="uppercase tracking-wider text-foreground/35">
              {alert.event.source}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={pumpFunCoinUrl(mint)}
              target="_blank"
              rel="noreferrer noopener"
              title="Open on pump.fun"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-foreground/55 transition hover:border-[var(--line-strong)] hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="sr-only">pump.fun</span>
              <span className="text-[9px] font-bold leading-none">P</span>
            </a>
            <a
              href={dexScreenerSolanaPairUrl(mint)}
              target="_blank"
              rel="noreferrer noopener"
              title="DexScreener"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-foreground/55 transition hover:border-[var(--line-strong)] hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="sr-only">DexScreener</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </button>
  );
}
