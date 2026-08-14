import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchComplaintsStart, fetchComplaintsSuccess, fetchComplaintsFailure } from "@/store/complaintsSlice";
import { fetchComplaints } from "@/lib/api";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import ComplaintForm from "@/components/ComplaintForm";
import CopilotPanel from "@/components/CopilotPanel";
import ComplaintsTable from "@/components/ComplaintsTable";

export default function App() {
  const dispatch = useAppDispatch();
  const { settingsOpen } = useAppSelector((s) => s.settings);

  useEffect(() => {
    dispatch(fetchComplaintsStart());
    fetchComplaints()
      .then((data) => dispatch(fetchComplaintsSuccess(data)))
      .catch((err) => dispatch(fetchComplaintsFailure(err instanceof Error ? err.message : "Failed to load complaints")));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative">
        <Header />
        {settingsOpen && <SettingsModal />}

        <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComplaintForm />
            <CopilotPanel />
          </div>

          {/* Recent Complaints Table */}
          <div className="mt-5">
            <ComplaintsTable />
          </div>

          {/* Footer */}
          <footer className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-500">
              AIVOA Pharma QMS - Customer Complaint AI Copilot
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Compliant with ICH Q9, ICH Q10, and 21 CFR Part 211 (cGMP) guidelines
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
