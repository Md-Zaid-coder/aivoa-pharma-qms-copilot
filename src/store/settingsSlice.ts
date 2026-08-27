import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  backendConnected: boolean;
  backendChecking: boolean;
  backendMessage: string;
  settingsOpen: boolean;
}

const initialState: SettingsState = {
  backendConnected: false,
  backendChecking: false,
  backendMessage: "Not checked",
  settingsOpen: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setBackendStatus: (state, action: PayloadAction<{ connected: boolean; message: string }>) => {
      state.backendConnected = action.payload.connected;
      state.backendMessage = action.payload.message;
      state.backendChecking = false;
    },
    setBackendChecking: (state, action: PayloadAction<boolean>) => {
      state.backendChecking = action.payload;
    },
    toggleSettings: (state, action: PayloadAction<boolean | undefined>) => {
      state.settingsOpen = action.payload === undefined ? !state.settingsOpen : action.payload;
    },
  },
});

export const {
  setBackendStatus,
  setBackendChecking,
  toggleSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;