"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileUsernameAvailabilityQueryKey } from "@/core/services/query-keys";
import { fetchUsernameAvailability } from "@/core/services/growth-api";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

function sanitizeUsername(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

export function useUsernameAvailability(rawUsername: string) {
  const auth = useWorkspaceAuth();
  const [debouncedUsername, setDebouncedUsername] = useState(sanitizeUsername(rawUsername));
  const username = sanitizeUsername(rawUsername);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedUsername(username);
    }, 220);
    return () => window.clearTimeout(timeoutId);
  }, [username]);

  return useQuery({
    queryKey: [...profileUsernameAvailabilityQueryKey, auth.userId, debouncedUsername],
    enabled: auth.ready && auth.authenticated && debouncedUsername.length >= 3,
    staleTime: 15_000,
    queryFn: async () => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Unable to verify session.");
      }
      return fetchUsernameAvailability(
        accessToken,
        {
          walletAddress: auth.walletAddress,
          email: auth.email,
          displayName: auth.displayName,
        },
        debouncedUsername
      );
    },
  });
}
