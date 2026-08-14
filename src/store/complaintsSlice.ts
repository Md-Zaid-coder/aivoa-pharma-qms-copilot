import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Complaint, ComplaintFormInput, CopilotAssessment } from "@/types";

interface ComplaintsState {
  form: ComplaintFormInput;
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const emptyForm: ComplaintFormInput = {
  product_name: "",
  batch_number: "",
  manufacturing_site: "",
  complaint_source: "",
  severity_level: "",
  description: "",
};

const initialState: ComplaintsState = {
  form: emptyForm,
  complaints: [],
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    updateFormField: (state, action: PayloadAction<{ field: keyof ComplaintFormInput; value: string }>) => {
      state.form[action.payload.field] = action.payload.value;
    },
    setForm: (state, action: PayloadAction<ComplaintFormInput>) => {
      state.form = action.payload;
    },
    resetForm: (state) => {
      state.form = emptyForm;
    },
    fetchComplaintsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchComplaintsSuccess: (state, action: PayloadAction<Complaint[]>) => {
      state.loading = false;
      state.complaints = action.payload;
    },
    fetchComplaintsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    saveComplaintStart: (state) => {
      state.saving = true;
      state.saveError = null;
    },
    saveComplaintSuccess: (state, action: PayloadAction<Complaint>) => {
      state.saving = false;
      state.complaints = [action.payload, ...state.complaints];
    },
    saveComplaintFailure: (state, action: PayloadAction<string>) => {
      state.saving = false;
      state.saveError = action.payload;
    },
  },
});

export const {
  updateFormField,
  setForm,
  resetForm,
  fetchComplaintsStart,
  fetchComplaintsSuccess,
  fetchComplaintsFailure,
  saveComplaintStart,
  saveComplaintSuccess,
  saveComplaintFailure,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
