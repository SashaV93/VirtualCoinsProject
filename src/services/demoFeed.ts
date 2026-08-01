/**
 * Simulated price feed.
 *
 * CryptoCompare's free `min-api` endpoints started returning 401 without an
 * API key, which leaves the live report blank for anyone who has not signed up
 * yet. This module fakes a plausible tick so the chart can still be
 * demonstrated. It is opt-in and the UI labels it loudly — it is never used
 * as a silent fallback for the real API.
 */

/** Box–Muller transform: a normal sample beats a flat one for price noise. */
function gaussian(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Advances each price by a small random step.
 * @param previous last simulated tick, empty on the first call
 * @param seeds fallback starting prices (the CoinGecko snapshot)
 */
export function simulateLivePrices(
  previous: Record<string, number>,
  seeds: Record<string, number>,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [symbol, seed] of Object.entries(seeds)) {
    const base = previous[symbol] ?? seed;
    // ~0.08% typical move per second, with a gentle pull back toward the seed
    // so the series wanders instead of drifting away for good.
    const drift = (seed - base) * 0.01;
    next[symbol] = Math.max(base + drift + base * gaussian() * 0.0008, seed * 0.5);
  }
  return next;
}
