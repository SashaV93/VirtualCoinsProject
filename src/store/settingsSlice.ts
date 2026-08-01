import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LiveProvider } from '../services/liveFeed';
import { loadJson } from './storage';
import type { RootState } from './store';

export const SETTINGS_STORAGE_KEY = 'cryptonite.settings';

const DEFAULT_MODEL = 'gpt-4o-mini';

interface SettingsState {
  /**
   * OpenAI key, supplied through `.env` as VITE_OPENAI_API_KEY.
   * Empty string = fall back to the built-in rule-based analysis.
   */
  apiKey: string;
  model: string;
  /**
   * CryptoCompare (CoinDesk) key. Their `min-api` endpoints now reject
   * keyless requests with 401, so that provider needs one.
   */
  cryptoCompareKey: string;
  /** Which source drives the once-per-second live report. */
  liveProvider: LiveProvider;
}

const persisted = loadJson<Partial<SettingsState>>(SETTINGS_STORAGE_KEY, {});

// Keys in .env win on first run; afterwards whatever the user typed persists.
const envOpenAiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? '';
const envCryptoCompareKey = (import.meta.env.VITE_CRYPTOCOMPARE_API_KEY as string | undefined) ?? '';

const cryptoCompareKey = persisted.cryptoCompareKey ?? envCryptoCompareKey;

const initialState: SettingsState = {
  apiKey: persisted.apiKey ?? envOpenAiKey,
  model: persisted.model || DEFAULT_MODEL,
  cryptoCompareKey,
  // With a key, prefer the endpoint the task sheet names; otherwise fall back
  // to a provider that actually works without one.
  liveProvider: persisted.liveProvider ?? (cryptoCompareKey ? 'cryptocompare' : 'coinbase'),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCryptoCompareKey(state, action: PayloadAction<string>) {
      state.cryptoCompareKey = action.payload;
    },
    setLiveProvider(state, action: PayloadAction<LiveProvider>) {
      state.liveProvider = action.payload;
    },
  },
});

export const { setCryptoCompareKey, setLiveProvider } = settingsSlice.actions;
export default settingsSlice.reducer;

export const selectApiKey = (s: RootState) => s.settings.apiKey;
export const selectModel = (s: RootState) => s.settings.model;
export const selectCryptoCompareKey = (s: RootState) => s.settings.cryptoCompareKey;
export const selectLiveProvider = (s: RootState) => s.settings.liveProvider;
