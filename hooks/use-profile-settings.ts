"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperWorkspaceContext } from "@/core/paper/types";
import { workspaceContextQueryKey } from "@/core/services/query-keys";
import { updateMyProfile } from "@/core/services/growth-api";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

export function useProfileSettings() {
  const auth = useWorkspaceAuth();
  const queryClient = useQueryClient();
  const queryKey = [...workspaceContextQueryKey, auth.userId];

  return useMutation({
    mutationFn: async (input: {
      username?: string | null;
      avatarUrl?: string | null;
      profileVisibility?: "public" | "private";
      publicTradeFeedOptIn?: boolean;
    }) => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Connect wallet to update profile.");
      }
      return updateMyProfile(
        accessToken,
        {
          walletAddress: auth.walletAddress,
          email: auth.email,
          displayName: auth.displayName,
        },
        input
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      queryClient.setQueryData<PaperWorkspaceContext | undefined>(queryKey, (current) => current);
    },
  });
}
