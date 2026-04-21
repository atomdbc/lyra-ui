"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignalAlert } from "@/core/signal/signal-types";
import { useLyraSignalFeed } from "@/hooks/use-lyra-signal-feed";
import { BulkTopBar } from "@/components/workspace/bulk/bulk-top-bar";
import {
  applyFeedLane,
  applyFilters,
  useSignalFiltersStore,
} from "@/stores/signal-filters-store";
import { SignalFilterPopover } from "@/components/signal/signal-filter-popover";
import { SignalActiveChips } from "@/components/signal/signal-active-chips";
import { SignalCard } from "@/components/signal/signal-card";
import { SignalLivePreview } from "@/components/signal/signal-live-preview";
import { SignalLaneTabs } from "@/components/signal/signal-lane-tabs";
import { SignalDetailsPanel } from "@/components/signal/signal-details-panel";
import {
  formatUsd,
  severityBucket,
  timeAgo,
} from "@/components/signal/signal-format";

type ConnectionStatus = ReturnType<typeof useLyraSignalFeed>["status"];

const DUST_FILTER_KEY = "lyra-signal-include-dust";

function StatusDot({ status }: { status: ConnectionStatus }) {
  const base = "inline-block h-2 w-2 rounded-full";
  if (status === "open")
    return <span className={cn(base, "bg-[var(--positive)] animate-pulse")} />;
  if (status === "connecting" || status === "reconnecting")
    return <span className={cn(base, "bg-yellow-400 animate-pulse")} />;
  if (status === "error") return <span className={cn(base, "bg-[var(--negative)]")} />;
  if (status === "disabled") return <span className={cn(base, "bg-foreground/25")} />;
  return <span className={cn(base, "bg-foreground/40")} />;
}

function statusText(status: ConnectionStatus) {
  if (status === "open") return "Live";
  if (status === "connecting") return "Connecting";
  if (status === "reconnecting") return "Reconnecting";
  if (status === "error") return "Error";
  if (status === "disabled") return "Disabled";
  return "Idle";
}

function isHeartbeat(alert: SignalAlert) {
  return alert.event.metadata?.pump?.txType === "heartbeat";
}

