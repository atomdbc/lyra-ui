import "server-only";

import { PAPER_LEVERAGE_MAX } from "@/core/paper/leverage";

type PaperTradeCapabilities = {
  maxLeverage: number;
};

/**
 * Paper max leverage for the UI + API validation (env PAPER_MAX_LEVERAGE, default 40).
 * Postgres must match: see migration 20260424_paper_leverage_fix_migration_order.sql if RPC still errors
 * with "1x, 2x, or 3x" (older 20260402_* migration order overwrote the 40× RPC).
 */
export async function getPaperTradeCapabilities(): Promise<PaperTradeCapabilities> {
  const raw = Number(process.env.PAPER_MAX_LEVERAGE ?? PAPER_LEVERAGE_MAX);
  const maxLeverage =
    Number.isFinite(raw) && raw >= 1 ? Math.min(Math.floor(raw), PAPER_LEVERAGE_MAX) : PAPER_LEVERAGE_MAX;
  return { maxLeverage };
}
