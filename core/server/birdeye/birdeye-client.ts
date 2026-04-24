import "server-only";

/**
 * Birdeye Data Services client (server-side only).
 *
 * Docs: https://docs.birdeye.so/
 * Base: https://public-api.birdeye.so
 * Auth: X-API-KEY header + optional x-chain header (default solana).
 */

const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

export type BirdeyeChain =
  | "solana"
  | "ethereum"
  | "arbitrum"
  | "avalanche"
  | "bsc"
  | "optimism"
  | "polygon"
  | "base"
  | "zksync"
  | "monad"
  | "hyperevm"
  | "aptos"
  | "fogo"
  | "mantle"
  | "megaeth";

export type BirdeyeTrendingToken = {
  address: string;
  decimals: number;
  liquidity: number;
  logoURI: string | null;
  name: string;
  symbol: string;
  volume24hUSD: number;
  volume24hChangePercent: number;
  rank: number;
  price: number;
  price24hChangePercent: number;
  fdv: number | null;
  marketcap: number | null;
};

export type BirdeyeTrendingResponse = {
  success: boolean;
  data?: {
    updateUnixTime: number;
    updateTime: string;
    total: number;
    tokens: BirdeyeTrendingToken[];
  };
  message?: string;
};

export type BirdeyeNewListingItem = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  source: string | null;
  liquidityAddedAt: string | null;
  logoURI: string | null;
  liquidity: number | null;
};

export type BirdeyeNewListingResponse = {
  success: boolean;
  data?: { items: BirdeyeNewListingItem[] };
  message?: string;
};

/** Security response is a wide union across chains; keep as unknown and pick fields we need. */
export type BirdeyeTokenSecurityResponse = {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
};

function getBirdeyeApiKey() {
  const key = process.env.BIRDEYE_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing BIRDEYE_API_KEY.");
  }
  return key;
}

async function birdeyeFetch<T>(path: string, opts?: { chain?: BirdeyeChain; query?: Record<string, string | number | boolean | undefined> }) {
  const apiKey = getBirdeyeApiKey();
  const url = new URL(`${BIRDEYE_BASE_URL}${path}`);
  const query = opts?.query ?? {};
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-API-KEY": apiKey,
      "x-chain": opts?.chain ?? "solana",
    },
    // Next.js server fetch caching: allow route handlers to cache upstream calls.
    cache: "force-cache",
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Birdeye ${path} failed (${res.status}). ${text}`.trim());
  }

  return (await res.json()) as T;
}

export async function fetchBirdeyeTrending(args?: {
  chain?: BirdeyeChain;
  interval?: "1h" | "4h" | "24h";
  sort_by?: "rank" | "volumeUSD" | "liquidity";
  sort_type?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  return birdeyeFetch<BirdeyeTrendingResponse>("/defi/token_trending", {
    chain: args?.chain ?? "solana",
    query: {
      interval: args?.interval ?? "24h",
      sort_by: args?.sort_by ?? "rank",
      sort_type: args?.sort_type ?? "asc",
      limit: Math.min(Math.max(args?.limit ?? 10, 1), 20),
      offset: args?.offset ?? 0,
      ui_amount_mode: "scaled",
    },
  });
}

export async function fetchBirdeyeNewListings(args?: {
  chain?: BirdeyeChain;
  limit?: number;
  meme_platform_enabled?: boolean;
  time_to?: number;
}) {
  return birdeyeFetch<BirdeyeNewListingResponse>("/defi/v2/tokens/new_listing", {
    chain: args?.chain ?? "solana",
    query: {
      limit: Math.min(Math.max(args?.limit ?? 10, 1), 20),
      meme_platform_enabled: args?.meme_platform_enabled ?? true,
      time_to: args?.time_to,
    },
  });
}

export async function fetchBirdeyeTokenSecurity(args: { address: string; chain?: BirdeyeChain }) {
  return birdeyeFetch<BirdeyeTokenSecurityResponse>("/defi/token_security", {
    chain: args.chain ?? "solana",
    query: { address: args.address },
  });
}

