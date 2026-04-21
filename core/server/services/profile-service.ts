import "server-only";

import {
  PublicProfileSummary,
  PublicTradeFeedItem,
  WeeklyLeaderboardEntry,
} from "@/core/paper/types";
import {
  LeaderboardCloseRow,
  LeaderboardUserRow,
  PaperTradeProfileRow,
  WorkspaceUserProfileRow,
} from "@/core/server/services/profile-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

function validateUsername(input: string) {
  return /^[a-z0-9_]{3,24}$/.test(input);
}

export async function updateWorkspaceProfile(
  privyUserId: string,
  input: {
    username?: string | null;
    avatarUrl?: string | null;
    profileVisibility?: "public" | "private";
    publicTradeFeedOptIn?: boolean;
  }
) {
  const supabase = getSupabaseAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof input.username !== "undefined") {
    const username = input.username?.trim() ?? "";
    if (username && !validateUsername(username)) {
      throw new Error("Username must be 3-24 chars using lowercase letters, numbers, or underscore.");
    }
    updates.username = username ? normalizeUsername(username) : null;
  }
  if (typeof input.avatarUrl !== "undefined") {
    updates.avatar_url = input.avatarUrl?.trim() || null;
  }
  if (typeof input.profileVisibility !== "undefined") {
    updates.profile_visibility = input.profileVisibility;
  }
  if (typeof input.publicTradeFeedOptIn !== "undefined") {
    updates.public_trade_feed_opt_in = input.publicTradeFeedOptIn;
  }

  const { error } = await supabase
    .from("workspace_users")
    .update(updates)
    .eq("privy_user_id", privyUserId);

  if (error) {
    if (error.message.toLowerCase().includes("workspace_users_username_key")) {
      throw new Error("Username is already taken.");
    }
    throw new Error(`Unable to update profile: ${error.message}`);
  }
}

function buildProfileSummary(args: {
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
  joinedAt: string;
  trades: PaperTradeProfileRow[];
  pnlVisible: boolean;
}): PublicProfileSummary {
  const closes = args.trades.filter((item) => String(item.action) === "close");
  const wins = closes.filter((item) => toNumber(item.realized_pnl) > 0).length;
  const totalRealizedPnl = closes.reduce((sum, item) => sum + toNumber(item.realized_pnl), 0);

  return {
    username: args.username,
    avatarUrl: args.avatarUrl,
    displayName: args.displayName,
    joinedAt: args.joinedAt,
    totalRealizedPnl: args.pnlVisible ? totalRealizedPnl : 0,
    winRate: args.pnlVisible && closes.length > 0 ? (wins / closes.length) * 100 : null,
    totalTrades: closes.length,
    pnlVisible: args.pnlVisible,
  };
}

export async function getPublicProfileByUsername(usernameInput: string): Promise<{
  profile: PublicProfileSummary;
  trades: PublicTradeFeedItem[];
}> {
  const username = normalizeUsername(usernameInput);
  const supabase = getSupabaseAdminClient();
  const { data: user, error: userError } = await supabase
    .from("workspace_users")
    .select("id, username, avatar_url, display_name, created_at, profile_visibility, public_trade_feed_opt_in")
    .eq("username", username)
    .maybeSingle<WorkspaceUserProfileRow>();

  if (userError || !user || user.profile_visibility === "private") {
    throw new Error("Profile not found.");
  }

  const { data: trades, error: tradesError } = await supabase
    .from("paper_trades")
    .select("id, symbol, action, realized_pnl, price, executed_at")
    .eq("workspace_user_id", user.id)
    .order("executed_at", { ascending: false })
    .limit(60)
    .returns<PaperTradeProfileRow[]>();

  if (tradesError) {
    throw new Error(`Unable to load profile trades: ${tradesError.message}`);
  }

  const tradeRows = trades ?? [];
  const pnlVisible = user.public_trade_feed_opt_in !== false;
  const profile = buildProfileSummary({
    username: String(user.username ?? username),
    avatarUrl: user.avatar_url ?? null,
    displayName: user.display_name ?? null,
    joinedAt: String(user.created_at),
    trades: tradeRows,
    pnlVisible,
  });

  const publicTrades: PublicTradeFeedItem[] = tradeRows
    .filter((row) => row.action === "close" || user.public_trade_feed_opt_in !== false)
    .slice(0, 24)
    .map((row) => ({
      id: String(row.id),
      username: profile.username,
      symbol: String(row.symbol),
      action: row.action === "close" ? "close" : row.action === "increase" ? "increase" : "open",
      realizedPnl: pnlVisible ? toNumber(row.realized_pnl) : 0,
      price: toNumber(row.price),
      executedAt: String(row.executed_at),
    }));

  return { profile, trades: publicTrades };
}

export async function getWeeklyLeaderboard(): Promise<WeeklyLeaderboardEntry[]> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: users, error: usersError } = await supabase
    .from("workspace_users")
    .select("id, username, avatar_url, profile_visibility")
    .eq("profile_visibility", "public")
    .not("username", "is", null)
    .returns<LeaderboardUserRow[]>();

  if (usersError || !users?.length) {
    return [];
  }

  const userIds = users.map((user) => String(user.id));
  const { data: closes, error: closesError } = await supabase
    .from("paper_trades")
    .select("workspace_user_id, realized_pnl")
    .eq("action", "close")
    .gte("executed_at", since)
    .in("workspace_user_id", userIds)
    .returns<LeaderboardCloseRow[]>();

  if (closesError) {
    return [];
  }

  const aggregates = new Map<string, { pnl: number; trades: number }>();
  for (const close of closes ?? []) {
    const key = String(close.workspace_user_id);
    const current = aggregates.get(key) ?? { pnl: 0, trades: 0 };
    aggregates.set(key, {
      pnl: current.pnl + toNumber(close.realized_pnl),
      trades: current.trades + 1,
    });
  }

  const ranked = users
    .map((user) => {
      const aggregate = aggregates.get(String(user.id)) ?? { pnl: 0, trades: 0 };
      return {
        username: String(user.username),
        avatarUrl: user.avatar_url ?? null,
        weeklyRealizedPnl: aggregate.pnl,
        tradeCount: aggregate.trades,
      };
    })
    .sort((left, right) => right.weeklyRealizedPnl - left.weeklyRealizedPnl)
    .slice(0, 50);

  return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
