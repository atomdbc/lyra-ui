"use client";

import { useMutation } from "@tanstack/react-query";
import { ShareCardTheme, ShareCardType } from "@/core/paper/types";
import { createShareCard } from "@/core/services/growth-api";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

export function useShareCards() {
  const auth = useWorkspaceAuth();

  return useMutation({
    mutationFn: async (input: {
      type: ShareCardType;
      theme: ShareCardTheme;
      payload: Record<string, unknown>;
    }) => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Connect wallet to share cards.");
      }
      return createShareCard(
        accessToken,
        {
          walletAddress: auth.walletAddress,
          email: auth.email,
          displayName: auth.displayName,
        },
        input
      );
    },
  });
}
