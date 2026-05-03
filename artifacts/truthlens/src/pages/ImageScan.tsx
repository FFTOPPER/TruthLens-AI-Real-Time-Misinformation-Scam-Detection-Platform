import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createWorker } from "tesseract.js";
import {
  FileImage, ImagePlus, ScanLine, CheckCircle2,
  AlertTriangle, X, Eye, RotateCcw, ShieldCheck, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const F = "Inter, system-ui, sans-serif";

/* ── Types ─────────────────────────────────────────────────── */
interface AnalysisResult {
  credibilityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  suspiciousPhrases: string[];
  manipulationBreakdown: {
    fear: number; urgency: number; emotionalTriggers: number; fakeAuthority: number;
  };
}

/* ── Highlighted text ──────────────────────────────────────── */
function HighlightedText({ text, phrases }: { text: string; phrases: string[] }) {
  if (!phrases.length) return <p style={{ fontFamily: F, fontSize: "13px", color: "#c9d1d9", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{text}</p>;
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <p style={{ fontFamily: F, fontSize: "13px", color: "#c9d1d9", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{
            background: "rgba(239,68,68,0.18)", color: "#fca5a5",
            borderRadius: "3px", padding: "0 2px",
          }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

/* ── Risk colour helper ────────────────────────────────────── */
function riskColor(level: string) {
  if (level === "Low")    return { color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.18)"  };
  if (level === "Medium") return { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)"  };
  return                         { color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.2)"   };
}

/* ── Manipulation bar ──────────────────────────────────────── */
function ManipBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
          {label}
        </span>
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 700, color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-border-sub)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function ImageScan() {
  const { toast } = useToast();

  const [imageSrc, setImageSrc]           = useState<string | null>(null);
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [ocrStatus, setOcrStatus]         = useState<"idle" | "running" | "done" | "error">("idle");
  const [ocrProgress, setOcrProgress]     = useState(0);
  const [ocrStage, setOcrStage]           = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult]               = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [activeTab, setActiveTab]         = useState<"raw" | "highlighted">("highlighted");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload a JPG or PNG image.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setImageFile(file);
      setExtractedText("");
      setResult(null);
      setOcrStatus("idle");
      setAnalysisStatus("idle");
      setOcrProgress(0);
    };
    reader.onerror = () => {
      toast({ title: "Could not read file", description: "Try a different image.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  };

  const runOcr = useCallback(async () => {
    if (!imageSrc) return;
    setOcrStatus("running");
    setOcrProgress(0);
    setExtractedText("");
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      worker = await createWorker("eng", 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status) setOcrStage(m.status);
          if (typeof m.progress === "number") setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(imageSrc);
      const clean = data.text.replace(/\f/g, "\n").trim();
      setExtractedText(clean);
      setOcrStatus("done");
    } catch (err) {
      console.error("OCR error:", err);
      setOcrStatus("error");
      toast({ title: "OCR Failed", description: "Could not extract text from image.", variant: "destructive" });
    } finally {
      worker?.terminate().catch(() => {});
    }
  }, [imageSrc, toast]);

  const runAnalysis = useCallback(async () => {
    if (!extractedText.trim()) return;
    setAnalysisStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json() as AnalysisResult;
      setResult(data);
      setAnalysisStatus("done");
    } catch {
      setAnalysisStatus("error");
      toast({ title: "Analysis failed", description: "Something went wrong. Try again.", variant: "destructive" });
    }
  }, [extractedText, toast]);

  const reset = () => {
    setImageSrc(null);
    setImageFile(null);
    setExtractedText("");
    setResult(null);
    setOcrStatus("idle");
    setAnalysisStatus("idle");
    setOcrProgress(0);
  };

  const rc = result ? riskColor(result.riskLevel) : null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <FileImage className="w-4 h-4" style={{ color: "#a855f7" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: F, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              Image Scan
            </h1>
            <p style={{ fontFamily: F, fontSize: "12px", color: "#475569", marginTop: "1px" }}>
              Upload a screenshot · extract text · detect misinformation
            </p>
          </div>
          <span style={{
            fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
            color: "#a855f7", background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.18)", borderRadius: "9999px", padding: "2px 10px",
          }}>
            OCR · AI Analysis
          </span>
        </div>
        <div className="mt-4" style={{ height: "1px", background: "var(--c-border-sub)" }} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Upload + Preview */}
        <div className="space-y-4">

          {/* Upload area */}
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden"
              style={{
                minHeight: "220px",
                border: isDragging ? "2px dashed rgba(168,85,247,0.55)" : "2px dashed rgba(168,85,247,0.2)",
                background: isDragging ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.02)",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <motion.div
                animate={isDragging ? { scale: 1.1, rotate: 6 } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <ImagePlus className="w-6 h-6" style={{ color: "#a855f7" }} />
              </motion.div>

              <div className="text-center px-6">
                <p style={{ fontFamily: F, fontSize: "14px", fontWeight: 500, color: "var(--c-txt1)" }}>
                  {isDragging ? "Drop image here" : "Upload Screenshot or Image"}
                </p>
                <p style={{ fontFamily: F, fontSize: "11px", color: "#374151", marginTop: "5px" }}>
                  Drag & drop or click · JPG, PNG, WebP
                </p>
              </div>

              <motion.div
                className="px-5 py-2 rounded-lg text-xs font-semibold"
                style={{
                  fontFamily: F,
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  color: "#a855f7",
                }}
                whileHover={{ scale: 1.03, background: "rgba(168,85,247,0.16)" }}
              >
                Choose File
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="rounded-xl overflow-hidden relative"
              style={{ background: "#161b27", border: "1px solid var(--c-border)" }}
            >
              {/* Remove button */}
              <button
                onClick={reset}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <X className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
              </button>

              <div className="p-3 pb-0">
                <div className="rounded-lg overflow-hidden" style={{ maxHeight: "200px" }}>
                  <img src={imageSrc} alt="uploaded" className="w-full object-contain" style={{ maxHeight: "200px", objectPosition: "top" }} />
                </div>
              </div>

              <div className="px-3 py-2 flex items-center gap-2">
                <FileImage className="w-3 h-3 flex-shrink-0" style={{ color: "#6b7280" }} />
                <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>
                  {imageFile?.name ?? "image"}
                </span>
              </div>

              {/* OCR button / progress */}
              {ocrStatus === "idle" && (
                <div className="px-3 pb-3">
                  <motion.button
                    onClick={runOcr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold"
                    style={{ fontFamily: F, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}
                    whileHover={{ scale: 1.01, background: "rgba(168,85,247,0.16)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    Extract Text (OCR)
                  </motion.button>
                </div>
              )}

              {ocrStatus === "running" && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#a855f7" }}>
                      {ocrStage ? ocrStage : "Scanning"}…
                    </span>
                    <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 700, color: "#a855f7" }}>
                      {ocrProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.1)" }}>
                    <motion.div
                      animate={{ width: `${ocrProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: "#a855f7", opacity: 0.8 }}
                    />
                  </div>
                </div>
              )}

              {ocrStatus === "done" && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#22c55e" }} />
                  <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#22c55e" }}>
                    Text extracted
                  </span>
                  <button onClick={runOcr} className="ml-auto flex items-center gap-1 opacity-45 hover:opacity-80 transition-opacity">
                    <RotateCcw className="w-2.5 h-2.5" style={{ color: "#6b7280" }} />
                    <span style={{ fontFamily: F, fontSize: "10px", color: "#6b7280" }}>Rescan</span>
                  </button>
                </div>
              )}

              {ocrStatus === "error" && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
                  <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#ef4444" }}>
                    Extraction failed
                  </span>
                  <button onClick={runOcr} className="ml-auto flex items-center gap-1 opacity-60 hover:opacity-90 transition-opacity">
                    <RotateCcw className="w-2.5 h-2.5" style={{ color: "#f97316" }} />
                    <span style={{ fontFamily: F, fontSize: "10px", color: "#f97316" }}>Retry</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Extracted text panel */}
          <AnimatePresence>
            {extractedText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl overflow-hidden"
                style={{ background: "#161b27", border: "1px solid var(--c-border)" }}
              >
                {/* Header with tabs */}
                <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
                  style={{ borderBottom: "1px solid var(--c-border-sub)" }}>
                  <div className="flex items-center gap-2 flex-1">
                    <Eye className="w-3 h-3" style={{ color: "#3b82f6" }} />
                    <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", color: "#3b82f6", textTransform: "uppercase" as const }}>
                      Extracted Text
                    </span>
                    <span style={{
                      fontFamily: F, fontSize: "10px", fontWeight: 500,
                      color: "#a855f7", background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: "9999px", padding: "1px 7px",
                    }}>
                      From image
                    </span>
                  </div>

                  {result && (
                    <div className="flex gap-1">
                      {(["raw", "highlighted"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            fontFamily: F, fontSize: "10px", fontWeight: 500,
                            padding: "3px 9px", borderRadius: "6px", cursor: "pointer",
                            background: activeTab === tab ? "rgba(59,130,246,0.12)" : "transparent",
                            border: activeTab === tab ? "1px solid rgba(59,130,246,0.3)" : "1px solid var(--c-border)",
                            color: activeTab === tab ? "#3b82f6" : "#6b7280",
                            transition: "all 0.15s",
                          }}
                        >
                          {tab === "raw" ? "Raw" : "Highlighted"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {(!result || activeTab === "raw") && (
                    <textarea
                      value={extractedText}
                      onChange={e => setExtractedText(e.target.value)}
                      rows={8}
                      className="w-full resize-y focus:outline-none"
                      style={{
                        background: "transparent",
                        color: "#c9d1d9",
                        fontFamily: F,
                        fontSize: "13px",
                        lineHeight: "1.7",
                        border: "none",
                      }}
                      placeholder="Extracted text will appear here. You can edit it before analysis."
                    />
                  )}

                  {result && activeTab === "highlighted" && (
                    <HighlightedText text={extractedText} phrases={result.suspiciousPhrases} />
                  )}
                </div>

                {result && activeTab === "highlighted" && result.suspiciousPhrases.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {result.suspiciousPhrases.map((p, i) => (
                      <span key={i} style={{
                        fontFamily: F, fontSize: "10px", fontWeight: 500,
                        color: "#fca5a5", background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)",
                        borderRadius: "4px", padding: "2px 7px",
                      }}>
                        ⚑ {p}
                      </span>
                    ))}
                  </div>
                )}

                {analysisStatus !== "done" && (
                  <div className="px-4 pb-4">
                    <motion.button
                      onClick={runAnalysis}
                      disabled={analysisStatus === "loading" || !extractedText.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold relative overflow-hidden"
                      style={{
                        fontFamily: F, fontSize: "13px",
                        background: analysisStatus === "loading" ? "rgba(59,130,246,0.07)" : "rgba(59,130,246,0.12)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "#3b82f6",
                        opacity: !extractedText.trim() ? 0.4 : 1,
                        cursor: !extractedText.trim() || analysisStatus === "loading" ? "default" : "pointer",
                      }}
                      whileHover={extractedText.trim() && analysisStatus !== "loading" ? { scale: 1.01 } : {}}
                      whileTap={extractedText.trim() && analysisStatus !== "loading" ? { scale: 0.99 } : {}}
                    >
                      {analysisStatus === "loading" && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.12), transparent)" }}
                        />
                      )}
                      {analysisStatus === "loading" ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap className="w-3.5 h-3.5" />
                          </motion.div>
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          Run AI Analysis
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Analysis results */}
        <div className="space-y-4">
          <AnimatePresence>
            {!result && analysisStatus === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl flex flex-col items-center justify-center gap-3 text-center"
                style={{ minHeight: "220px", background: "#161b27", border: "1px solid var(--c-border)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.14)" }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: "rgba(59,130,246,0.4)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: F, fontSize: "14px", fontWeight: 500, color: "var(--c-txt3)" }}>
                    Results appear here
                  </p>
                  <p style={{ fontFamily: F, fontSize: "11px", color: "#374151", marginTop: "5px" }}>
                    Upload image → Extract text → Analyse
                  </p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                {/* Score card */}
                <div className="rounded-xl overflow-hidden"
                  style={{ background: "#161b27", border: `1px solid ${rc!.border}` }}>
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${rc!.border}`, background: rc!.bg }}>
                    <div className="flex items-center gap-2">
                      {result.riskLevel === "Low"
                        ? <ShieldCheck className="w-4 h-4" style={{ color: rc!.color }} />
                        : <AlertTriangle className="w-4 h-4" style={{ color: rc!.color }} />}
                      <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", color: rc!.color, textTransform: "uppercase" as const }}>
                        Credibility Analysis
                      </span>
                    </div>
                    <span style={{
                      fontFamily: F, fontSize: "10px", fontWeight: 600,
                      color: "#a855f7", background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.18)", borderRadius: "9999px", padding: "1px 8px",
                    }}>
                      From Image
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div style={{ fontFamily: F, fontSize: "38px", fontWeight: 800, color: rc!.color, lineHeight: 1 }}>
                          {result.credibilityScore}
                        </div>
                        <div style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#374151", marginTop: "3px" }}>
                          / 100
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--c-border-sub)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.credibilityScore}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: rc!.color, opacity: 0.85 }}
                          />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                          style={{ fontFamily: F, color: rc!.color, background: rc!.bg, border: `1px solid ${rc!.border}` }}>
                          {result.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>

                    <p style={{ fontFamily: F, color: "#c9d1d9", fontSize: "13px", lineHeight: "1.65" }}>
                      {result.explanation}
                    </p>
                  </div>
                </div>

                {/* Manipulation breakdown */}
                <div className="rounded-xl overflow-hidden"
                  style={{ background: "#161b27", border: "1px solid var(--c-border)" }}>
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ borderBottom: "1px solid var(--c-border-sub)" }}>
                    <Zap className="w-3 h-3" style={{ color: "#6b7280" }} />
                    <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" as const }}>
                      Manipulation Signals
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <ManipBar label="Fear"           value={result.manipulationBreakdown.fear}              color="#ef4444" />
                    <ManipBar label="Urgency"         value={result.manipulationBreakdown.urgency}           color="#f97316" />
                    <ManipBar label="Emotional"       value={result.manipulationBreakdown.emotionalTriggers} color="#eab308" />
                    <ManipBar label="Fake Authority"  value={result.manipulationBreakdown.fakeAuthority}     color="#a855f7" />
                  </div>
                </div>

                {/* Suspicious phrases */}
                {result.suspiciousPhrases.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "#161b27", border: "1px solid rgba(239,68,68,0.18)" }}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2"
                      style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                      <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444", opacity: 0.8 }} />
                      <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" as const }}>
                        Flagged Phrases ({result.suspiciousPhrases.length})
                      </span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                      {result.suspiciousPhrases.map((p, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.22 + i * 0.05 }}
                          style={{
                            fontFamily: F, fontSize: "11px", fontWeight: 500,
                            color: "#fca5a5", background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)",
                            borderRadius: "5px", padding: "3px 8px",
                          }}
                        >
                          ⚑ {p}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Re-analyse button */}
                <motion.button
                  onClick={() => { setAnalysisStatus("idle"); setResult(null); setActiveTab("raw"); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
                  style={{
                    fontFamily: F, fontWeight: 500,
                    background: "transparent",
                    border: "1px solid var(--c-border)",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                  whileHover={{ borderColor: "var(--c-txt4)", color: "#6b7280" }}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Edit text &amp; re-analyse
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
