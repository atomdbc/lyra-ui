import "server-only";

import { PublicLiveRead, PublicSocialProof, PublicTradeFeedItem } from "@/core/paper/types";
import { scanMarketsForSetups } from "@/core/server/ai/market-scan/scan-service";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLiveReadSummary(opportunity: Awaited<ReturnType<typeof scanMarketsForSetups>>[number]) {
  const firstReason = opportunity.reasons[0] ?? "Structure looks actionable.";
  const trigger = opportunity.trigger || "Wait for cleaner trigger.";
  return `${firstReason} Trigger: ${trigger}`;
}

export async function getPublicLiveRead(productId?: string | null): Promise<PublicLiveRead> {
  const opportunities = await scanMarketsForSetups({
    limit: 8,
    candidateCount: 40,
    includeProductId: productId ?? null,
  });

  const selected =
    opportunities.find((item) => item.productId === productId) ??
    opportunities.find((item) => item.verdict === "trade") ??
    opportunities[0];

  if (!selected) {
    return {
      generatedAt: new Date().toISOString(),
      productId: productId ?? "BTC-USD",
      symbol: "BTC/USD",
      bias: "neutral",
      verdict: "skip",
      confidence: 0,
      summary: "No clean setup right now. Wait for stronger structure.",
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    productId: selected.productId,
    symbol: selected.symbol,
    bias: selected.bias,
    verdict: selected.verdict,
    confidence: selected.confidence,
    summary: buildLiveReadSummary(selected),
  };
}

export async function getPublicLiveTrades(limit = 8): Promise<PublicTradeFeedItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data: trades, error: tradesError } = await supabase
    .from("paper_trades")
    .select("id, workspace_user_id, symbol, action, realized_pnl, price, executed_at")
    .order("executed_at", { ascending: false })
    .limit(100);

  if (tradesError || !trades?.length) {
    return [];
  }

  const userIds = [...new Set(trades.map((item) => String(item.workspace_user_id)))];
  const { data: users, error: usersError } = await supabase
    .from("workspace_users")
    .select("id, username, profile_visibility, public_trade_feed_opt_in")
    .in("id", userIds);

  if (usersError || !users?.length) {
    return [];
  }

  const allowedByUserId = new Map<string, string>();
  for (const user of users) {
    const isPublic = user.profile_visibility !== "private";
    const allowsFeed = user.public_trade_feed_opt_in !== false;
    const username = (user.username as string | null) ?? null;
    if (isPublic && allowsFeed && username) {
      allowedByUserId.set(String(user.id), username);
    }
  }

  const feed: PublicTradeFeedItem[] = [];
  for (const trade of trades) {
    const username = allowedByUserId.get(String(trade.workspace_user_id));
    if (!username) {
      continue;
    }
    feed.push({
      id: String(trade.id),
      username,
      symbol: String(trade.symbol),
      action: trade.action === "close" ? "close" : trade.action === "increase" ? "increase" : "open",
      realizedPnl: toNumber(trade.realized_pnl),
      price: toNumber(trade.price),
      executedAt: String(trade.executed_at),
    });
    if (feed.length >= limit) {
      break;
    }
  }

  return feed;
}

export async function getPublicSocialProof(): Promise<PublicSocialProof> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: traders, error } = await supabase
    .from("paper_trades")
    .select("workspace_user_id")
    .gte("executed_at", since);

  const activeTradersToday = error || !traders ? 0 : new Set(traders.map((item) => item.workspace_user_id)).size;
  const recentTrades = await getPublicLiveTrades(8);

  return {
    activeTradersToday,
    recentTrades,
  };
}
