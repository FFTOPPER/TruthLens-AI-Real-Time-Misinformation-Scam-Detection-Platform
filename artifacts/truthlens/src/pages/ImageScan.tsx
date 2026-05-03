import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createWorker } from "tesseract.js";
import {
  ImagePlus, ScanLine, AlertTriangle, ShieldCheck,
  FileImage, X, Zap, Eye, RotateCcw, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────────────────── */
interface AnalysisResult {
  credibilityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  suspiciousPhrases: string[];
  manipulationBreakdown: {
    fear: number;
    urgency: number;
    emotionalTriggers: number;
    fakeAuthority: number;
  };
}

/* ── Highlight suspicious phrases in text ──────────────────── */
function HighlightedText({
  text,
  phrases,
}: {
  text: string;
  phrases: string[];
}) {
  if (!phrases.length) {
    return (
      <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {text}
      </p>
    );
  }

  // Build a regex that matches any suspicious phrase (case-insensitive)
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {parts.map((part, i) => {
        const isMatch = phrases.some(p => p.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark
            key={i}
            style={{
              background: "rgba(239,68,68,0.22)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "3px",
              padding: "1px 3px",
              fontWeight: 600,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

/* ── Risk colour helper ────────────────────────────────────── */
function riskColor(level: string) {
  if (level === "Low") return { color: "#00ff88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)" };
  if (level === "Medium") return { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" };
}

/* ── Manipulation bar ──────────────────────────────────────── */
function ManipBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] tracking-[0.14em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}>
          {label}
        </span>
        <span className="text-[9px] font-bold" style={{ fontFamily: "'Space Mono', monospace", color }}>
          {value}%
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
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

  /* ── Load image ── */
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload a JPG or PNG image.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setImageFile(file);
    setExtractedText("");
    setResult(null);
    setOcrStatus("idle");
    setAnalysisStatus("idle");
    setOcrProgress(0);
  }, [toast]);

  /* Clean up object URL */
  useEffect(() => {
    return () => { if (imageSrc) URL.revokeObjectURL(imageSrc); };
  }, [imageSrc]);

  /* ── Drag & drop ── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  };

  /* ── Run OCR ── */
  const runOcr = useCallback(async () => {
    if (!imageFile) return;
    setOcrStatus("running");
    setOcrProgress(0);
    setExtractedText("");
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status) setOcrStage(m.status);
          if (typeof m.progress === "number") setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(imageFile);
      await worker.terminate();
      const clean = data.text.replace(/\f/g, "\n").trim();
      setExtractedText(clean);
      setOcrStatus("done");
    } catch {
      setOcrStatus("error");
      toast({ title: "OCR Failed", description: "Could not extract text from image.", variant: "destructive" });
    }
  }, [imageFile, toast]);

  /* ── Run analysis ── */
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

  /* ── Reset ── */
  const reset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
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
    <div className="min-h-screen px-4 py-8 lg:px-8 lg:py-10 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <FileImage className="w-4 h-4" style={{ color: "#a855f7" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
            IMAGE SCAN
          </h1>
          <span className="text-[8px] tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(168,85,247,0.6)", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
            OCR · AI ANALYSIS
          </span>
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em" }}>
          UPLOAD A SCREENSHOT · EXTRACT TEXT · DETECT MISINFORMATION
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT: Upload + Preview ── */}
        <div className="space-y-4">

          {/* Upload area */}
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden"
              style={{
                minHeight: "240px",
                border: isDragging ? "2px dashed rgba(168,85,247,0.6)" : "2px dashed rgba(168,85,247,0.2)",
                background: isDragging ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.02)",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              {/* Animated corner accents */}
              {["tl", "tr", "bl", "br"].map((pos) => (
                <div key={pos} className="absolute w-4 h-4" style={{
                  top: pos.startsWith("t") ? 8 : "auto", bottom: pos.startsWith("b") ? 8 : "auto",
                  left: pos.endsWith("l") ? 8 : "auto", right: pos.endsWith("r") ? 8 : "auto",
                  borderTop: pos.startsWith("t") ? "1.5px solid rgba(168,85,247,0.4)" : "none",
                  borderBottom: pos.startsWith("b") ? "1.5px solid rgba(168,85,247,0.4)" : "none",
                  borderLeft: pos.endsWith("l") ? "1.5px solid rgba(168,85,247,0.4)" : "none",
                  borderRight: pos.endsWith("r") ? "1.5px solid rgba(168,85,247,0.4)" : "none",
                }} />
              ))}

              <motion.div
                animate={isDragging ? { scale: 1.12, rotate: 8 } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}
              >
                <ImagePlus className="w-6 h-6" style={{ color: "#a855f7" }} />
              </motion.div>

              <div className="text-center px-6">
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em" }}>
                  {isDragging ? "Drop image here" : "Upload Screenshot or Image"}
                </p>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", marginTop: "6px" }}>
                  DRAG & DROP OR CLICK · JPG, PNG, WEBP
                </p>
              </div>

              <motion.div
                className="px-5 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "#a855f7",
                }}
                whileHover={{ scale: 1.04, background: "rgba(168,85,247,0.16)" }}
              >
                CHOOSE FILE
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden relative"
              style={{ border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.03)" }}
            >
              {/* Remove button */}
              <button
                onClick={reset}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <X className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
              </button>

              {/* Image preview */}
              <div className="p-3 pb-0">
                <div className="rounded-lg overflow-hidden" style={{ maxHeight: "200px" }}>
                  <img src={imageSrc} alt="uploaded" className="w-full object-contain" style={{ maxHeight: "200px", objectPosition: "top" }} />
                </div>
              </div>

              {/* File name */}
              <div className="px-3 py-2 flex items-center gap-2">
                <FileImage className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                  {imageFile?.name ?? "image"}
                </span>
              </div>

              {/* OCR button / progress */}
              {ocrStatus === "idle" && (
                <div className="px-3 pb-3">
                  <motion.button
                    onClick={runOcr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] tracking-[0.15em] font-semibold"
                    style={{ fontFamily: "'Orbitron', monospace", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}
                    whileHover={{ scale: 1.02, background: "rgba(168,85,247,0.18)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    EXTRACT TEXT (OCR)
                  </motion.button>
                </div>
              )}

              {ocrStatus === "running" && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "rgba(168,85,247,0.7)", letterSpacing: "0.16em" }}>
                      {ocrStage ? ocrStage.toUpperCase() : "SCANNING"}…
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#a855f7", fontWeight: 700 }}>
                      {ocrProgress}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.1)" }}>
                    <motion.div
                      animate={{ width: `${ocrProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #a855f7, #06b6d4)", boxShadow: "0 0 8px rgba(168,85,247,0.5)" }}
                    />
                  </div>
                </div>
              )}

              {ocrStatus === "done" && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#00ff88" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#00ff88", letterSpacing: "0.14em" }}>
                    TEXT EXTRACTED
                  </span>
                  <button onClick={runOcr} className="ml-auto flex items-center gap-1 opacity-40 hover:opacity-70 transition-opacity">
                    <RotateCcw className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.5)" }}>RESCAN</span>
                  </button>
                </div>
              )}

              {ocrStatus === "error" && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#ef4444", letterSpacing: "0.14em" }}>
                    EXTRACTION FAILED
                  </span>
                  <button onClick={runOcr} className="ml-auto flex items-center gap-1 opacity-60 hover:opacity-90 transition-opacity">
                    <RotateCcw className="w-2.5 h-2.5" style={{ color: "#f97316" }} />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7px", color: "#f97316" }}>RETRY</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Extracted text panel ── */}
          <AnimatePresence>
            {extractedText && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(0,229,255,0.14)", background: "rgba(0,229,255,0.02)" }}
              >
                {/* Header with tabs */}
                <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
                  style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,229,255,0.03)" }}>
                  <div className="flex items-center gap-2 flex-1">
                    <Eye className="w-3 h-3" style={{ color: "#00e5ff" }} />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#00e5ff", letterSpacing: "0.18em" }}>
                      EXTRACTED TEXT
                    </span>
                    {/* Detected from image badge */}
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.12em",
                      color: "#a855f7", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)",
                      borderRadius: "9999px", padding: "1px 7px",
                    }}>
                      DETECTED FROM IMAGE
                    </span>
                  </div>

                  {/* Tabs */}
                  {result && (
                    <div className="flex gap-1">
                      {(["raw", "highlighted"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.12em",
                            padding: "3px 8px", borderRadius: "6px", cursor: "pointer",
                            background: activeTab === tab ? "rgba(239,68,68,0.14)" : "transparent",
                            border: activeTab === tab ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.07)",
                            color: activeTab === tab ? "#fca5a5" : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {tab === "raw" ? "RAW" : "HIGHLIGHTED"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {/* Editable raw text */}
                  {(!result || activeTab === "raw") && (
                    <textarea
                      value={extractedText}
                      onChange={e => setExtractedText(e.target.value)}
                      rows={8}
                      className="w-full resize-y focus:outline-none"
                      style={{
                        background: "transparent",
                        color: "rgba(255,255,255,0.75)",
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "13px",
                        lineHeight: "1.7",
                        border: "none",
                        letterSpacing: "0.02em",
                      }}
                      placeholder="Extracted text will appear here. You can edit it before analysis."
                    />
                  )}

                  {/* Highlighted text */}
                  {result && activeTab === "highlighted" && (
                    <HighlightedText text={extractedText} phrases={result.suspiciousPhrases} />
                  )}
                </div>

                {/* Suspicious phrases legend */}
                {result && activeTab === "highlighted" && result.suspiciousPhrases.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {result.suspiciousPhrases.map((p, i) => (
                      <span key={i} style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.1em",
                        color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "4px", padding: "2px 6px",
                      }}>
                        ⚑ {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Analyse button */}
                {analysisStatus !== "done" && (
                  <div className="px-4 pb-4">
                    <motion.button
                      onClick={runAnalysis}
                      disabled={analysisStatus === "loading" || !extractedText.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] tracking-[0.2em] font-semibold relative overflow-hidden"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        background: analysisStatus === "loading" ? "rgba(0,229,255,0.06)" : "rgba(0,229,255,0.1)",
                        border: "1px solid rgba(0,229,255,0.3)",
                        color: "#00e5ff",
                        opacity: !extractedText.trim() ? 0.4 : 1,
                        cursor: !extractedText.trim() || analysisStatus === "loading" ? "default" : "pointer",
                      }}
                      whileHover={extractedText.trim() && analysisStatus !== "loading" ? { scale: 1.01, background: "rgba(0,229,255,0.15)" } : {}}
                      whileTap={extractedText.trim() && analysisStatus !== "loading" ? { scale: 0.99 } : {}}
                    >
                      {analysisStatus === "loading" && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.12), transparent)" }}
                        />
                      )}
                      {analysisStatus === "loading" ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap className="w-3.5 h-3.5" />
                          </motion.div>
                          ANALYZING…
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          RUN AI ANALYSIS
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Analysis results ── */}
        <div className="space-y-4">
          <AnimatePresence>
            {!result && analysisStatus === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl flex flex-col items-center justify-center gap-3 text-center"
                style={{ minHeight: "240px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.12)" }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: "rgba(0,229,255,0.4)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
                    Results appear here
                  </p>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.14em", marginTop: "6px" }}>
                    UPLOAD AN IMAGE → EXTRACT TEXT → ANALYSE
                  </p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Score card */}
                <div className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${rc!.border}`, background: rc!.bg }}>
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${rc!.border}` }}>
                    <div className="flex items-center gap-2">
                      {result.riskLevel === "Low"
                        ? <ShieldCheck className="w-4 h-4" style={{ color: rc!.color }} />
                        : <AlertTriangle className="w-4 h-4" style={{ color: rc!.color }} />}
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.18em", color: rc!.color }}>
                        CREDIBILITY ANALYSIS
                      </span>
                    </div>
                    {/* Image source badge */}
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.1em",
                      color: "rgba(168,85,247,0.7)", background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.2)", borderRadius: "9999px", padding: "1px 7px",
                    }}>
                      FROM IMAGE
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Score + risk */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "36px", fontWeight: 900, color: rc!.color, lineHeight: 1, textShadow: `0 0 20px ${rc!.color}66` }}>
                          {result.credibilityScore}
                        </div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", marginTop: "4px" }}>
                          / 100
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.credibilityScore}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: rc!.color, boxShadow: `0 0 8px ${rc!.color}66` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{ fontFamily: "'Orbitron', monospace", color: rc!.color, background: `${rc!.color}18`, border: `1px solid ${rc!.color}33` }}>
                          {result.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p style={{ color: "rgba(255,255,255,0.72)", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", lineHeight: "1.65" }}>
                      {result.explanation}
                    </p>
                  </div>
                </div>

                {/* Manipulation breakdown */}
                <div className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.03)" }}>
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
                    <Zap className="w-3 h-3" style={{ color: "#a855f7" }} />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#a855f7" }}>
                      MANIPULATION SIGNALS
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <ManipBar label="FEAR"             value={result.manipulationBreakdown.fear}             color="#ef4444" />
                    <ManipBar label="URGENCY"          value={result.manipulationBreakdown.urgency}          color="#f97316" />
                    <ManipBar label="EMOTIONAL"        value={result.manipulationBreakdown.emotionalTriggers} color="#eab308" />
                    <ManipBar label="FAKE AUTHORITY"   value={result.manipulationBreakdown.fakeAuthority}    color="#a855f7" />
                  </div>
                </div>

                {/* Suspicious phrases */}
                {result.suspiciousPhrases.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.03)" }}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2"
                      style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                      <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#ef4444" }}>
                        FLAGGED PHRASES ({result.suspiciousPhrases.length})
                      </span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                      {result.suspiciousPhrases.map((p, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 + i * 0.05 }}
                          style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.08em",
                            color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
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
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] tracking-[0.15em]"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.28)",
                    cursor: "pointer",
                  }}
                  whileHover={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)" }}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  EDIT TEXT & RE-ANALYSE
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
