"use client";

import { ArrowUpRight, Rocket, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import type { SignalAlert } from "@/core/signal/signal-types";
import {
  formatUsd,
  formatWallet,
  ruleAccent,
  ruleLabel,
  severityAccent,
  severityBucket,
  severityDot,
  severityLabel,
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col gap-1.5 rounded-[12px] border bg-[var(--panel)] px-4 py-3 text-left transition",
        active
          ? "border-[var(--line-strong)] bg-foreground/[0.04]"
          : "border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-foreground/[0.03]",
        fresh && "animate-[pulse_1.2s_ease-out_1]"
      )}
    >
      <div className="flex items-center gap-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground/45">
          <span className={cn("h-1.5 w-1.5 rounded-full", severityDot(severity))} />
          {severityLabel(severity)}
        </span>
        <span
          className={cn(
            "rounded-[4px] border px-1.5 py-[1px] uppercase tracking-wider",
            severityAccent(severity)
          )}
        >
          {ruleLabel(alert.primaryRule)}
        </span>
        <span
          className={cn(
            "rounded-[4px] border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-[1px] uppercase tracking-wider",
            ruleAccent(alert.primaryRule)
          )}
        >
          {alert.event.action}
        </span>
        {showUsd ? (
          <span className="rounded-[4px] border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-[1px] font-mono tabular-nums text-foreground/75">
            {formatUsd(alert.event.sizeUsd)}
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[10px] text-foreground/45" title={timestampLabel(alert.createdAt)}>
          {timeAgo(alert.createdAt)} ago
        </span>
      </div>

      <p className="text-[13px] leading-[1.55] text-foreground/90">
        <Icon className="mr-1.5 inline-block h-3.5 w-3.5 -translate-y-[1px] text-foreground/55" />
        {alert.sentence}
      </p>

      <div className="flex items-center gap-3 text-[10px] text-foreground/50">
        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--panel-2)] px-1.5 py-[1px] text-foreground/70">
          <span className="font-medium text-foreground/85">{symbol}</span>
          {name ? <span className="text-foreground/45">· {name.slice(0, 24)}</span> : null}
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          <span className="font-mono">{formatWallet(alert.event.wallet)}</span>
        </span>
        <span className="uppercase tracking-wider">{alert.event.source}</span>
        <Link
          href={`/terminal?market=${encodeURIComponent(`${symbol}-USD`)}`}
          className="ml-auto inline-flex items-center gap-0.5 rounded-[4px] border border-[var(--line)] px-1.5 py-[1px] text-foreground/60 transition hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          Open in terminal
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </button>
  );
}
