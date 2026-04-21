import "server-only";

import { mapPaperAccount, mapWorkspaceActivity } from "@/core/server/services/paper-mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

type WorkspaceUserLookup = { id: string };
type PaperAccountRow = {
  id: string;
  workspace_user_id: string;
  currency: string;
  starting_balance: number | string;
  cash_balance: number | string;
  realized_pnl: number | string;
  updated_at: string;
};
type WorkspaceActivityRow = {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  product_id: string | null;
  source: "workspace" | "record";
  created_at: string;
};

export async function topUpPaperBalance(privyUserId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: user, error: userError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("privy_user_id", privyUserId)
    .maybeSingle<WorkspaceUserLookup>();

  if (userError || !user?.id) {
    throw new Error("Workspace user not found.");
  }

  const { data: account, error: accountError } = await supabase
    .from("paper_accounts")
    .select("id, workspace_user_id, currency, starting_balance, cash_balance, realized_pnl, updated_at")
    .eq("workspace_user_id", user.id)
    .maybeSingle<PaperAccountRow>();

  if (accountError || !account) {
    throw new Error("Paper account not found.");
  }

  const starting = Number(account.starting_balance ?? 0);
  const current = Number(account.cash_balance ?? 0);
  const refill = Math.max(0, starting - current);

  let nextAccount = account;
  if (refill > 0) {
    const { data: updated, error: updateError } = await supabase
      .from("paper_accounts")
      .update({
        cash_balance: starting,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id)
      .select("id, workspace_user_id, currency, starting_balance, cash_balance, realized_pnl, updated_at")
      .single<PaperAccountRow>();
    if (updateError || !updated) {
      throw new Error(`Unable to top up paper balance: ${updateError?.message ?? "unknown error"}`);
    }
    nextAccount = updated;
  }

  const { data: activity, error: activityError } = await supabase
    .from("workspace_activity")
    .insert({
      workspace_user_id: user.id,
      type: "account.topup",
      title: refill > 0 ? "Paper balance topped up" : "Paper balance checked",
      detail: refill > 0 ? `Added ${refill.toFixed(2)} USDT to restore starting balance.` : "Balance already at or above starting amount.",
      source: "workspace",
    })
    .select("id, type, title, detail, product_id, source, created_at")
    .single<WorkspaceActivityRow>();

  if (activityError || !activity) {
    throw new Error(`Unable to log top-up activity: ${activityError?.message ?? "unknown error"}`);
  }

  return {
    account: mapPaperAccount(nextAccount),
    activity: mapWorkspaceActivity(activity),
    refilledAmount: refill,
  };
}
