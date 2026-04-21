"use client";

import { formatPrice } from "@/core/market/format";
import { useWeeklyLeaderboard } from "@/hooks/use-weekly-leaderboard";

export function WorkspaceLeaderboardPanel() {
  const leaderboard = useWeeklyLeaderboard();
  const entries = leaderboard.data?.entries ?? [];

  if (!entries.length) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-black/38">
        No leaderboard entries yet.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid grid-cols-[0.5fr_1.2fr_1fr_0.8fr] border-b border-black/8 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-black/34">
        <span>Rank</span>
        <span>User</span>
        <span className="text-right">Weekly PnL</span>
        <span className="text-right">Trades</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={`${entry.username}:${entry.rank}`}
            className="grid grid-cols-[0.5fr_1.2fr_1fr_0.8fr] border-b border-black/6 px-3 py-2 text-[11px]"
          >
            <span className="text-black/66">#{entry.rank}</span>
            <span className="truncate">@{entry.username}</span>
            <span className={["text-right", entry.weeklyRealizedPnl >= 0 ? "text-emerald-700" : "text-red-700"].join(" ")}>
              {entry.weeklyRealizedPnl >= 0 ? "+" : ""}
              {formatPrice(entry.weeklyRealizedPnl)}
            </span>
            <span className="text-right text-black/62">{entry.tradeCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
