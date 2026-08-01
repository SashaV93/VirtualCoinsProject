import type { AiPayload, Coin, CoinPrices } from '../types/coin';

const COINGECKO = 'https://api.coingecko.com/api/v3';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Network error — check your internet connection.');
  }
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(
        'CoinGecko rate limit reached (free tier allows a few calls per minute). Wait a moment and retry.',
      );
    }
    throw new Error(`Request failed with status ${res.status}.`);
  }
  return (await res.json()) as T;
}

/**
 * API #1 — the 100 coins shown on the home page.
 * `per_page=100&page=1` is CoinGecko's default, spelled out so the count the
 * task asks for cannot drift if that default ever changes.
 */
export function fetchCoins(): Promise<Coin[]> {
  return getJson<Coin[]>(
    `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`,
  );
}

/** API #2 — "More Info": the current price of one coin in USD / EUR / ILS. */
export async function fetchCoinPrices(coinId: string): Promise<CoinPrices> {
  const data = await getJson<{
    market_data?: { current_price?: Record<string, number> };
  }>(`${COINGECKO}/coins/${coinId}`);

  const price = data.market_data?.current_price;
  if (!price) throw new Error('No price data returned for this coin.');

  return { usd: price.usd ?? 0, eur: price.eur ?? 0, ils: price.ils ?? 0 };
}

/* API #3 — the once-per-second live report — lives in `./liveFeed.ts`,
   which carries the several price providers it has to choose between. */

/** API #4 — the market data ChatGPT needs in order to reason about a coin. */
export async function fetchAiPayload(coinId: string, coinName: string): Promise<AiPayload> {
  const data = await getJson<{
    name?: string;
    market_data?: {
      current_price?: Record<string, number>;
      market_cap?: Record<string, number>;
      total_volume?: Record<string, number>;
      price_change_percentage_30d_in_currency?: Record<string, number>;
      price_change_percentage_60d_in_currency?: Record<string, number>;
      price_change_percentage_200d_in_currency?: Record<string, number>;
    };
  }>(`${COINGECKO}/coins/${coinId}?market_data=true`);

  const md = data.market_data;
  if (!md) throw new Error('No market data returned for this coin.');

  return {
    name: data.name ?? coinName,
    current_price_usd: md.current_price?.usd ?? 0,
    market_cap_usd: md.market_cap?.usd ?? 0,
    volume_24h_usd: md.total_volume?.usd ?? 0,
    price_change_percentage_30d_in_currency: md.price_change_percentage_30d_in_currency?.usd ?? 0,
    price_change_percentage_60d_in_currency: md.price_change_percentage_60d_in_currency?.usd ?? 0,
    price_change_percentage_200d_in_currency: md.price_change_percentage_200d_in_currency?.usd ?? 0,
  };
}
