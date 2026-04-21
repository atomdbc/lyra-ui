import type { AiSignalSummary } from "@/core/ai/signal";
import type { MarketTimeframe } from "@/core/market/types";

const SIGNAL_RE = /<signal\s*>([\s\S]*?)<\/signal>/i;

/** Remove `<signal>...</signal>` blocks from assistant text shown as chat prose. */
export function stripSignalTagsForDisplay(content: string): string {
  return content.replace(SIGNAL_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractSignalTagInner(content: string): string | null {
  const m = content.match(SIGNAL_RE);
  const inner = m?.[1]?.trim();
  return inner && inner.length > 0 ? inner : null;
}

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Optional JSON inside `<signal>...</signal>` for the frontend.
 * Minimal schema so the model can stay terse.
 */
export function tryParseSignalTagToSummary(
  content: string,
  fallback: { productId: string; timeframe: MarketTimeframe }
): AiSignalSummary | null {
  const raw = extractSignalTagInner(content);
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const verdict =
      j.verdict === "trade" || j.verdict === "watch" || j.verdict === "skip" ? j.verdict : "watch";
    const bias =
      j.bias === "long" || j.bias === "short" || j.bias === "neutral" ? j.bias : "neutral";
    const longPlan = j.longPlan && typeof j.longPlan === "object" ? (j.longPlan as Record<string, unknown>) : null;
    const shortPlan = j.shortPlan && typeof j.shortPlan === "object" ? (j.shortPlan as Record<string, unknown>) : null;

    return {
      productId: toStr(j.productId) ?? fallback.productId,
      symbol: toStr(j.symbol) ?? fallback.productId,
      timeframe: (toStr(j.timeframe) as MarketTimeframe | null) ?? fallback.timeframe,
      price: toNum(j.price),
      marketState:
        j.marketState === "bullish" || j.marketState === "bearish" || j.marketState === "range"
          ? j.marketState
          : null,
      verdict,
      bias,
      confidence: toNum(j.confidence),
      setup: null,
      support: toNum(j.support),
      resistance: toNum(j.resistance),
      trigger: toStr(j.trigger),
      invalidation: toStr(j.invalidation),
      longPlan: longPlan
        ? {
            entry: toNum(longPlan.entry),
            stopLoss: toNum(longPlan.stopLoss),
            takeProfit: toNum(longPlan.takeProfit),
            leverage: toNum(longPlan.leverage),
            rr: toNum(longPlan.rr),
            executable: Boolean(longPlan.executable),
            condition: toStr(longPlan.condition),
          }
        : null,
      shortPlan: shortPlan
        ? {
            entry: toNum(shortPlan.entry),
            stopLoss: toNum(shortPlan.stopLoss),
            takeProfit: toNum(shortPlan.takeProfit),
            leverage: toNum(shortPlan.leverage),
            rr: toNum(shortPlan.rr),
            executable: Boolean(shortPlan.executable),
            condition: toStr(shortPlan.condition),
          }
        : null,
      reasons: Array.isArray(j.reasons)
        ? (j.reasons as unknown[]).map((r) => String(r)).filter(Boolean).slice(0, 5)
        : [],
    };
  } catch {
    return null;
  }
}
