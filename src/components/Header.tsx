import { Shield, Activity, Settings, Wifi, Server } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleSettings } from "@/store/settingsSlice";

export default function Header() {
  const dispatch = useAppDispatch();
  const { groqConnected, groqChecking, groqMessage, serverHealthy, serverChecking, serverMessage } =
    useAppSelector((s) => s.settings);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
            <Shield className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white sm:text-lg">
              AIVOA Pharma QMS
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Customer Complaint AI Copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Groq API Status */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5">
            <div className="relative flex items-center">
              {groqChecking ? (
                <Wifi className="h-4 w-4 text-slate-400 animate-pulse" />
              ) : groqConnected ? (
                <Wifi className="h-4 w-4 text-emerald-400" />
              ) : (
                <Wifi className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                  groqChecking
                    ? "bg-slate-400 animate-pulse"
                    : groqConnected
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Groq API
              </p>
              <p
                className={`text-xs font-medium ${
                  groqChecking
                    ? "text-slate-400"
                    : groqConnected
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {groqChecking ? "Checking..." : groqMessage}
              </p>
            </div>
          </div>

          {/* Server Health */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5">
            <div className="relative flex items-center">
              {serverChecking ? (
                <Server className="h-4 w-4 text-slate-400 animate-pulse" />
              ) : serverHealthy ? (
                <Server className="h-4 w-4 text-emerald-400" />
              ) : (
                <Server className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                  serverChecking
                    ? "bg-slate-400 animate-pulse"
                    : serverHealthy
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Server
              </p>
              <p
                className={`text-xs font-medium ${
                  serverChecking
                    ? "text-slate-400"
                    : serverHealthy
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {serverChecking ? "Checking..." : serverMessage}
              </p>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => dispatch(toggleSettings(true))}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-slate-700/50 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
