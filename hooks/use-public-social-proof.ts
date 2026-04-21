"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublicSocialProof } from "@/core/services/growth-api";
import { publicSocialProofQueryKey } from "@/core/services/query-keys";

export function usePublicSocialProof() {
  return useQuery({
    queryKey: publicSocialProofQueryKey,
    queryFn: fetchPublicSocialProof,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}
