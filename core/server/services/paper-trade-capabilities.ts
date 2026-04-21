import "server-only";

import { PAPER_LEVERAGE_MAX } from "@/core/paper/leverage";

type PaperTradeCapabilities = {
  maxLeverage: number;
};

/**
 * Paper max leverage for the UI + validation.
 * Previously we probed Supabase with a fake user; error strings like "1x, 2x, or 3x" cached 3x for everyone.
 * Use env PAPER_MAX_LEVERAGE (1–40) or default to 40. The RPC may still enforce a lower DB limit per deploy.
 */
export async function getPaperTradeCapabilities(): Promise<PaperTradeCapabilities> {
  const raw = Number(process.env.PAPER_MAX_LEVERAGE ?? PAPER_LEVERAGE_MAX);
  const maxLeverage =
    Number.isFinite(raw) && raw >= 1 ? Math.min(Math.floor(raw), PAPER_LEVERAGE_MAX) : PAPER_LEVERAGE_MAX;
  return { maxLeverage };
}
