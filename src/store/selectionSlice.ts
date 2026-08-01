import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadJson } from './storage';
import type { RootState } from './store';

/** The task caps the user at five simultaneously selected coins. */
export const MAX_SELECTED = 5;

export const SELECTION_STORAGE_KEY = 'cryptonite.selectedCoinIds';

interface SelectionState {
  /** Coin ids whose Switch is on. Order = selection order. */
  ids: string[];
  /**
   * Set when the user tried to turn on a sixth Switch. Holds the coin they
   * wanted, so the dialog can offer to swap it in.
   */
  pendingCoinId: string | null;
}

const initialState: SelectionState = {
  ids: loadJson<string[]>(SELECTION_STORAGE_KEY, []).slice(0, MAX_SELECTED),
  pendingCoinId: null,
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    /**
     * Turning a Switch off always works. Turning one on works only while there
     * is room; the sixth attempt opens the dialog instead of selecting.
     */
    toggleCoin(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.ids.includes(id)) {
        state.ids = state.ids.filter((x) => x !== id);
        return;
      }
      if (state.ids.length >= MAX_SELECTED) {
        state.pendingCoinId = id;
        return;
      }
      state.ids.push(id);
    },
    /** Dialog confirm: drop one coin and take the pending one in its place. */
    swapCoin(state, action: PayloadAction<string>) {
      const removeId = action.payload;
      const addId = state.pendingCoinId;
      if (!addId) return;
      state.ids = state.ids.filter((x) => x !== removeId);
      if (!state.ids.includes(addId) && state.ids.length < MAX_SELECTED) {
        state.ids.push(addId);
      }
      state.pendingCoinId = null;
    },
    /**
     * Dialog dismissed — by Cancel, Esc, backdrop click or the X. The pending
     * coin is simply dropped, so no sixth coin is ever selected.
     */
    cancelPending(state) {
      state.pendingCoinId = null;
    },
  },
});

export const { toggleCoin, swapCoin, cancelPending } = selectionSlice.actions;
export default selectionSlice.reducer;

/* ---------- selectors ---------- */

export const selectSelectedIds = (s: RootState) => s.selection.ids;
export const selectPendingCoinId = (s: RootState) => s.selection.pendingCoinId;
export const selectIsSelected = (id: string) => (s: RootState) => s.selection.ids.includes(id);
