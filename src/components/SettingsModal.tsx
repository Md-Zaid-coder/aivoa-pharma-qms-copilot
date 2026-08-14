import { useState, useEffect } from "react";
import { X, KeyRound, Check, AlertCircle, Eye, EyeOff, Wifi } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleSettings, setGroqApiKey, setGroqStatus, setGroqChecking } from "@/store/settingsSlice";
import { checkGroqConnection } from "@/lib/api";

export default function SettingsModal() {
  const dispatch = useAppDispatch();
  const { settingsOpen, groqApiKey, groqConnected, groqMessage, groqChecking } = useAppSelector(
    (s) => s.settings
  );
  const [localKey, setLocalKey] = useState(groqApiKey);
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    if (settingsOpen) {
      setLocalKey(groqApiKey);
      setSaveStatus("idle");
    }
  }, [settingsOpen, groqApiKey]);

  if (!settingsOpen) return null;

  const handleSave = () => {
    dispatch(setGroqApiKey(localKey));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleTest = async () => {
    if (!localKey) return;
    dispatch(setGroqChecking(true));
    const result = await checkGroqConnection(localKey);
    dispatch(setGroqStatus(result));
  };

  const handleSaveAndTest = async () => {
    dispatch(setGroqApiKey(localKey));
    setSaveStatus("saved");
    if (localKey) {
      dispatch(setGroqChecking(true));
      const result = await checkGroqConnection(localKey);
      dispatch(setGroqStatus(result));
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
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
              <KeyRound className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Settings</h2>
              <p className="text-xs text-slate-400">Configure Groq API connection</p>
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Groq API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Your API key is stored locally in the browser and sent only to Groq's servers for analysis.
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              {groqChecking ? (
                <Wifi className="h-4 w-4 text-slate-400 animate-pulse" />
              ) : groqConnected ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {groqChecking ? "Testing connection..." : groqMessage}
              </span>
            </div>
            <button
              onClick={handleTest}
              disabled={!localKey || groqChecking}
              className="rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Test
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveAndTest}
              disabled={!localKey || groqChecking}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveStatus === "saved" ? "Saved!" : "Save & Test"}
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
