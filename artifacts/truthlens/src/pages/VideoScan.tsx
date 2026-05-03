import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Link2, Upload, X, AlertTriangle, ShieldCheck,
  ScanLine, ExternalLink, RefreshCw, Info, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const F = "Inter, system-ui, sans-serif";

/* ── Types ─────────────────────────────────────────────────── */
interface VideoAnalysis {
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: string;
  explanation: string;
  deepfakeRisk: number;
  misinformationRisk: number;
  sensationalismScore: number;
  redFlags: string[];
  credibilitySignals: string[];
  platform: string;
  videoTitle: string;
  thumbnailUrl?: string;
}

/* ── Risk palette ──────────────────────────────────────────── */
const RISK = {
  Low:    { color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.18)",  label: "Low Risk",    icon: "🛡️" },
  Medium: { color: "#f97316", bg: "rgba(249,115,22,0.07)",  border: "rgba(249,115,22,0.18)", label: "Medium Risk", icon: "⚡" },
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.18)",  label: "High Risk",   icon: "☠️" },
};

/* ── SVG arc gauge ─────────────────────────────────────────── */
function RiskGauge({ score, riskLevel }: { score: number; riskLevel: keyof typeof RISK }) {
  const r = 52, cx = 68, cy = 68;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * Math.min(score, 100) / 100;
  const col  = RISK[riskLevel].color;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 136, height: 136 }}>
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="7"
          strokeDasharray={`0 ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          animate={{ strokeDasharray: `${fill} ${circ}` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 220 }}
          style={{ fontFamily: F, fontSize: "30px", fontWeight: 800, color: col, lineHeight: 1 }}
        >
          {score}
        </motion.span>
        <span style={{ fontFamily: F, fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", color: "#6b7280", marginTop: "3px" }}>
          RISK SCORE
        </span>
      </div>
    </div>
  );
}

/* ── Sub-score bar ─────────────────────────────────────────── */
function SubScore({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: "11px" }}>{emoji}</span>
          <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 700, color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.55 }}
          style={{ background: color, opacity: 0.85 }} />
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */
function detectPlatform(url: string) {
  if (/youtube\.com|youtu\.be/i.test(url))   return "YouTube";
  if (/rumble\.com/i.test(url))              return "Rumble";
  if (/tiktok\.com/i.test(url))             return "TikTok";
  if (/twitter\.com|x\.com/i.test(url))     return "X (Twitter)";
  if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
  if (/instagram\.com/i.test(url))          return "Instagram";
  if (/bitchute\.com/i.test(url))           return "BitChute";
  if (/vimeo\.com/i.test(url))              return "Vimeo";
  if (url.startsWith("http"))               return "External Link";
  return null;
}

const PLATFORM_COLOR: Record<string, string> = {
  YouTube:      "#ff3b30",
  TikTok:       "#ff0050",
  Rumble:       "#85c742",
  BitChute:     "#f97316",
  "X (Twitter)":"#e2e8f0",
  Facebook:     "#1877f2",
  Instagram:    "#e879f9",
  Vimeo:        "#1ab7ea",
};

const SAMPLES = [
  { label: "🎬 YouTube News",  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "⚠️ Rumble Clip",  url: "https://rumble.com/v-example-conspiracy-video"   },
  { label: "🔬 TikTok Health", url: "https://www.tiktok.com/@example/video/1234567890" },
];

/* ── Page ──────────────────────────────────────────────────── */
export default function VideoScan() {
  const { toast } = useToast();
  const [mode, setMode]             = useState<"url" | "upload">("url");
  const [url, setUrl]               = useState("");
  const [file, setFile]             = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]         = useState<VideoAnalysis | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const canAnalyze = mode === "url" ? url.trim().length > 0 : file !== null;
  const platform   = mode === "url" && url ? detectPlatform(url) : null;
  const platColor  = platform ? (PLATFORM_COLOR[platform] ?? "#3b82f6") : "#3b82f6";

  const analyze = useCallback(async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const body = mode === "url"
        ? { url: url.trim() }
        : { fileName: file!.name, fileType: file!.type };
      const res = await fetch("/api/analysis/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      setResult(await res.json() as VideoAnalysis);
    } catch {
      toast({ title: "Analysis Failed", description: "Could not analyze the video. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [canAnalyze, mode, url, file, toast]);

  const reset = () => { setResult(null); setUrl(""); setFile(null); };

  return (
    <div className="min-h-screen max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Film className="w-4 h-4" style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: F, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              Video Scan
            </h1>
            <p style={{ fontFamily: F, fontSize: "12px", color: "#475569", marginTop: "1px" }}>
              Deepfake detection &amp; misinformation analysis
            </p>
          </div>
          <span style={{
            fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
            color: "#3b82f6", background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.18)", borderRadius: "9999px", padding: "2px 10px",
          }}>
            Deepfake · Misinfo AI
          </span>
        </div>
        <div className="mt-4" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </motion.div>

      {/* Input card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Mode tabs */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {([ ["url", Link2, "Paste URL"], ["upload", Upload, "Upload File"] ] as const).map(([m, Icon, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3"
              style={{
                fontFamily: F, fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "none",
                color: mode === m ? "#3b82f6" : "#6b7280",
                background: mode === m ? "rgba(59,130,246,0.07)" : "transparent",
                borderBottom: mode === m ? "2px solid #3b82f6" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              <Icon className="w-3.5 h-3.5" />
              {lbl}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {mode === "url" ? (
            <>
              {/* URL input */}
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "rgba(59,130,246,0.4)" }} />
                <input
                  type="url" value={url} onChange={e => { setUrl(e.target.value); setResult(null); }}
                  placeholder="https://youtube.com/watch?v=...  or any video URL"
                  onKeyDown={e => e.key === "Enter" && analyze()}
                  className="w-full pl-10 pr-10 py-3 rounded-lg outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#e2e8f0", fontFamily: F, fontSize: "13px", caretColor: "#3b82f6",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
                {url && (
                  <button onClick={() => { setUrl(""); setResult(null); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                  </button>
                )}
              </div>

              {/* Platform pill */}
              <AnimatePresence>
                {platform && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151" }}>
                      Platform detected:
                    </span>
                    <span style={{
                      fontFamily: F, fontSize: "11px", fontWeight: 600,
                      color: platColor, background: `${platColor}14`,
                      border: `1px solid ${platColor}28`, borderRadius: "6px", padding: "2px 8px",
                    }}>
                      {platform}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sample quick-load */}
              {!url && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151" }}>
                    Try a sample:
                  </span>
                  {SAMPLES.map(s => (
                    <button key={s.label} onClick={() => setUrl(s.url)}
                      className="px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        fontFamily: F, fontWeight: 500,
                        background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.14)",
                        color: "rgba(59,130,246,0.65)", cursor: "pointer",
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Upload zone */
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault(); setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f?.type.startsWith("video/")) { setFile(f); setResult(null); }
                else toast({ title: "Invalid file", description: "Please drop a video file.", variant: "destructive" });
              }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer"
              style={{
                height: "130px",
                border: `2px dashed ${isDragging ? "#3b82f6" : file ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.2)"}`,
                background: isDragging ? "rgba(59,130,246,0.06)" : file ? "rgba(34,197,94,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }} />
              {file ? (
                <>
                  <Film className="w-7 h-7" style={{ color: "#22c55e" }} />
                  <div className="text-center">
                    <p style={{ fontFamily: F, fontSize: "13px", fontWeight: 600, color: "#22c55e" }}>
                      {file.name}
                    </p>
                    <p style={{ fontFamily: F, fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type || "video"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" style={{ color: "rgba(59,130,246,0.4)" }} />
                  <p style={{ fontFamily: F, fontSize: "12px", fontWeight: 500, color: "#6b7280", textAlign: "center" }}>
                    Drop video file here<br />
                    <span style={{ color: "#374151", fontSize: "11px" }}>or click to browse</span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Analyze button */}
          <motion.button
            onClick={analyze}
            disabled={isAnalyzing || !canAnalyze}
            className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2"
            style={{
              fontFamily: F, fontSize: "13px", fontWeight: 600,
              border: `1px solid ${canAnalyze && !isAnalyzing ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.12)"}`,
              background: canAnalyze && !isAnalyzing ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.04)",
              color: canAnalyze && !isAnalyzing ? "#3b82f6" : "rgba(59,130,246,0.3)",
              cursor: canAnalyze && !isAnalyzing ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
            whileHover={canAnalyze && !isAnalyzing ? { scale: 1.01 } : {}}
            whileTap={canAnalyze && !isAnalyzing ? { scale: 0.98 } : {}}
          >
            {isAnalyzing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <ScanLine className="w-4 h-4" />
                </motion.div>
                Analyzing video…
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                Analyze Video
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Loading shimmer */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 space-y-3"
            style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {["Scanning URL", "Fetching Metadata", "AI Processing", "Computing Risk Score"].map((step, i) => (
                <motion.div key={step} className="flex items-center gap-1.5"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.38 }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: "#3b82f6" }} />
                  <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="h-px w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #3b82f6, transparent)", width: "28%" }}
                animate={{ x: ["-28%", "400%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isAnalyzing && (() => {
          const sev = RISK[result.riskLevel as keyof typeof RISK] ?? RISK.Medium;
          return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4">

              {/* Verdict banner */}
              <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ border: `1px solid ${sev.border}`, background: sev.bg }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "20px" }}>{sev.icon}</span>
                  <div>
                    <div style={{ fontFamily: F, fontSize: "12px", fontWeight: 700, color: sev.color, letterSpacing: "0.05em" }}>
                      {sev.label.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: F, fontSize: "13px", fontWeight: 400, color: "#c9d1d9", marginTop: "3px", lineHeight: 1.45 }}>
                      {result.verdict}
                    </div>
                  </div>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#6b7280", cursor: "pointer" }}>
                  <RefreshCw className="w-3 h-3" />
                  New Scan
                </button>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Gauge column */}
                <div className="rounded-xl p-5 flex flex-col items-center gap-4"
                  style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", color: "#374151" }}>
                    OVERALL RISK
                  </p>
                  <RiskGauge score={result.riskScore} riskLevel={result.riskLevel as keyof typeof RISK} />
                  <div className="w-full space-y-3 pt-1">
                    <SubScore label="Deepfake Risk"   value={result.deepfakeRisk}        color="#e879f9" emoji="🎭" />
                    <SubScore label="Misinformation"  value={result.misinformationRisk}  color="#f97316" emoji="⚠️" />
                    <SubScore label="Sensationalism"  value={result.sensationalismScore} color="#eab308" emoji="📢" />
                  </div>
                </div>

                {/* Details column */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Video info */}
                  <div className="rounded-xl p-4"
                    style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Film className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                      <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#374151", textTransform: "uppercase" as const }}>
                        Analyzed Content
                      </span>
                    </div>
                    <p style={{ fontFamily: F, fontSize: "14px", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.45 }}>
                      {result.videoTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span style={{
                        fontFamily: F, fontSize: "11px", fontWeight: 600,
                        color: PLATFORM_COLOR[result.platform] ?? "#3b82f6",
                        background: `${PLATFORM_COLOR[result.platform] ?? "#3b82f6"}14`,
                        border: `1px solid ${PLATFORM_COLOR[result.platform] ?? "#3b82f6"}28`,
                        borderRadius: "6px", padding: "2px 8px",
                      }}>
                        {result.platform}
                      </span>
                      {mode === "url" && url && (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#3b82f6" }}>
                          <ExternalLink className="w-2.5 h-2.5" />
                          Open link
                        </a>
                      )}
                    </div>
                    {result.thumbnailUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden" style={{ maxHeight: "120px" }}>
                        <img src={result.thumbnailUrl} alt="thumbnail" className="w-full object-cover" style={{ maxHeight: "120px" }} />
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="rounded-xl p-4"
                    style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                      <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#374151", textTransform: "uppercase" as const }}>
                        Analysis
                      </span>
                    </div>
                    <p style={{ fontFamily: F, fontSize: "13px", fontWeight: 400, color: "#c9d1d9", lineHeight: "1.65" }}>
                      {result.explanation}
                    </p>
                  </div>

                  {/* Red flags */}
                  {result.redFlags.length > 0 && (
                    <div className="rounded-xl overflow-hidden"
                      style={{ background: "#161b27", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <div className="px-4 py-2.5 flex items-center gap-2"
                        style={{ borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
                        <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#ef4444", opacity: 0.8 }} />
                        <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" as const }}>
                          Red Flags ({result.redFlags.length})
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {result.redFlags.map((flag, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                            <span style={{ color: "#ef4444", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>✕</span>
                            <span style={{ fontFamily: F, fontSize: "12px", fontWeight: 400, color: "#fca5a5", lineHeight: "1.5" }}>
                              {flag}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credibility signals */}
                  {result.credibilitySignals.length > 0 && (
                    <div className="rounded-xl overflow-hidden"
                      style={{ background: "#161b27", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <div className="px-4 py-2.5 flex items-center gap-2"
                        style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#22c55e", opacity: 0.8 }} />
                        <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" as const }}>
                          Credibility Signals
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {result.credibilitySignals.map((signal, i) => (
                          <div key={i}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                            <span style={{ color: "#22c55e", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                            <span style={{ fontFamily: F, fontSize: "12px", fontWeight: 400, color: "#86efac", lineHeight: "1.5" }}>
                              {signal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
