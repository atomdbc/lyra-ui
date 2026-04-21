import { PaperTrade } from "@/core/paper/types";

export type TradeStats = {
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  averageRr: number | null;
  bestTradePnl: number | null;
  worstTradePnl: number | null;
  dailyPnl: number;
  realizedTotal: number;
};

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function buildTradeStats(trades: PaperTrade[]): TradeStats {
  const closes = trades.filter((trade) => trade.action === "close");
  const wins = closes.filter((trade) => trade.realizedPnl > 0).length;
  const losses = closes.filter((trade) => trade.realizedPnl < 0).length;
  const rrValues = closes
    .map((trade) => trade.plannedRr)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);

  const realizedTotal = closes.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const dailyPnl = closes
    .filter((trade) => isToday(trade.executedAt))
    .reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const bestTradePnl = closes.length ? Math.max(...closes.map((trade) => trade.realizedPnl)) : null;
  const worstTradePnl = closes.length ? Math.min(...closes.map((trade) => trade.realizedPnl)) : null;

  return {
    closedTrades: closes.length,
    wins,
    losses,
    winRate: closes.length ? (wins / closes.length) * 100 : null,
    averageRr: rrValues.length ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length : null,
    bestTradePnl,
    worstTradePnl,
    dailyPnl,
    realizedTotal,
  };
}
