"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/core/market/format";
import {
  useBirdeyeRadar,
  type BirdeyeRadarMode,
  type BirdeyeRadarToken,
} from "@/hooks/use-birdeye-radar";
import { Button } from "@/components/ui/button";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

function badgeTone(score: number) {
  if (score >= 80)
    return "bg-[var(--positive)]/15 text-[var(--positive)] border-[var(--positive)]/25";
  if (score >= 60) return "bg-yellow-400/15 text-yellow-300 border-yellow-400/25";
  return "bg-[var(--negative)]/12 text-[var(--negative)] border-[var(--negative)]/20";
}

function formatCompactUsd(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function humanizeRadarError(message: string | undefined): string {
  if (!message) return "Top-rated radar is unavailable right now.";
  const m = message.toLowerCase();
  if (m.includes("birdeye_api_key") || m.includes("missing birdeye") || m.includes("unauthorized")) {
    return "Top-rated radar is temporarily unavailable. Reconnecting the data feed.";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Birdeye is busy. Please try again in a moment.";
  }
  return "Top-rated radar is unavailable right now. Try again in a moment.";
}

function humanizePublishError(message: string | undefined, authed: boolean): string {
  if (!authed) return "Sign in to add picks to your alerts.";
  if (!message) return "Couldn’t publish picks. Try again in a moment.";
  const m = message.toLowerCase();
  if (m.includes("bearer")) return "Please sign in to publish picks.";
  if (m.includes("birdeye_api_key") || m.includes("missing birdeye")) {
    return "Top-rated radar is reconnecting. Please try again shortly.";
  }
  if (m.includes("lyra_trading_signals")) {
    return "Signals storage isn’t ready yet. Apply the latest Supabase migration.";
  }
  if (m.includes("workspace user")) {
    return "Your workspace isn’t fully set up yet. Open the terminal once, then try again.";
  }
  return "Couldn’t publish picks. Try again in a moment.";
}

export function SignalBirdeyeRadar() {
  const [mode, setMode] = useState<BirdeyeRadarMode>("trending");
  const auth = useWorkspaceAuth();
  const radar = useBirdeyeRadar({ mode, limit: 10 });
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishOk, setPublishOk] = useState<boolean | null>(null);

  const rows = useMemo<BirdeyeRadarToken[]>(
    () => radar.data?.tokens ?? [],
    [radar.data?.tokens]
  );

  return (
    <section className="border-b border-[var(--line)] bg-[var(--panel)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.06] ring-1 ring-foreground/10">
            <Image src="/lyra.svg" alt="Lyra" width={18} height={18} className="opacity-95" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground/90">Top-rated signals</p>
            <p className="text-[10px] text-foreground/50">
              Live from Birdeye — trending, new listings, and on-chain safety.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.03] p-0.5 text-[11px]">
            {(["trending", "new"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  mode === id ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
                )}
              >
                {id === "trending" ? "Trending" : "New"}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={publishing || radar.isLoading || !auth.ready || !auth.authenticated}
            onClick={async () => {
              setPublishMessage(null);
              setPublishOk(null);
              setPublishing(true);
              try {
                if (!auth.authenticated) throw new Error("missing bearer token");
                const accessToken = await auth.getAccessToken();
                if (!accessToken) throw new Error("missing bearer token");
                const res = await fetch("/api/birdeye/signals", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ mode, limit: 10 }),
                });
                const json = (await res.json()) as {
                  ok?: boolean;
                  inserted?: number;
                  message?: string;
                };
                if (!res.ok || !json.ok) {
                  throw new Error(json.message ?? "Unable to publish signals.");
                }
                setPublishOk(true);
                setPublishMessage(`Sent ${json.inserted ?? 0} picks to your alerts.`);
              } catch (e) {
                setPublishOk(false);
                setPublishMessage(
                  humanizePublishError(e instanceof Error ? e.message : undefined, auth.authenticated)
                );
              } finally {
                setPublishing(false);
              }
            }}
          >
            {publishing ? "Sending…" : "Send top picks to alerts"}
          </Button>
        </div>
      </div>

      {publishMessage ? (
        <div
          className={cn(
            "border-t border-[var(--line)] px-4 py-2 text-[10px]",
            publishOk === false
              ? "text-[var(--negative)]"
              : publishOk === true
                ? "text-[var(--positive)]"
                : "text-foreground/55"
          )}
        >
          {publishMessage}
        </div>
      ) : null}

      <div className="border-t border-[var(--line)]">
        {radar.isLoading ? (
          <div className="px-4 py-4 text-[11px] text-foreground/45">Loading top-rated signals…</div>
        ) : radar.error instanceof Error ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-foreground/65">
            <span>{humanizeRadarError(radar.error.message)}</span>
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => void radar.refetch()}>
              Try again
            </Button>
          </div>
        ) : !rows.length ? (
          <div className="px-4 py-4 text-[11px] text-foreground/45">No top-rated tokens yet.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rows.map((t) => (
              <div
                key={`${t.address}:${t.symbol}`}
                className="flex min-w-[260px] flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)]/60 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.04]">
                      {t.logoURI ? (
                        <Image src={t.logoURI} alt="" width={28} height={28} className="h-7 w-7 object-cover" unoptimized />
                      ) : (
                        <span className="text-[10px] font-semibold text-foreground/50">
                          {t.symbol.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-foreground/90">{t.symbol}</p>
                      <p className="truncate text-[10px] text-foreground/45">{t.name}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] tabular-nums", badgeTone(t.score))}>
                    {t.score}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div>
                    <p className="text-foreground/40">Liq.</p>
                    <p className="font-mono tabular-nums text-foreground/75">{formatCompactUsd(t.liquidityUSD)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/40">Vol 24h</p>
                    <p className="font-mono tabular-nums text-foreground/75">{formatCompactUsd(t.volume24hUSD)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/40">24h</p>
                    <p
                      className={cn(
                        "font-mono tabular-nums",
                        (t.price24hChangePercent ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                      )}
                    >
                      {t.price24hChangePercent == null
                        ? "—"
                        : `${t.price24hChangePercent >= 0 ? "+" : ""}${t.price24hChangePercent.toFixed(0)}%`}
                    </p>
                  </div>
                </div>

                {t.why.length ? (
                  <p className="line-clamp-2 text-[10px] text-foreground/60">{t.why.slice(0, 2).join(" · ")}</p>
                ) : null}

                <div className="flex items-center justify-between pt-0.5 text-[10px] text-foreground/45">
                  <span className="font-mono">{t.address.slice(0, 6)}…{t.address.slice(-4)}</span>
                  <span>{t.priceUSD != null ? `Price ${formatPrice(t.priceUSD)}` : "Price —"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
