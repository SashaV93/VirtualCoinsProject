import { configureStore } from '@reduxjs/toolkit';
import coinsReducer from './coinsSlice';
import selectionReducer, { SELECTION_STORAGE_KEY } from './selectionSlice';
import settingsReducer, { SETTINGS_STORAGE_KEY } from './settingsSlice';
import { saveJson } from './storage';

export const store = configureStore({
  reducer: {
    coins: coinsReducer,
    selection: selectionReducer,
    settings: settingsReducer,
  },
});

/**
 * Persist the two slices the user expects to survive a browser restart:
 * the selected Switches and the OpenAI settings.
 */
let lastIds = store.getState().selection.ids;
let lastSettings = store.getState().settings;

store.subscribe(() => {
  const state = store.getState();
  if (state.selection.ids !== lastIds) {
    lastIds = state.selection.ids;
    saveJson(SELECTION_STORAGE_KEY, lastIds);
  }
  if (state.settings !== lastSettings) {
    lastSettings = state.settings;
    saveJson(SETTINGS_STORAGE_KEY, lastSettings);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
