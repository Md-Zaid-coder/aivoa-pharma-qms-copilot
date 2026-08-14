import { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { updateFormField } from "@/store/complaintsSlice";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  ts: string;
};

export default function AiChatAssistant(): JSX.Element {
  const dispatch = useAppDispatch();

  const [dragOver, setDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "m0",
      sender: "bot",
      text: "Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.",
      ts: new Date().toISOString(),
    },
  ]);
  const [autoPopulated, setAutoPopulated] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    let t: number | undefined;
    if (isExtracting) {
      setProgress(0);
      t = window.setInterval(() => {
        setProgress((p) => Math.min(95, p + Math.floor(Math.random() * 12) + 5));
      }, 350);
    }
    return () => {
      if (t) window.clearInterval(t);
    };
  }, [isExtracting]);

  const pushMessage = (sender: Message["sender"], text: string) => {
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sender, text, ts: new Date().toISOString() },
    ]);
  };

  // Basic text parsing heuristics to pull fields out of raw complaint text
  const parseTextForFields = (text: string) => {
    const result: Record<string, string> = {
      product_name: "",
      batch_number: "",
      severity_level: "",
      description: "",
    };

    if (!text) return result;

    // Batch / Lot regex
    const batchMatch = text.match(/(?:BATCH\s*#?[:\-]?|LOT[-\s]*)([A-Z0-9\-]+)\b/i);
    if (batchMatch) result.batch_number = batchMatch[1].trim();

    // Product name: look for lines with 'product' or 'product name'
    const prodMatch = text.match(/(?:Product(?: Name)?|ProductName|Item)[:\s-]{1,}([A-Za-z0-9\-\s\/#]{3,60})/i);
    if (prodMatch) result.product_name = prodMatch[1].trim();

    // Severity: look for explicit words
    const sevMatch = text.match(/\b(critical|major|minor)\b/i);
    if (sevMatch) result.severity_level = sevMatch[1].toLowerCase() === "critical" ? "Critical" : sevMatch[1].toLowerCase() === "major" ? "Major" : "Minor";

    // Description: prefer after 'description' or use first 240 chars
    const descMatch = text.match(/(?:Description|Details|Issue|Summary)\s*[:\-]\s*([\s\S]{20,800})/i);
    if (descMatch) result.description = descMatch[1].trim().slice(0, 1000);
    else result.description = text.trim().slice(0, 800);

    // If product name empty, try to infer from first line capitalized
    if (!result.product_name) {
      const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 3);
      if (firstLine) {
        const p = firstLine.trim().split(/[,:-]/)[0];
        if (p && p.length <= 60) result.product_name = p;
      }
    }

    return result;
  };

  const applyAutoFill = (fields: { product_name?: string; batch_number?: string; severity_level?: string; description?: string }) => {
    if (fields.product_name) dispatch(updateFormField({ field: "product_name", value: fields.product_name }));
    if (fields.batch_number) dispatch(updateFormField({ field: "batch_number", value: fields.batch_number }));
    if (fields.severity_level) dispatch(updateFormField({ field: "severity_level", value: fields.severity_level }));
    if (fields.description) dispatch(updateFormField({ field: "description", value: fields.description }));

    setAutoPopulated(true);
    // show badge in chat and system message
    pushMessage("bot", `✅ Form controls auto-populated from the uploaded content.`);
  };

  const handleExtract = async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;
    setIsExtracting(true);
    pushMessage("user", "Submitted document/text for extraction.");

    try {
      // Simulate extraction duration
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));

      const fields = parseTextForFields(rawText);

      // complete progress
      setProgress(100);
      await new Promise((r) => setTimeout(r, 250));

      applyAutoFill(fields);

      pushMessage("bot", `Extraction complete: ${fields.product_name || "(no product found)"} ${fields.batch_number ? `(Batch ${fields.batch_number})` : ""}`);
    } catch (err) {
      pushMessage("bot", "Extraction failed. Please try again or paste the complaint text.");
    } finally {
      setIsExtracting(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      pushMessage("bot", "File too large — max 10MB.");
      return;
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let text = "";
    if (ext === "txt" || ext === "eml") {
      text = await file.text();
    } else {
      // For PDF/DOCX we cannot reliably extract without libraries — fall back to filename + any plain text
      text = `Filename: ${file.name}\n\n(Unable to fully extract text from ${ext.toUpperCase()} in-browser)\n\n`;
      try {
        // attempt text read for any readable text
        text += await file.text();
      } catch (e) {
        // ignore
      }
    }

    await handleExtract(text);
  };

  const onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setDragOver(false);
    const dt = ev.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      handleFiles(dt.files);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.currentTarget.value = ""; // reset
  };

  const handleSendChat = (text: string) => {
    if (!text.trim()) return;
    pushMessage("user", text.trim());
    // Simple assistant reply
    pushMessage("bot", `I received your question: "${text.trim()}". Please double-check extracted values in the form.`);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-700 pb-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" /> AI Complaint Intake Assistant
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">BETA</span>
          </h3>
          <p className="text-[12px] text-slate-400 mt-1">Conversational Form Extractor & Document Intake</p>
        </div>
        <div className="text-right text-xs text-slate-500">&nbsp;</div>
      </div>

      {/* Top Intake Area */}
      <div className="space-y-3 mb-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative rounded-lg border-2 p-4 text-center transition-colors ${
            dragOver ? "border-blue-400 bg-slate-800/60" : "border-slate-700 bg-slate-800/40"
          }`}>
          <input accept=".pdf,.docx,.txt,.eml" onChange={onFileInputChange} className="absolute inset-0 opacity-0 cursor-pointer" type="file" />
          <Upload className="mx-auto h-6 w-6 text-slate-400" />
          <p className="text-xs text-slate-300 font-medium mt-2">Drag & drop complaint document here or <span className="text-cyan-300 underline">click to browse</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Supported: .pdf, .docx, .txt, .eml — Max 10MB</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-grow h-px bg-slate-700/60" />
          <div className="text-[11px] text-slate-400">OR</div>
          <div className="flex-grow h-px bg-slate-700/60" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaste((s) => !s)}
              className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" /> Paste Complaint Text / Email
            </button>
            <button
              onClick={() => handleExtract(pasteText)}
              disabled={!pasteText.trim() || isExtracting}
              className="ml-2 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> Auto-Fill Form
            </button>
          </div>

          {showPaste && (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the complaint email or report here..."
              className="mt-2 w-full min-h-[100px] resize-y rounded-md border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          )}
        </div>

        {/* Extraction Progress */}
        {isExtracting && (
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Extracting complaint details...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <div className={`inline-flex items-center gap-2 text-[12px] ${m.sender === "bot" ? "text-slate-300" : "text-cyan-200 ml-auto"}`}>
                <span className={`inline-flex p-1 rounded ${m.sender === "bot" ? "bg-slate-800/40" : "bg-cyan-800/30"}`}>
                  {m.sender === "bot" ? <Bot className="h-4 w-4 text-cyan-300" /> : <User className="h-4 w-4 text-cyan-200" />}
                </span>
                <span className="font-medium text-xs">{m.sender === "bot" ? "Bot" : "You"}</span>
                <span className="text-[11px] text-slate-500">• {new Date(m.ts).toLocaleTimeString()}</span>
              </div>

              <div className={`${m.sender === "bot" ? "bg-slate-800 text-slate-200 self-start" : "bg-cyan-900/40 text-cyan-100 self-end"} mt-1 rounded-md px-3 py-2 max-w-[85%] text-sm`}>{m.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Auto-populated badge */}
        {autoPopulated && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-emerald-900/40 px-3 py-1 text-sm font-medium text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Form controls auto-populated
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-3 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value;
                  (e.target as HTMLInputElement).value = "";
                  handleSendChat(v);
                }
              }}
              placeholder="Ask me anything about this complaint..."
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => {
                const el = document.querySelector('input[placeholder="Ask me anything about this complaint..."]') as HTMLInputElement | null;
                if (!el) return;
                const v = el.value;
                el.value = "";
                handleSendChat(v);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">AI responses may contain errors. Please verify information.</p>
        </div>
      </div>
    </div>
  );
}
