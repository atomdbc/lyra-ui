import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; source?: string };
    const email = normalizeEmail(payload.email ?? "");
    if (!email || !isValidEmail(email)) {
      throw new Error("Provide a valid email.");
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("waitlist_signups").upsert(
      {
        email,
        source: payload.source?.trim() || "mobile_holding",
      },
      { onConflict: "email" }
    );

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join waitlist.";
    return Response.json({ error: message }, { status: 400 });
  }
}
