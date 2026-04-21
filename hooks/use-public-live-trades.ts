"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublicLiveTrades } from "@/core/services/growth-api";
import { publicLiveTradesQueryKey } from "@/core/services/query-keys";

export function usePublicLiveTrades() {
  return useQuery({
    queryKey: publicLiveTradesQueryKey,
    queryFn: fetchPublicLiveTrades,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}
