import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CopilotAssessment, RiskLevel } from "@/types";

interface CopilotState {
  assessment: CopilotAssessment | null;
  analyzing: boolean;
  error: string | null;
  hasResult: boolean;
}

const initialState: CopilotState = {
  assessment: null,
  analyzing: false,
  error: null,
  hasResult: false,
};

const copilotSlice = createSlice({
  name: "copilot",
  initialState,
  reducers: {
    analyzeStart: (state) => {
      state.analyzing = true;
      state.error = null;
    },
    analyzeSuccess: (state, action: PayloadAction<CopilotAssessment>) => {
      state.analyzing = false;
      state.assessment = action.payload;
      state.hasResult = true;
    },
    analyzeFailure: (state, action: PayloadAction<string>) => {
      state.analyzing = false;
      state.error = action.payload;
    },
    clearAssessment: (state) => {
      state.assessment = null;
      state.hasResult = false;
      state.error = null;
    },
    setRiskLevel: (state, _action: PayloadAction<RiskLevel>) => {
      if (state.assessment) {
        state.assessment.risk_level = _action.payload;
      }
    },
  },
});

export const {
  analyzeStart,
  analyzeSuccess,
  analyzeFailure,
  clearAssessment,
  setRiskLevel,
} = copilotSlice.actions;

export default copilotSlice.reducer;
