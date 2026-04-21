import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

function normalizeUsername(input: string) {
  return input.toLowerCase().replace(/\s+/g, "").trim();
}

export async function checkUsernameAvailability(args: {
  privyUserId: string;
  usernameInput: string;
}) {
  const username = normalizeUsername(args.usernameInput);
  if (!username) {
    return {
      username,
      available: false,
      reason: "Username is required.",
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      username,
      available: false,
      reason: "Use 3-24 chars: lowercase letters, numbers, or underscore.",
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: workspaceUser, error: workspaceUserError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("privy_user_id", args.privyUserId)
    .maybeSingle<{ id: string }>();

  if (workspaceUserError || !workspaceUser?.id) {
    throw new Error("Workspace user not found.");
  }

  const { data: existingUsernameOwner, error: existingUsernameOwnerError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("username", username)
    .maybeSingle<{ id: string }>();

  if (existingUsernameOwnerError) {
    throw new Error(`Unable to check username availability: ${existingUsernameOwnerError.message}`);
  }

  if (!existingUsernameOwner || existingUsernameOwner.id === workspaceUser.id) {
    return {
      username,
      available: true,
      reason: null,
    };
  }

  return {
    username,
    available: false,
    reason: "Username is already taken.",
  };
}
