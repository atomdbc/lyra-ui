import { getPublicLiveTrades } from "@/core/server/services/public-trading-feed-service";

export async function GET() {
  try {
    const trades = await getPublicLiveTrades(10);
    return Response.json({ trades });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load public trades.";
    return Response.json({ error: message }, { status: 500 });
  }
}
