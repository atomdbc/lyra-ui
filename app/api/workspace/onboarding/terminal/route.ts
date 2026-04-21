import { authenticatePrivyRequest } from "@/core/server/auth/privy-server";
import { markTerminalOnboardingSeen } from "@/core/server/services/paper-onboarding-service";

export async function PATCH(request: Request) {
  try {
    const auth = await authenticatePrivyRequest(request);
    await markTerminalOnboardingSeen(auth.privyUserId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to dismiss terminal onboarding.";
    const status = message.toLowerCase().includes("bearer") ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
