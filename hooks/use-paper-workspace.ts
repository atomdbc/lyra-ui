"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPaperWorkspaceContext } from "@/core/services/workspace-api";
import { workspaceContextQueryKey } from "@/core/services/query-keys";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

export function usePaperWorkspace() {
  const auth = useWorkspaceAuth();

  return useQuery({
    queryKey: [...workspaceContextQueryKey, auth.userId],
    enabled: auth.ready && auth.authenticated,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    /** Re-fetch so TP/SL auto-close (server reconcile on context load) runs periodically while positions are open */
    refetchInterval: (query) => {
      const positions = query.state.data?.positions?.length ?? 0;
      return positions > 0 ? 12_000 : false;
    },
    queryFn: async () => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Unable to verify the current session.");
      }
      return fetchPaperWorkspaceContext(accessToken, {
        walletAddress: auth.walletAddress,
        email: auth.email,
        displayName: auth.displayName,
      });
    },
  });
}
