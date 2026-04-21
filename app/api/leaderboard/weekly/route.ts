import { getWeeklyLeaderboard } from "@/core/server/services/profile-service";

export async function GET() {
  try {
    const entries = await getWeeklyLeaderboard();
    return Response.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leaderboard.";
    return Response.json({ error: message }, { status: 500 });
  }
}
