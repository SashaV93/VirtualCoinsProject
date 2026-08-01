import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchCoinPrices, fetchCoins } from '../services/coinsApi';
import type { Coin, CoinPrices, LoadStatus } from '../types/coin';
import type { RootState } from './store';

interface PriceEntry {
  status: LoadStatus;
  data: CoinPrices | null;
  error: string | null;
}

interface CoinsState {
  list: Coin[];
  status: LoadStatus;
  error: string | null;
  search: string;
  /** Cache of "More Info" prices, keyed by coin id, so re-opening a card is free. */
  prices: Record<string, PriceEntry>;
  /** Which cards currently have their "More Info" panel expanded. */
  expanded: string[];
}

const initialState: CoinsState = {
  list: [],
  status: 'idle',
  error: null,
  search: '',
  prices: {},
  expanded: [],
};

/** Loads the 100 coins once; later visits to the home page reuse the store. */
export const loadCoins = createAsyncThunk<Coin[], void, { state: RootState }>(
  'coins/load',
  async () => fetchCoins(),
  {
    condition: (_arg, { getState }) => {
      const { status } = getState().coins;
      return status !== 'loading' && status !== 'succeeded';
    },
  },
);

/** Loads USD/EUR/ILS for one coin, unless we already have them cached. */
export const loadCoinPrices = createAsyncThunk<
  { coinId: string; prices: CoinPrices },
  string,
  { state: RootState }
>(
  'coins/loadPrices',
  async (coinId) => ({ coinId, prices: await fetchCoinPrices(coinId) }),
  {
    condition: (coinId, { getState }) => {
      const entry = getState().coins.prices[coinId];
      return !entry || (entry.status !== 'loading' && entry.status !== 'succeeded');
    },
  },
);

const coinsSlice = createSlice({
  name: 'coins',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleExpanded(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.expanded = state.expanded.includes(id)
        ? state.expanded.filter((x) => x !== id)
        : [...state.expanded, id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCoins.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadCoins.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(loadCoins.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load coins.';
      })
      .addCase(loadCoinPrices.pending, (state, action) => {
        state.prices[action.meta.arg] = { status: 'loading', data: null, error: null };
      })
      .addCase(loadCoinPrices.fulfilled, (state, action) => {
        state.prices[action.payload.coinId] = {
          status: 'succeeded',
          data: action.payload.prices,
          error: null,
        };
      })
      .addCase(loadCoinPrices.rejected, (state, action) => {
        state.prices[action.meta.arg] = {
          status: 'failed',
          data: null,
          error: action.error.message ?? 'Failed to load prices.',
        };
      });
  },
});

export const { setSearch, toggleExpanded } = coinsSlice.actions;
export default coinsSlice.reducer;

/* ---------- selectors ---------- */

export const selectCoins = (s: RootState) => s.coins.list;
export const selectSearch = (s: RootState) => s.coins.search;

/** Case-insensitive filter over name and symbol — done locally, no server call. */
export function selectFilteredCoins(s: RootState): Coin[] {
  const term = s.coins.search.trim().toLowerCase();
  if (!term) return s.coins.list;
  return s.coins.list.filter(
    (c) => c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term),
  );
}
