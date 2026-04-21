export type WorkspaceUserProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  display_name: string | null;
  created_at: string;
  profile_visibility: "public" | "private" | null;
  public_trade_feed_opt_in: boolean | null;
};

export type PaperTradeProfileRow = {
  id: string;
  symbol: string;
  action: string;
  realized_pnl: number | string | null;
  price: number | string | null;
  executed_at: string;
};

export type LeaderboardUserRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export type LeaderboardCloseRow = {
  workspace_user_id: string;
  realized_pnl: number | string | null;
};
