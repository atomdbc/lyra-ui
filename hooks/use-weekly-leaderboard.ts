"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWeeklyLeaderboard } from "@/core/services/growth-api";
import { weeklyLeaderboardQueryKey } from "@/core/services/query-keys";

export function useWeeklyLeaderboard() {
  return useQuery({
    queryKey: weeklyLeaderboardQueryKey,
    queryFn: fetchWeeklyLeaderboard,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
