"use client";

import { formatPrice } from "@/core/market/format";
import { usePublicLiveRead } from "@/hooks/use-public-live-read";
import { usePublicLiveTrades } from "@/hooks/use-public-live-trades";
import { usePublicSocialProof } from "@/hooks/use-public-social-proof";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PreconnectConversionPanel({
  productId,
  onConnect,
}: {
  productId: string;
  onConnect: () => void;
}) {
  const readQuery = usePublicLiveRead(productId);
  const tradesQuery = usePublicLiveTrades();
  const socialProofQuery = usePublicSocialProof();
  const activeFallback = Math.max((tradesQuery.data?.trades ?? []).length, 0);

  return (
    <section className="border-b border-black/8">
      <div className="border-b border-black/8 px-2 py-1.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-black/32">Trade center</p>
        <p className="mt-1 text-[11px] text-black/78">See a live read first, then connect to execute.</p>
      </div>

      <div className="border-b border-black/8 px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/30">Free AI market read</p>
          <span className="text-[10px] text-black/38">
            {readQuery.data?.read.generatedAt ? formatTime(readQuery.data.read.generatedAt) : "Live"}
          </span>
        </div>
        <p className="mt-1.5 text-[12px] font-medium text-black/84">
          {readQuery.data?.read.symbol ?? "Market"} · {readQuery.data?.read.verdict ?? "watch"} ·{" "}
          {readQuery.data?.read.confidence ?? "--"}%
        </p>
        <p className="mt-1 text-[11px] leading-5 text-black/62">
          {readQuery.data?.read.summary ?? "Analyzing live market structure…"}
        </p>
      </div>

      <div className="border-b border-black/8 px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/30">Live trade log</p>
          <span className="text-[10px] text-black/42">
            {(socialProofQuery.data?.activeTradersToday ?? activeFallback).toLocaleString()} active today
          </span>
        </div>
        <div className="mt-1.5 space-y-1">
          {(tradesQuery.data?.trades ?? []).slice(0, 5).map((trade) => (
            <div key={trade.id} className="flex items-center justify-between text-[10px]">
              <span className="text-black/74">
                @{trade.username} · {trade.symbol} · {trade.action}
              </span>
              <span className={trade.realizedPnl >= 0 ? "text-emerald-700" : "text-red-700"}>
                {trade.realizedPnl >= 0 ? "+" : ""}
                {formatPrice(trade.realizedPnl)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 py-2">
        <p className="pb-2 text-[10px] leading-4 text-black/52">
          Connect wallet or Gmail to unlock your personal paper account, execute setups, and track PnL in
          real time.
        </p>
        <button
          type="button"
          onClick={onConnect}
          className="h-8 border border-black/10 bg-black px-3 text-[10px] font-medium text-white transition hover:bg-black/88"
        >
          Connect wallet / Gmail
        </button>
      </div>
    </section>
  );
}
