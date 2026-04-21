"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperWorkspaceContext } from "@/core/paper/types";
import { workspaceContextQueryKey } from "@/core/services/query-keys";
import { topUpPaperBalanceRequest } from "@/core/services/workspace-api";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

export function usePaperBalanceTopUp() {
  const auth = useWorkspaceAuth();
  const queryClient = useQueryClient();
  const queryKey = [...workspaceContextQueryKey, auth.userId];

  return useMutation({
    mutationFn: async () => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Connect wallet to manage your paper balance.");
      }
      return topUpPaperBalanceRequest(accessToken);
    },
    onSuccess: ({ account, activity }) => {
      queryClient.setQueryData<PaperWorkspaceContext | undefined>(queryKey, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          account,
          activity: [activity, ...current.activity.filter((item) => item.id !== activity.id)].slice(0, 24),
        };
      });
    },
  });
}
