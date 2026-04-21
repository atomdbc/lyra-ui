"use client";

import { useMemo } from "react";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useLiveMarketTickers } from "@/hooks/use-live-market-tickers";
import type { PaperPosition } from "@/core/paper/types";

type DemoSummary = {
  active: boolean;
  balance: number;
  equity: number;
  unrealizedPnl: number;
  positions: PaperPosition[];
};

/**
 * Populated demo state for the terminal before a user connects. Returns a
 * ghost BTC long sized off the live price so the workspace never shows zeros.
 * `active` is true only when the visitor is not authenticated.
 */
export function useDemoAccount(): DemoSummary {
  const auth = useWorkspaceAuth();
  const activeProductId = useWorkspaceStore((state) => state.activeProductId);
  const tickers = useLiveMarketTickers([activeProductId].filter(Boolean) as string[]);
  const livePrice = tickers[activeProductId]?.price ?? 0;

  return useMemo(() => {
    if (auth.authenticated) {
      return {
        active: false,
        balance: 0,
        equity: 0,
        unrealizedPnl: 0,
        positions: [],
      };
    }

    const balance = 10_000;
    if (!livePrice) {
      return {
        active: true,
        balance,
        equity: balance,
        unrealizedPnl: 0,
        positions: [],
      };
    }

    // Synthetic long open ~1.2% below current price.
    const symbol = activeProductId.replace(/-USD$/i, "") || "BTC";
    const entry = livePrice * 0.988;
    const quantity = 0.035;
    const leverage = 10;
    const notional = entry * quantity;
    const margin = notional / leverage;
    const unrealized = (livePrice - entry) * quantity;

    const ghost: PaperPosition = {
      id: "demo-btc-long",
      productId: activeProductId || "BTC-USD",
      symbol,
      direction: "long",
      leverage,
      marginUsed: margin,
      quantity,
      entryPrice: entry,
      stopLoss: entry * 0.98,
      takeProfit: entry * 1.04,
      openedAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      active: true,
      balance,
      equity: balance + unrealized,
      unrealizedPnl: unrealized,
      positions: [ghost],
    };
  }, [auth.authenticated, activeProductId, livePrice]);
}
