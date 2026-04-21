import { authenticatePrivyRequest } from "@/core/server/auth/privy-server";
import { updateWorkspaceProfile } from "@/core/server/services/profile-service";

function normalizeProfileError(message: string) {
  const lower = message.toLowerCase();
  const missingProfileColumns =
    lower.includes("schema cache") &&
    lower.includes("workspace_users") &&
    (lower.includes("profile_visibility") ||
      lower.includes("public_trade_feed_opt_in") ||
      lower.includes("username") ||
      lower.includes("avatar_url"));

  if (missingProfileColumns) {
    return "Profile schema upgrade is pending. Apply supabase/migrations/20260408_growth_onboarding_social.sql on production Supabase, then refresh PostgREST schema cache.";
  }

  return message;
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticatePrivyRequest(request);
    const payload = (await request.json()) as {
      username?: string | null;
      avatarUrl?: string | null;
      profileVisibility?: "public" | "private";
      publicTradeFeedOptIn?: boolean;
    };

    await updateWorkspaceProfile(auth.privyUserId, payload);
    return Response.json({ ok: true });
  } catch (error) {
    const message = normalizeProfileError(
      error instanceof Error ? error.message : "Unable to update profile."
    );
    const status = message.toLowerCase().includes("bearer") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
