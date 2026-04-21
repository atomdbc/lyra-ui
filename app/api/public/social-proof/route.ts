import { getPublicSocialProof } from "@/core/server/services/public-trading-feed-service";

export async function GET() {
  try {
    const payload = await getPublicSocialProof();
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load social proof.";
    return Response.json({ error: message }, { status: 500 });
  }
}