export function SignalShell() {
  const { alerts, status, wsUrl, lastError, connectionId, hydrated } =
    useLyraSignalFeed();
  const filters = useSignalFiltersStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoscroll, setAutoscroll] = useState(true);
  const [includeDust, setIncludeDust] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DUST_FILTER_KEY);
    if (stored === "1") setIncludeDust(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DUST_FILTER_KEY, includeDust ? "1" : "0");
  }, [includeDust]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Tape alerts (no heartbeats) for the ambient ticker + stat strip.
  const rawAlerts = useMemo(
    () => alerts.filter((alert) => !isHeartbeat(alert)),
    [alerts]
  );

  const filtered = useMemo(() => applyFilters(rawAlerts, filters), [rawAlerts, filters]);
  const laneScoped = useMemo(
    () => applyFeedLane(filtered, filters.feedLane),
    [filtered, filters.feedLane],
  );
  const visible = useMemo(() => {
    if (includeDust) return laneScoped;
    return laneScoped.filter((alert) => severityBucket(alert) !== "info");
  }, [laneScoped, includeDust]);

  const selected = useMemo(
    () => visible.find((alert) => alert.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId]
  );

  const lastHeartbeat = useMemo(() => {
    for (const alert of alerts) {
      if (isHeartbeat(alert)) return alert;
    }
    return null;
  }, [alerts]);

  const stats = useMemo(() => {
    const usd = visible.reduce((sum, alert) => sum + (alert.event.sizeUsd || 0), 0);
    const lastIso = visible[0]?.createdAt ?? rawAlerts[0]?.createdAt;
    const lastLabel = lastIso ? `${timeAgo(lastIso)} ago` : "—";
    return {
      buffered: rawAlerts.length,
      shown: visible.length,
      usd,
      lastLabel,
    };
  }, [rawAlerts, visible]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setAutoscroll(node.scrollTop < 8);
  }, []);

  const jumpLatest = useCallback(() => {
    setAutoscroll(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing = tag === "input" || tag === "textarea";
      if (!editing && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (editing) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (visible.length === 0) return;
        event.preventDefault();
        const activeId = selected?.id ?? visible[0].id;
        const index = visible.findIndex((alert) => alert.id === activeId);
        const next = event.key === "ArrowDown" ? index + 1 : index - 1;
        const clamped = Math.max(0, Math.min(visible.length - 1, next));
        setSelectedId(visible[clamped]?.id ?? null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, visible]);

  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      filters.setQuery("");
      (event.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <BulkTopBar />

      {/* Command bar */}
      <section className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            Lyra Signal
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-2 py-0.5 text-[11px] text-foreground/75"
            title={lastError ?? wsUrl ?? undefined}
          >
            <StatusDot status={status} />
            {statusText(status)}
            {connectionId ? (
              <span className="font-mono text-[10px] text-foreground/40">
                · {connectionId.slice(0, 6)}
              </span>
            ) : null}
          </span>
        </div>

        <SignalFilterPopover alerts={rawAlerts} />

        <button
          type="button"
          onClick={() => setIncludeDust((value) => !value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[11px] transition",
            includeDust
              ? "border-[var(--line-strong)] bg-foreground/[0.08] text-foreground"
              : "border-[var(--line)] bg-[var(--panel-2)] text-foreground/70 hover:text-foreground"
          )}
          title={includeDust ? "Hide info-severity events" : "Show info-severity events"}
        >
          {includeDust ? "Including dust" : "Hiding dust"}
        </button>

        <div className="flex h-8 flex-1 items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-2">
          <Search className="h-3.5 w-3.5 text-foreground/45" />
          <input
            ref={searchRef}
            value={filters.query}
            onChange={(event) => filters.setQuery(event.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search token, wallet, symbol, or sentence (/)"
            className="w-full bg-transparent text-[12px] text-foreground outline-none placeholder:text-foreground/35"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => filters.setQuery("")}
              className="text-foreground/45 transition hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={filters.togglePaused}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[11px] transition",
            filters.paused
              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              : "border-[var(--line)] bg-[var(--panel-2)] text-foreground/75 hover:text-foreground"
          )}
          title={filters.paused ? "Resume stream" : "Pause stream"}
        >
          {filters.paused ? (
            <>
              <Play className="h-3.5 w-3.5" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          )}
        </button>

        <Link
          href="/terminal"
          className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-2.5 text-[11px] text-foreground/75 transition hover:text-foreground"
        >
          Terminal <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <SignalLaneTabs
        active={filters.feedLane}
        onChange={filters.setFeedLane}
      />

      <SignalActiveChips />

      <SignalLivePreview alerts={rawAlerts} />

      {/* Stat strip */}
      <div className="grid grid-cols-2 border-b border-[var(--line)] bg-[var(--panel)] sm:grid-cols-4">
        <StatTile label="Buffered" value={stats.buffered.toLocaleString()} />
        <StatTile label="In view" value={stats.shown.toLocaleString()} />
        <StatTile label="Notional (view)" value={formatUsd(stats.usd)} />
        <StatTile label="Last in view" value={stats.lastLabel} />
      </div>

      {/* Card feed + details */}
      <section className="relative flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
          >
            {!hydrated && alerts.length === 0 ? (
              <CacheSkeleton />
            ) : status === "disabled" ? (
              <EmptyState
                title="Signal endpoint not configured"
                message="Set NEXT_PUBLIC_LYRA_SIGNAL_URL to the Lyra Signal URL."
                subtle={lastError ?? undefined}
              />
            ) : visible.length === 0 ? (
              rawAlerts.length > 0 ? (
                <EmptyFilters
                  onReset={() => {
                    filters.reset();
                    setIncludeDust(false);
                  }}
                  onShowDust={() => setIncludeDust(true)}
                  showDustHint={!includeDust && filtered.length > 0}
                />
              ) : status === "open" ? (
                <QuietFeed />
              ) : (
                <EmptyState
                  title="Connecting to the signal bus"
                  message={
                    wsUrl
                      ? `Trying ${wsUrl.replace(/^wss?:\/\//, "")}`
                      : "Configure the Signal URL to start streaming."
                  }
                  subtle={lastError ?? undefined}
                />
              )
            ) : (
              <div className="flex flex-col gap-2">
                {visible.map((alert) => (
                  <SignalCard
                    key={alert.id}
                    alert={alert}
                    active={selected?.id === alert.id}
                    onSelect={() => setSelectedId(alert.id)}
                    now={now}
                  />
                ))}
              </div>
            )}
          </div>

          {!autoscroll && visible.length > 0 ? (
            <button
              type="button"
              onClick={jumpLatest}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[var(--panel)]/90 px-3 py-1 text-[11px] text-foreground/85 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur transition hover:text-foreground"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Jump to latest
            </button>
          ) : null}

          {/* Heartbeat footer */}
          <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--panel)] px-4 py-1.5 text-[10px] text-foreground/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
              Pipeline {status === "open" ? "live" : statusText(status).toLowerCase()}
            </span>
            <span className="font-mono">
              {rawAlerts.length > 0
                ? `last alert ${timeAgo(rawAlerts[0].createdAt)} ago`
                : lastHeartbeat
                  ? `last heartbeat ${timeAgo(lastHeartbeat.createdAt)} ago`
                  : "waiting for first event"}
            </span>
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 lg:flex">
          <SignalDetailsPanel alert={selected as SignalAlert | null} />
        </div>
      </section>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-r border-[var(--line)] px-4 py-2 last:border-r-0">
      <span className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">
        {label}
      </span>
      <span className="font-mono text-[12px] tabular-nums text-foreground/90">
        {value}
      </span>
    </div>
  );
}

