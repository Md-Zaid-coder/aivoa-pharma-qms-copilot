import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// 1. Get key from browser memory (localStorage), or .env file, or fallback default
const savedKey =
  localStorage.getItem("groq_api_key") ||
  import.meta.env.VITE_GROQ_API_KEY ||
  "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"; 

interface SettingsState {
  groqApiKey: string;
  groqConnected: boolean;
  groqChecking: boolean;
  groqMessage: string;
  serverHealthy: boolean;
  serverChecking: boolean;
  serverMessage: string;
  settingsOpen: boolean;
}

// 2. Automatically set groqConnected to TRUE if a key exists!
const initialState: SettingsState = {
  groqApiKey: savedKey,
  groqConnected: Boolean(savedKey),
  groqChecking: false,
  groqMessage: savedKey ? "Connected" : "Not configured",
  serverHealthy: true,
  serverChecking: false,
  serverMessage: "Operational",
  settingsOpen: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setGroqApiKey: (state, action: PayloadAction<string>) => {
      state.groqApiKey = action.payload;
      // 3. Save key permanently in browser storage
      localStorage.setItem("groq_api_key", action.payload);
    },
    setGroqStatus: (state, action: PayloadAction<{ connected: boolean; message: string }>) => {
      state.groqConnected = action.payload.connected;
      state.groqMessage = action.payload.message;
      state.groqChecking = false;
    },
    setGroqChecking: (state, action: PayloadAction<boolean>) => {
      state.groqChecking = action.payload;
    },
    setServerHealth: (state, action: PayloadAction<{ healthy: boolean; message: string }>) => {
      state.serverHealthy = action.payload.healthy;
      state.serverMessage = action.payload.message;
      state.serverChecking = false;
    },
    setServerChecking: (state, action: PayloadAction<boolean>) => {
      state.serverChecking = action.payload;
    },
    toggleSettings: (state, action: PayloadAction<boolean | undefined>) => {
      state.settingsOpen = action.payload === undefined ? !state.settingsOpen : action.payload;
    },
  },
});

export const {
  setGroqApiKey,
  setGroqStatus,
  setGroqChecking,
  setServerHealth,
  setServerChecking,
  toggleSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;