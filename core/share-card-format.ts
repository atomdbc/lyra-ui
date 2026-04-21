import { ShareCardType } from "@/core/paper/types";

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function readShareCardHeadline(type: ShareCardType, payload: Record<string, unknown>) {
  if (type === "trade_result") {
    return `${String(payload.symbol ?? "Trade")} result`;
  }
  return "Session snapshot";
}

export function readShareCardValue(type: ShareCardType, payload: Record<string, unknown>) {
  if (type === "trade_result") {
    return toNumber(payload.realizedPnl);
  }
  return toNumber(payload.realizedTotal ?? payload.dailyPnl);
}
