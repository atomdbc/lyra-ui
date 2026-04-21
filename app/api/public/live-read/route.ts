import { getPublicLiveRead } from "@/core/server/services/public-trading-feed-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const read = await getPublicLiveRead(productId);
    return Response.json({ read });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load live read.";
    return Response.json({ error: message }, { status: 500 });
  }
}
