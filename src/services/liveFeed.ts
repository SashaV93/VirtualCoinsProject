/**
 * The live report's price source.
 *
 * Every provider here honours the same contract the task lays down: ONE HTTP
 * request per tick returns the USD price of *all* selected coins together —
 * never one request per coin.
 *
 * Why there is more than one provider: the task sheet's CryptoCompare endpoint
 * now answers `401 API key required` (CoinDesk took the service over), and
 * CoinGecko's free tier starts returning 429 after ~4 calls, so neither can
 * drive a once-per-second chart on its own. Coinbase and Binance both sustain
 * 1 req/s keyless, so one of them is the default and CryptoCompare is used as
 * soon as a key is supplied.
 */
import { simulateLivePrices } from './demoFeed';

export type LiveProvider = 'coinbase' | 'binance' | 'cryptocompare' | 'demo';

export interface LiveQuote {
  /** Uppercase coin symbol -> price in USD. */
  prices: Record<string, number>;
  /** Selected symbols this provider does not quote. */
  missing: string[];
}

export const PROVIDER_LABELS: Record<LiveProvider, string> = {
  coinbase: 'Coinbase',
  binance: 'Binance',
  cryptocompare: 'CryptoCompare',
  demo: 'Demo (simulated)',
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Network error — check your internet connection.');
  }
  if (!res.ok) throw new Error(`Request failed with status ${res.status}.`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Coinbase — one call returns every currency, so the URL never changes
 * ------------------------------------------------------------------ */

async function fromCoinbase(symbols: string[]): Promise<LiveQuote> {
  const data = await getJson<{ data?: { rates?: Record<string, string> } }>(
    'https://api.coinbase.com/v2/exchange-rates?currency=USD',
  );
  const rates = data.data?.rates;
  if (!rates) throw new Error('Coinbase returned no rates.');

  const prices: Record<string, number> = {};
  const missing: string[] = [];
  for (const symbol of symbols) {
    // A rate is "how many SYMBOL you get for 1 USD", so invert it.
    const rate = Number(rates[symbol]);
    if (Number.isFinite(rate) && rate > 0) prices[symbol] = 1 / rate;
    else missing.push(symbol);
  }
  return { prices, missing };
}

/* ------------------------------------------------------------------ *
 * Binance — quote against USDT, after learning which pairs exist
 * ------------------------------------------------------------------ */

/** Fetched once; the set of tradable pair names, e.g. "BTCUSDT". */
let binancePairsPromise: Promise<Set<string>> | null = null;

function binancePairs(): Promise<Set<string>> {
  binancePairsPromise ??= getJson<{ symbol: string }[]>(
    'https://api.binance.com/api/v3/ticker/price',
  )
    .then((all) => new Set(all.map((t) => t.symbol)))
    .catch((err: unknown) => {
      binancePairsPromise = null; // let a later tick retry
      throw err;
    });
  return binancePairsPromise;
}

/**
 * Binance has no USDTUSDT pair, so tether is priced through USDC:
 * USDCUSDT is "USDT per 1 USDC", and USDC ≈ USD, so invert it.
 */
function binancePairFor(symbol: string, pairs: Set<string>): string | null {
  if (symbol === 'USDT') return pairs.has('USDCUSDT') ? 'USDCUSDT' : null;
  if (pairs.has(`${symbol}USDT`)) return `${symbol}USDT`;
  if (pairs.has(`${symbol}USDC`)) return `${symbol}USDC`;
  return null;
}

async function fromBinance(symbols: string[]): Promise<LiveQuote> {
  const pairs = await binancePairs();

  const wanted = new Map<string, string>(); // pair -> coin symbol
  const missing: string[] = [];
  for (const symbol of symbols) {
    const pair = binancePairFor(symbol, pairs);
    if (pair) wanted.set(pair, symbol);
    else missing.push(symbol);
  }
  if (wanted.size === 0) return { prices: {}, missing };

  // One request for every pair at once. Binance rejects the whole batch if a
  // pair is unknown, which is exactly why the set above is consulted first.
  const query = encodeURIComponent(JSON.stringify([...wanted.keys()]));
  const tickers = await getJson<{ symbol: string; price: string }[]>(
    `https://api.binance.com/api/v3/ticker/price?symbols=${query}`,
  );

  const prices: Record<string, number> = {};
  for (const ticker of tickers) {
    const symbol = wanted.get(ticker.symbol);
    const value = Number(ticker.price);
    if (!symbol || !Number.isFinite(value) || value <= 0) continue;
    prices[symbol] = symbol === 'USDT' ? 1 / value : value;
  }
  return { prices, missing };
}

/* ------------------------------------------------------------------ *
 * CryptoCompare — the endpoint named in the task sheet
 * ------------------------------------------------------------------ */

async function fromCryptoCompare(symbols: string[], apiKey: string): Promise<LiveQuote> {
  const fsyms = symbols.map((s) => s.toLowerCase()).join(',');
  const key = apiKey.trim();

  let data: Record<string, unknown>;
  try {
    data = await getJson<Record<string, unknown>>(
      `https://min-api.cryptocompare.com/data/pricemulti?tsyms=usd&fsyms=${fsyms}`,
      key ? { headers: { authorization: `Apikey ${key}` } } : undefined,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // A keyless 401 carries no CORS headers, so the browser reports it as a
    // generic network failure. Name the real cause instead.
    if (message.includes('401') || !key) {
      throw new Error(
        'CryptoCompare requires a free API key — their min-api endpoints reject keyless requests. Add a key below, or pick a different provider.',
      );
    }
    throw err;
  }

  if ((data as { Response?: string }).Response === 'Error') {
    throw new Error((data as { Message?: string }).Message ?? 'CryptoCompare returned an error.');
  }

  const prices: Record<string, number> = {};
  for (const [symbol, quote] of Object.entries(data)) {
    const usd = (quote as { USD?: number })?.USD;
    if (typeof usd === 'number') prices[symbol.toUpperCase()] = usd;
  }
  return { prices, missing: symbols.filter((s) => !(s in prices)) };
}

/* ------------------------------------------------------------------ */

export interface LiveFeedOptions {
  cryptoCompareKey: string;
  /** Previous simulated tick and starting prices — demo provider only. */
  demoPrevious: Record<string, number>;
  demoSeeds: Record<string, number>;
}

/** Fetches one tick for every symbol using a single request. */
export function fetchLiveQuote(
  provider: LiveProvider,
  symbols: string[],
  options: LiveFeedOptions,
): Promise<LiveQuote> {
  if (symbols.length === 0) return Promise.resolve({ prices: {}, missing: [] });

  switch (provider) {
    case 'binance':
      return fromBinance(symbols);
    case 'cryptocompare':
      return fromCryptoCompare(symbols, options.cryptoCompareKey);
    case 'demo':
      return Promise.resolve({
        prices: simulateLivePrices(options.demoPrevious, options.demoSeeds),
        missing: [],
      });
    case 'coinbase':
    default:
      return fromCoinbase(symbols);
  }
}
