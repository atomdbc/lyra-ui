/** Solana mint → third-party explorers (not Lyra paper markets). */

export function pumpFunCoinUrl(mint: string): string {
  return `https://pump.fun/coin/${encodeURIComponent(mint.trim())}`;
}

export function dexScreenerSolanaPairUrl(mint: string): string {
  return `https://dexscreener.com/solana/${encodeURIComponent(mint.trim())}`;
}
