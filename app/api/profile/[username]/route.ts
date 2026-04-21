import { getPublicProfileByUsername } from "@/core/server/services/profile-service";

function normalizeProfileError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("schema cache") && lower.includes("workspace_users")) {
    return "Profile schema upgrade is pending on production. Apply supabase/migrations/20260408_growth_onboarding_social.sql.";
  }
  return message;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const params = await context.params;
    const payload = await getPublicProfileByUsername(params.username);
    return Response.json(payload);
  } catch (error) {
    const message = normalizeProfileError(error instanceof Error ? error.message : "Profile not found.");
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}
