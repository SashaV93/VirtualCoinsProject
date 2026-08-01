import type { AiPayload, Coin, CoinPrices } from '../types/coin';

const COINGECKO = 'https://api.coingecko.com/api/v3';

/** Thrown when CoinGecko is throttling us, so callers know it is worth waiting. */
class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

const RATE_LIMIT_MESSAGE =
  'CoinGecko is rate-limiting this network (its free tier allows only a few calls per minute).';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Network error — check your internet connection.');
  }
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError(RATE_LIMIT_MESSAGE);
    throw new Error(`Request failed with status ${res.status}.`);
  }
  return (await res.json()) as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Backoff schedule in ms. Generous, because the limit resets on a minute window. */
const RETRY_DELAYS = [2_000, 6_000, 15_000];

/**
 * Runs `attempt`, retrying only when CoinGecko is throttling.
 * Anything else (a real network failure, a 500) fails immediately — retrying
 * those would just make the user wait for the same error.
 */
async function withRateLimitRetry<T>(attempt: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await attempt();
    } catch (err) {
      if (!(err instanceof RateLimitError) || i >= RETRY_DELAYS.length) throw err;
      await sleep(RETRY_DELAYS[i]);
    }
  }
}

/**
 * API #1 — the 100 coins shown on the home page.
 * `per_page=100&page=1` is CoinGecko's default, spelled out so the count the
 * task asks for cannot drift if that default ever changes.
 */
export function fetchCoins(): Promise<Coin[]> {
  return withRateLimitRetry(async () => {
    const coins = await getJson<Coin[]>(
      `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`,
    );
    // Throttled browser requests come back as "200 OK" with an empty array
    // rather than a 429, so an empty list here means the same thing.
    if (!Array.isArray(coins) || coins.length === 0) throw new RateLimitError(RATE_LIMIT_MESSAGE);
    return coins;
  });
}

/** API #2 — "More Info": the current price of one coin in USD / EUR / ILS. */
export function fetchCoinPrices(coinId: string): Promise<CoinPrices> {
  return withRateLimitRetry(async () => {
    const data = await getJson<{
      market_data?: { current_price?: Record<string, number> };
    }>(`${COINGECKO}/coins/${coinId}`);

    const price = data.market_data?.current_price;
    if (!price) throw new Error('No price data returned for this coin.');

    return { usd: price.usd ?? 0, eur: price.eur ?? 0, ils: price.ils ?? 0 };
  });
}

/* API #3 — the once-per-second live report — lives in `./liveFeed.ts`,
   which carries the several price providers it has to choose between. */

/** API #4 — the market data ChatGPT needs in order to reason about a coin. */
export function fetchAiPayload(coinId: string, coinName: string): Promise<AiPayload> {
  return withRateLimitRetry(async () => {
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
      price_change_percentage_200d_in_currency:
        md.price_change_percentage_200d_in_currency?.usd ?? 0,
    };
  });
}
