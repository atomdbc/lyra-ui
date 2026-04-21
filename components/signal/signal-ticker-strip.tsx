"use client";

import { useMemo } from "react";
import type { SignalAlert } from "@/core/signal/signal-types";
import {
  formatUsd,
  severityBucket,
  severityDot,
  timestampLabel,
} from "@/components/signal/signal-format";
import { cn } from "@/lib/utils";

type Props = {
  alerts: SignalAlert[];
};

/**
 * Ambient one-line tape at the top of /signal. Shows the last ~20 meaningful
 * events as a scrolling monospace ribbon so the page always "feels alive",
 * even if the card stream hasn't added a row yet.
 */
export function SignalTickerStrip({ alerts }: Props) {
  const items = useMemo(() => alerts.slice(0, 24), [alerts]);
  if (!items.length) {
    return (
      <div className="border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-1.5 text-[10px] font-mono text-foreground/45">
        Ticker idle — waiting for the first meaningful event.
      </div>
    );
  }
  return (
    <div className="border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-1.5 font-mono text-[10px]">
      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap text-foreground/75">
        {items.map((alert) => {
          const severity = severityBucket(alert);
          const symbol =
            alert.event.metadata?.pump?.symbol?.toUpperCase() ??
            alert.event.token.slice(0, 6);
          const amount = alert.event.sizeUsd >= 500 ? formatUsd(alert.event.sizeUsd) : null;
          return (
            <span key={alert.id} className="inline-flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", severityDot(severity))} />
              <span className="text-foreground/55">{timestampLabel(alert.createdAt)}</span>
              <span className="text-foreground/90">{symbol}</span>
              <span className="uppercase text-foreground/55">{alert.event.action}</span>
              {amount ? <span className="tabular-nums text-foreground/70">{amount}</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
