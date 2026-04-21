import "server-only";

import { randomUUID } from "crypto";
import { ShareCardTheme, ShareCardType } from "@/core/paper/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

function buildToken() {
  return randomUUID().replace(/-/g, "").slice(0, 20);
}

export async function createShareCard(args: {
  privyUserId: string;
  type: ShareCardType;
  theme: ShareCardTheme;
  payload: Record<string, unknown>;
  origin: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data: user, error: userError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("privy_user_id", args.privyUserId)
    .maybeSingle();

  if (userError || !user?.id) {
    throw new Error("Workspace user not found.");
  }

  const token = buildToken();
  const { error } = await supabase.from("share_cards").insert({
    workspace_user_id: user.id,
    type: args.type,
    theme: args.theme,
    payload: args.payload,
    public_token: token,
  });

  if (error) {
    const missingTable =
      error.code === "42P01" || error.message.toLowerCase().includes("share_cards");
    if (missingTable) {
      throw new Error(
        "Unable to create share card: Supabase table share_cards is missing. Run migration 20260408_growth_onboarding_social.sql."
      );
    }
    throw new Error(`Unable to create share card: ${error.message}`);
  }

  const shareUrl = `${args.origin}/share/${token}`;
  const imageUrl = `${args.origin}/share/${token}/opengraph-image`;
  const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    "My Lyra session snapshot"
  )}&url=${encodeURIComponent(shareUrl)}`;

  return {
    token,
    shareUrl,
    imageUrl,
    xIntentUrl,
  };
}

export async function getShareCardByToken(token: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_cards")
    .select("type, theme, payload, created_at")
    .eq("public_token", token)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Share card not found.");
  }

  return {
    type: data.type as ShareCardType,
    theme: data.theme as ShareCardTheme,
    payload: (data.payload as Record<string, unknown> | null) ?? {},
    createdAt: String(data.created_at),
  };
}
