import { Brain, ShieldAlert, ClipboardCheck, Search, Wrench, FileCheck, Gauge, Loader2, AlertCircle, Info } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import type { RiskLevel } from "@/types";

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; text: string; label: string }> = {
  Critical: {
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/40",
    text: "text-rose-400",
    label: "Critical",
  },
  Major: {
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    text: "text-orange-400",
    label: "Major",
  },
  Minor: {
    color: "text-yellow-300",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
    label: "Minor",
  },
  Pending: {
    color: "text-slate-400",
    bg: "bg-slate-700/30",
    border: "border-slate-600/40",
    text: "text-slate-400",
    label: "Pending",
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-rose-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-rose-500";
}

export default function CopilotPanel() {
  const { assessment, analyzing, error, hasResult } = useAppSelector((s) => s.copilot);

  const riskLevel: RiskLevel = assessment?.risk_level || "Pending";
  const riskCfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.Pending;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Copilot Risk Assessment</h2>
            <p className="text-xs text-slate-400">LangGraph + Groq (gemma2-9b-it) analysis</p>
          </div>
        </div>
        {analyzing && (
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Loading State */}
        {analyzing && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-700" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-cyan-400" />
              <Brain className="absolute inset-0 m-auto h-7 w-7 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">AI analyzing complaint...</p>
              <p className="mt-1 text-xs text-slate-500">Running LangGraph workflow nodes</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !analyzing && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <AlertCircle className="h-12 w-12 text-rose-400" />
            <p className="text-sm font-medium text-rose-300">Analysis Error</p>
            <p className="max-w-sm text-center text-xs text-slate-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!hasResult && !analyzing && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
              <Brain className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No analysis yet</p>
            <p className="max-w-xs text-center text-xs text-slate-500">
              Fill out the complaint form and click "Submit & Analyze" to generate an AI risk assessment.
            </p>
          </div>
        )}

        {/* Results */}
        {hasResult && assessment && !analyzing && (
          <div className="space-y-4">
            {/* Fallback notice */}
            {assessment._fallback && assessment._message && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300">{assessment._message}</p>
              </div>
            )}
            
            {/* Risk Badge & Completeness Score */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg border ${riskCfg.border} ${riskCfg.bg} px-4 py-3`}>
                <div className="mb-1 flex items-center gap-1.5">
                  <ShieldAlert className={`h-3.5 w-3.5 ${riskCfg.text}`} />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Risk Level
                  </p>
                </div>
                <p className={`text-xl font-bold ${riskCfg.text}`}>{riskCfg.label}</p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Completeness
                  </p>
                </div>
                <p className={`text-xl font-bold ${getScoreColor(assessment.completeness_score)}`}>
                  {assessment.completeness_score}%
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(assessment.completeness_score)}`}
                    style={{ width: `${assessment.completeness_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  AI Complaint Summary
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                {assessment.complaint_summary}
              </p>
            </div>

            {/* Root Cause Analysis */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-orange-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Probable Root Cause Analysis (RCA)
                </h3>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {assessment.root_cause}
              </p>
            </div>

            {/* CAPA */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Recommended CAPA
                </h3>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {assessment.capa_recommendation}
              </p>
            </div>

            {/* Audit Notes */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  AI Risk Classification & Audit Notes
                </h3>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {assessment.audit_notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
