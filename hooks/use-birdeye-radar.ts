"use client";

import { useQuery } from "@tanstack/react-query";

export type BirdeyeRadarMode = "trending" | "new";

export type BirdeyeRadarToken = {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  liquidityUSD: number | null;
  priceUSD: number | null;
  price24hChangePercent: number | null;
  volume24hUSD: number | null;
  security: {
    mutableMetadata: boolean | null;
    freezeable: boolean | null;
    top10HolderPercent: number | null;
    jupStrictList: boolean | null;
  } | null;
  score: number;
  why: string[];
  warnings: string[];
};

export type BirdeyeRadarResponse = {
  ok: boolean;
  mode: BirdeyeRadarMode;
  limit: number;
  updatedAt: string;
  tokens: BirdeyeRadarToken[];
  note?: string;
  message?: string;
};

export function useBirdeyeRadar(args: { mode: BirdeyeRadarMode; limit?: number }) {
  const limit = args.limit ?? 12;
  return useQuery({
    queryKey: ["birdeye", "radar", args.mode, limit] as const,
    queryFn: async () => {
      const res = await fetch(`/api/birdeye/radar?mode=${encodeURIComponent(args.mode)}&limit=${limit}`);
      const json = (await res.json()) as BirdeyeRadarResponse;
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Birdeye radar failed.");
      }
      return json;
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

