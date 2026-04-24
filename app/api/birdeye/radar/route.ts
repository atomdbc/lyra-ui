import { NextResponse } from "next/server";
import {
  fetchBirdeyeNewListings,
  fetchBirdeyeTokenSecurity,
  fetchBirdeyeTrending,
  type BirdeyeNewListingItem,
  type BirdeyeTrendingToken,
} from "@/core/server/birdeye/birdeye-client";

type RadarMode = "trending" | "new";

type RadarToken = {
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

function normalizeNum(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function pickSecuritySummary(raw: Record<string, unknown> | undefined) {
  if (!raw) return null;
  return {
    mutableMetadata: typeof raw.mutableMetadata === "boolean" ? raw.mutableMetadata : null,
    freezeable: typeof raw.freezeable === "boolean" ? raw.freezeable : raw.freezeable == null ? null : Boolean(raw.freezeable),
    top10HolderPercent: normalizeNum(raw.top10HolderPercent),
    jupStrictList: typeof raw.jupStrictList === "boolean" ? raw.jupStrictList : null,
  };
}

function computeScore(input: {
  liquidityUSD: number | null;
  volume24hUSD: number | null;
  price24hChangePercent: number | null;
  security: ReturnType<typeof pickSecuritySummary>;
}) {
  let score = 50;
  const why: string[] = [];
  const warnings: string[] = [];

  if (input.liquidityUSD != null) {
    if (input.liquidityUSD >= 250_000) {
      score += 12;
      why.push("Strong liquidity");
    } else if (input.liquidityUSD >= 50_000) {
      score += 6;
      why.push("Decent liquidity");
    } else if (input.liquidityUSD < 10_000) {
      score -= 15;
      warnings.push("Very low liquidity");
    }
  }

  if (input.volume24hUSD != null) {
    if (input.volume24hUSD >= 1_000_000) {
      score += 10;
      why.push("High 24h volume");
    } else if (input.volume24hUSD < 50_000) {
      score -= 6;
      warnings.push("Low 24h volume");
    }
  }

  if (input.price24hChangePercent != null) {
    if (input.price24hChangePercent >= 50) {
      score += 6;
      why.push("Strong momentum (24h)");
    } else if (input.price24hChangePercent <= -25) {
      score -= 6;
      warnings.push("Downtrend (24h)");
    }
  }

  if (input.security) {
    if (input.security.jupStrictList === true) {
      score += 6;
      why.push("On Jupiter strict list");
    } else if (input.security.jupStrictList === false) {
      score -= 4;
      warnings.push("Not on Jupiter strict list");
    }

    if (input.security.mutableMetadata === true) {
      score -= 6;
      warnings.push("Mutable metadata");
    }

    if (input.security.freezeable === true) {
      score -= 8;
      warnings.push("Freezeable token");
    }

    if (input.security.top10HolderPercent != null) {
      if (input.security.top10HolderPercent >= 0.6) {
        score -= 14;
        warnings.push("Top holders concentration is high");
      } else if (input.security.top10HolderPercent <= 0.25) {
        score += 6;
        why.push("Healthy distribution (top holders)");
      }
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, why: why.length ? why : ["Scored from liquidity, volume, momentum, and security signals"], warnings };
}

function tokenFromTrending(t: BirdeyeTrendingToken): Omit<RadarToken, "security" | "score" | "why" | "warnings"> {
  return {
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    logoURI: t.logoURI ?? null,
    liquidityUSD: Number.isFinite(t.liquidity) ? t.liquidity : null,
    priceUSD: Number.isFinite(t.price) ? t.price : null,
    price24hChangePercent: Number.isFinite(t.price24hChangePercent) ? t.price24hChangePercent : null,
    volume24hUSD: Number.isFinite(t.volume24hUSD) ? t.volume24hUSD : null,
  };
}

function tokenFromNewListing(t: BirdeyeNewListingItem): Omit<RadarToken, "security" | "score" | "why" | "warnings"> {
  return {
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    logoURI: t.logoURI ?? null,
    liquidityUSD: t.liquidity != null && Number.isFinite(t.liquidity) ? t.liquidity : null,
    priceUSD: null,
    price24hChangePercent: null,
    volume24hUSD: null,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "trending") as RadarMode;
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 20);

    const rawItems =
      mode === "new"
        ? (await fetchBirdeyeNewListings({ limit, meme_platform_enabled: true })).data?.items?.map(
            tokenFromNewListing
          ) ?? []
        : (await fetchBirdeyeTrending({ limit, interval: "24h", sort_by: "rank", sort_type: "asc" })).data?.tokens?.map(
            tokenFromTrending
          ) ?? [];

    const enriched = await Promise.all(
      rawItems.map(async (item: Omit<RadarToken, "security" | "score" | "why" | "warnings">) => {
        let security: ReturnType<typeof pickSecuritySummary> = null;
        try {
          const sec = await fetchBirdeyeTokenSecurity({ address: item.address, chain: "solana" });
          security = pickSecuritySummary(sec.data);
        } catch {
          security = null;
        }
        const scoring = computeScore({
          liquidityUSD: item.liquidityUSD,
          volume24hUSD: item.volume24hUSD,
          price24hChangePercent: item.price24hChangePercent,
          security,
        });
        return {
          ...item,
          security,
          score: scoring.score,
          why: scoring.why,
          warnings: scoring.warnings,
        } satisfies RadarToken;
      })
    );

    const sorted = [...enriched].sort((a, b) => b.score - a.score);

    return NextResponse.json(
      {
        ok: true,
        mode,
        limit,
        updatedAt: new Date().toISOString(),
        tokens: sorted,
        note: "Birdeye: /defi/token_trending or /defi/v2/tokens/new_listing + per-token /defi/token_security",
      },
      {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Birdeye radar route failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to load Birdeye radar.",
      },
      { status: 502 }
    );
  }
}

