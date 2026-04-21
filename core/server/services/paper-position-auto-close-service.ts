import "server-only";

import { fetchMarketOverviewServer } from "@/core/market/market-server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

type PositionRow = {
  id: string;
  product_id: string;
  direction: "long" | "short";
  quantity: number | string;
  stop_loss: number | string | null;
  take_profit: number | string | null;
};

const inflightByUser = new Map<string, Promise<void>>();

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shouldCloseByStopLoss(position: PositionRow, markPrice: number) {
  const stopLoss = toNumber(position.stop_loss);
  if (stopLoss <= 0 || markPrice <= 0) {
    return false;
  }
  return position.direction === "long" ? markPrice <= stopLoss : markPrice >= stopLoss;
}

function shouldCloseByTakeProfit(position: PositionRow, markPrice: number) {
  const takeProfit = toNumber(position.take_profit);
  if (takeProfit <= 0 || markPrice <= 0) {
    return false;
  }
  return position.direction === "long" ? markPrice >= takeProfit : markPrice <= takeProfit;
}

async function runAutoCloseForUser(privyUserId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: user, error: userError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("privy_user_id", privyUserId)
    .maybeSingle();

  if (userError || !user?.id) {
    return;
  }

  const { data: positions, error: positionsError } = await supabase
    .from("paper_positions")
    .select("id, product_id, direction, quantity, stop_loss, take_profit")
    .eq("workspace_user_id", user.id);

  if (positionsError || !positions?.length) {
    return;
  }

  const rows = positions as PositionRow[];
  const uniqueProductIds = [...new Set(rows.map((row) => row.product_id))];
  const markEntries = await Promise.all(
    uniqueProductIds.map(async (productId) => {
      try {
        const overview = await fetchMarketOverviewServer(productId);
        return [productId, toNumber(overview.price)] as const;
      } catch {
        return [productId, 0] as const;
      }
    })
  );
  const markByProduct = new Map(markEntries);

  for (const position of rows) {
    const markPrice = toNumber(markByProduct.get(position.product_id));
    if (markPrice <= 0) {
      continue;
    }

    const stopTriggered = shouldCloseByStopLoss(position, markPrice);
    const takeTriggered = shouldCloseByTakeProfit(position, markPrice);
    if (!stopTriggered && !takeTriggered) {
      continue;
    }

    const quantity = toNumber(position.quantity);
    if (quantity <= 0) {
      continue;
    }

    const note = stopTriggered
      ? "Position auto-closed by stop loss"
      : "Position auto-closed by take profit";

    await supabase.rpc("lyra_close_paper_position", {
      p_privy_user_id: privyUserId,
      p_product_id: position.product_id,
      p_quantity: quantity,
      p_price: markPrice,
      p_note: note,
    });
  }
}

export async function reconcilePaperPositionLevelsForUser(privyUserId: string) {
  const inflight = inflightByUser.get(privyUserId);
  if (inflight) {
    return inflight;
  }

  const run = runAutoCloseForUser(privyUserId).finally(() => {
    inflightByUser.delete(privyUserId);
  });

  inflightByUser.set(privyUserId, run);
  return run;
}
