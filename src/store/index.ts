import { configureStore } from "@reduxjs/toolkit";
import complaintsReducer from "@/store/complaintsSlice";
import copilotReducer from "@/store/copilotSlice";
import settingsReducer from "@/store/settingsSlice";

export const store = configureStore({
  reducer: {
    complaints: complaintsReducer,
    copilot: copilotReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
