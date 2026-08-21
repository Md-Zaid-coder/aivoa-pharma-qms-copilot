import { FlaskConical, Hash, Factory, Phone, AlertTriangle, FileText, Sparkles, Loader2, Zap, Save } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateFormField, setForm, resetForm, saveComplaintStart, saveComplaintSuccess, saveComplaintFailure } from "@/store/complaintsSlice";
import { analyzeStart, analyzeSuccess, analyzeFailure } from "@/store/copilotSlice";
import { analyzeComplaint, saveComplaint, checkBackendConnection } from "@/lib/api";
import { SAMPLE_COMPLAINTS } from "@/lib/sampleData";
import type { ComplaintFormInput } from "@/types";

const SEVERITY_OPTIONS = ["Minor", "Major", "Critical"];
const SOURCE_OPTIONS = ["Email", "PDF Report", "Customer Call", "Field Report", "Regulatory Authority", "Distributor"];
const SITE_OPTIONS = ["Plant A - API Manufacturing Facility", "Facility B - Packaging Line 4", "Plant C - FDF Production", "Facility D - Quality Control Lab"];

export default function ComplaintForm() {
  const dispatch = useAppDispatch();
  const { form, saving, saveError } = useAppSelector((s) => s.complaints);
  const { analyzing, hasResult, assessment } = useAppSelector((s) => s.copilot);
  // const { groqApiKey } = useAppSelector((s) => s.settings);

  const isFormValid =
    form.product_name.trim() &&
    form.batch_number.trim() &&
    form.manufacturing_site.trim() &&
    form.complaint_source.trim() &&
    form.severity_level.trim() &&
    form.description.trim();

  const handleChange = (field: keyof ComplaintFormInput, value: string) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleQuickFill = (index: number) => {
    dispatch(setForm(SAMPLE_COMPLAINTS[index].data));
  };

  const handleClear = () => {
    dispatch(resetForm());
  };

  const handleAnalyze = async () => {
    if (!isFormValid || analyzing) return;
    dispatch(analyzeStart());
    try {
      const result = await analyzeComplaint(form);
      dispatch(analyzeSuccess(result));
    } catch (err) {
      dispatch(analyzeFailure(err instanceof Error ? err.message : "Analysis failed"));
    }
  };

  const handleSave = async () => {
    if (!assessment) return;
    dispatch(saveComplaintStart());
    try {
      const saved = await saveComplaint(form, assessment);
      dispatch(saveComplaintSuccess(saved));
      dispatch(resetForm());
    } catch (err) {
      dispatch(saveComplaintFailure(err instanceof Error ? err.message : "Save failed"));
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Complaint Logging</h2>
            <p className="text-xs text-slate-400">Enter complaint details for AI analysis</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quick-Fill Test Cases
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_COMPLAINTS.map((sample, i) => (
              <button
                key={i}
                onClick={() => handleQuickFill(i)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <Zap className="h-3.5 w-3.5" />
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <FlaskConical className="h-3.5 w-3.5 text-slate-500" />
              Product / API Name
            </label>
            <input
              type="text"
              value={form.product_name}
              onChange={(e) => handleChange("product_name", e.target.value)}
              placeholder="e.g. Amoxicillin Trihydrate API"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Hash className="h-3.5 w-3.5 text-slate-500" />
              Batch / Lot Number
            </label>
            <input
              type="text"
              value={form.batch_number}
              onChange={(e) => handleChange("batch_number", e.target.value)}
              placeholder="e.g. B-992"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Factory className="h-3.5 w-3.5 text-slate-500" />
              Manufacturing Site
            </label>
            <select
              value={form.manufacturing_site}
              onChange={(e) => handleChange("manufacturing_site", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="">Select site...</option>
              {SITE_OPTIONS.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                Complaint Source
              </label>
              <select
                value={form.complaint_source}
                onChange={(e) => handleChange("complaint_source", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="">Select...</option>
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                Severity Level
              </label>
              <select
                value={form.severity_level}
                onChange={(e) => handleChange("severity_level", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="">Select...</option>
                {SEVERITY_OPTIONS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Detailed Complaint Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Provide a detailed description of the complaint including observations, timeline, quantity affected, and any initial findings..."
              rows={6}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {form.description.length} characters
            </p>
          </div>

          {saveError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {saveError}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-700 px-5 py-3.5">
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={!isFormValid || analyzing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Submit & Analyze
              </>
            )}
          </button>
          {hasResult && assessment && !analyzing && (
            <button
              onClick={handleSave}
              disabled={saving || !isFormValid}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          )}
          <button
            onClick={handleClear}
            className="rounded-lg border border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
