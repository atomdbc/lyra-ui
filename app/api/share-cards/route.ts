import { authenticatePrivyRequest } from "@/core/server/auth/privy-server";
import { ShareCardTheme, ShareCardType } from "@/core/paper/types";
import { createShareCard } from "@/core/server/services/share-card-service";

function normalizeShareCardError(message: string) {
  const lower = message.toLowerCase();
  const missingShareCardsTable =
    lower.includes("schema cache") && lower.includes("share_cards");

  if (missingShareCardsTable) {
    return "Share card storage is not ready on this Supabase instance. Apply supabase/migrations/20260408_growth_onboarding_social.sql, then refresh PostgREST schema cache.";
  }

  return message;
}

function resolveOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) {
    return "https://www.lyrabuild.xyz";
  }

  const safeHost = host.toLowerCase();
  const isAllowed =
    safeHost === "www.lyrabuild.xyz" ||
    safeHost === "lyrabuild.xyz" ||
    safeHost.startsWith("localhost:");
  if (!isAllowed) {
    return "https://www.lyrabuild.xyz";
  }

  const protocol = safeHost.startsWith("localhost:") ? "http" : request.headers.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatePrivyRequest(request);
    const payload = (await request.json()) as {
      type?: ShareCardType;
      theme?: ShareCardTheme;
      payload?: Record<string, unknown>;
    };

    if (!payload.type || !["session_pnl", "trade_result"].includes(payload.type)) {
      throw new Error("Unsupported share card type.");
    }
    if (!payload.theme || !["mono", "dark", "grid"].includes(payload.theme)) {
      throw new Error("Unsupported share card theme.");
    }

    const card = await createShareCard({
      privyUserId: auth.privyUserId,
      type: payload.type,
      theme: payload.theme,
      payload: payload.payload ?? {},
      origin: resolveOrigin(request),
    });

    return Response.json(card);
  } catch (error) {
    const message = normalizeShareCardError(
      error instanceof Error ? error.message : "Unable to create share card."
    );
    const status = message.toLowerCase().includes("bearer") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
