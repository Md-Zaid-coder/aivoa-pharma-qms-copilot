import { Table, Loader2, AlertCircle, ShieldAlert, Clock } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import type { Complaint } from "@/types";

function getRiskBadge(risk: string | null) {
  if (!risk) return { bg: "bg-slate-700/30", text: "text-slate-400", border: "border-slate-600/40" };
  switch (risk) {
    case "Critical":
      return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/40" };
    case "Major":
      return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/40" };
    case "Minor":
      return { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/40" };
    default:
      return { bg: "bg-slate-700/30", text: "text-slate-400", border: "border-slate-600/40" };
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string | null, maxLen: number = 50): string {
  if (!str) return "—";
  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
}

export default function ComplaintsTable() {
  const { complaints, loading, error } = useAppSelector((s) => s.complaints);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/30">
            <Table className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Recent Complaints</h2>
            <p className="text-xs text-slate-400">
              {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} in database
            </p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-rose-400">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        ) : complaints.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Table className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No complaints logged yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/30">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product / API
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Batch
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Site
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Source
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Severity
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Risk
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Score
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Summary
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c: Complaint) => {
                const riskBadge = getRiskBadge(c.risk_level);
                return (
                  <tr
                    key={c.id}
                    className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {truncate(c.product_name, 30)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {c.batch_number}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {truncate(c.manufacturing_site, 25)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.complaint_source}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.severity_level}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        {c.risk_level || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-300">
                      {c.completeness_score !== null ? `${c.completeness_score}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {truncate(c.complaint_summary, 40)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(c.created_at)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
