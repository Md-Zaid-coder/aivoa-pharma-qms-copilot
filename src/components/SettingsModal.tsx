import { useState, useEffect } from "react";
import { X, Server, Check, AlertCircle, Wifi } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleSettings, setBackendStatus, setBackendChecking } from "@/store/settingsSlice";
import { checkBackendConnection } from "@/lib/api";

export default function SettingsModal() {
  const dispatch = useAppDispatch();
  const { settingsOpen, backendConnected, backendMessage, backendChecking } = useAppSelector(
    (s) => s.settings
  );
  const [testStatus, setTestStatus] = useState<"idle" | "tested">("idle");

  useEffect(() => {
    if (settingsOpen) {
      setTestStatus("idle");
    }
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  const handleTestConnection = async () => {
    dispatch(setBackendChecking(true));
    const result = await checkBackendConnection();
    dispatch(setBackendStatus(result));
    setTestStatus("tested");
    setTimeout(() => setTestStatus("idle"), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => dispatch(toggleSettings(false))}
      />
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Server className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Settings</h2>
              <p className="text-xs text-slate-400">Backend API connection</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(toggleSettings(false))}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI analysis runs on your FastAPI backend server. The Groq API key is stored
              securely on the server — no API keys are needed in the browser.
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              {backendChecking ? (
                <Wifi className="h-4 w-4 text-slate-400 animate-pulse" />
              ) : backendConnected ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {backendChecking ? "Testing connection..." : backendMessage}
              </span>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={backendChecking}
              className="rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Test
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={backendChecking}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testStatus === "tested" ? "Tested!" : "Test Backend Connection"}
            </button>
            <button
              onClick={() => dispatch(toggleSettings(false))}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
