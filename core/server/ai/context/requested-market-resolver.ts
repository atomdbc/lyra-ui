import "server-only";

import { AiWorkspaceSelection } from "@/core/ai/types";
import { fetchMarketProductsServer } from "@/core/market/market-server";

type MarketMatch = {
  id: string;
  base: string;
  quote: string;
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function tokenizeMessage(message: string) {
  const lowered = message.toLowerCase();
  const sanitized = Array.from(lowered)
    .map((char) => ("abcdefghijklmnopqrstuvwxyz0123456789".includes(char) ? char : " "))
    .join("");

  return sanitized
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toMarketMatches(markets: Awaited<ReturnType<typeof fetchMarketProductsServer>>): MarketMatch[] {
  return markets.map((market) => ({
    id: market.id,
    base: normalizeToken(market.base_currency),
    quote: normalizeToken(market.quote_currency),
  }));
}

function findRequestedMarketId(message: string, matches: MarketMatch[]) {
  const tokens = tokenizeMessage(message);
  if (!tokens.length) {
    return null;
  }

  const tokenSet = new Set(tokens);

  for (const market of matches) {
    if (tokenSet.has(market.base) || tokenSet.has(`${market.base}${market.quote}`)) {
      return market.id;
    }
  }

  return null;
}

export async function resolveRequestedMarketSelection(
  message: string,
  selection: AiWorkspaceSelection
): Promise<AiWorkspaceSelection> {
  const markets = await fetchMarketProductsServer().catch(() => []);
  if (!markets.length) {
    return selection;
  }

  const requestedMarketId = findRequestedMarketId(message, toMarketMatches(markets));
  if (!requestedMarketId || requestedMarketId === selection.activeProductId) {
    return selection;
  }

  return {
    ...selection,
    activeProductId: requestedMarketId,
  };
}