function QuietFeed() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[11px] text-foreground/70">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
        Connected · waiting for a meaningful event
      </div>
      <p className="mt-3 max-w-md text-[12px] text-foreground/45">
        Lyra Signal only surfaces events that matter — large prints, early buys
        on fresh tokens, volume surges. Dust is suppressed upstream.
      </p>
    </div>
  );
}

function EmptyFilters({
  onReset,
  onShowDust,
  showDustHint,
}: {
  onReset: () => void;
  onShowDust: () => void;
  showDustHint: boolean;
}) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
      <p className="text-[13px] font-medium text-foreground/80">
        No alerts match these filters.
      </p>
      <p className="mt-1 max-w-md text-[11px] text-foreground/45">
        {showDustHint
          ? "Lower-severity events are hidden. Toggle dust on to see every rule match."
          : "Loosen a filter to let the stream through."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {showDustHint ? (
          <button
            type="button"
            onClick={onShowDust}
            className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[11px] text-foreground/75 transition hover:text-foreground"
          >
            Include dust
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[11px] text-foreground/75 transition hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}

function CacheSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-2 rounded-[12px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-12 rounded bg-foreground/10" />
            <span className="h-3 w-16 rounded bg-foreground/10" />
            <span className="ml-auto h-3 w-10 rounded bg-foreground/10" />
          </div>
          <span className="h-4 w-full rounded bg-foreground/[0.07]" />
          <span className="h-3 w-2/3 rounded bg-foreground/[0.05]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  message,
  subtle,
}: {
  title: string;
  message: string;
  subtle?: string;
}) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
      <p className="text-[13px] font-medium text-foreground/80">{title}</p>
      <p className="max-w-md text-[11px] text-foreground/55">{message}</p>
      {subtle ? (
        <p className="max-w-md text-[10px] text-[var(--negative)]/80">{subtle}</p>
      ) : null}
    </div>
  );
}
