/** A single coin as returned by CoinGecko `/coins/markets`. */
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
}

/** Current price of one coin in the three currencies shown by "More Info". */
export interface CoinPrices {
  usd: number;
  eur: number;
  ils: number;
}

/** Exactly the fields the task requires us to send to ChatGPT. */
export interface AiPayload {
  name: string;
  current_price_usd: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_60d_in_currency: number;
  price_change_percentage_200d_in_currency: number;
}

export interface AiRecommendation {
  /** true = worth buying, false = not worth buying */
  worthBuying: boolean;
  explanation: string;
  /** Where the recommendation came from, so the UI can be honest about it. */
  source: 'openai' | 'local';
}

/** One sample of the live report: a timestamp plus price per coin symbol. */
export interface LiveSample {
  time: number;
  label: string;
  prices: Record<string, number>;
}

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
