import { authenticatePrivyRequest } from "@/core/server/auth/privy-server";
import { checkUsernameAvailability } from "@/core/server/services/profile-availability-service";

export async function GET(request: Request) {
  try {
    const auth = await authenticatePrivyRequest(request);
    const url = new URL(request.url);
    const usernameInput = url.searchParams.get("username") ?? "";
    const result = await checkUsernameAvailability({
      privyUserId: auth.privyUserId,
      usernameInput,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check username.";
    const status = message.toLowerCase().includes("bearer") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
