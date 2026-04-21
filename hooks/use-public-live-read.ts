"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublicLiveRead } from "@/core/services/growth-api";
import { publicLiveReadQueryKey } from "@/core/services/query-keys";

export function usePublicLiveRead(productId?: string | null) {
  return useQuery({
    queryKey: [...publicLiveReadQueryKey, productId ?? "default"],
    queryFn: () => fetchPublicLiveRead(productId ?? undefined),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
