import { authenticatePrivyRequest } from "@/core/server/auth/privy-server";
import { topUpPaperBalance } from "@/core/server/services/paper-account-service";

export async function POST(request: Request) {
  try {
    const auth = await authenticatePrivyRequest(request);
    const result = await topUpPaperBalance(auth.privyUserId);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to top up paper balance.";
    const status = message.toLowerCase().includes("bearer") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
