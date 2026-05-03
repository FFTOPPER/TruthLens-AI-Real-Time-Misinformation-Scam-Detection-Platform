import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Link2, Upload, X, AlertTriangle, ShieldCheck,
  ScanLine, ExternalLink, RefreshCw, Info, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  Low:    { color: "#00ff88", bg: "rgba(0,255,136,0.06)",  border: "rgba(0,255,136,0.2)",  label: "LOW RISK",    icon: "🛡️" },
  Medium: { color: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.2)", label: "MEDIUM RISK", icon: "⚡" },
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",  label: "HIGH RISK",   icon: "☠️" },
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="7"
          strokeDasharray={`0 ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 7px ${col}88)` }}
          animate={{ strokeDasharray: `${fill} ${circ}` }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.25 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 220 }}
          style={{ fontFamily: "'Orbitron', monospace", fontSize: "30px", fontWeight: 900, color: col, lineHeight: 1 }}
        >
          {score}
        </motion.span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.25)", marginTop: "3px" }}>
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
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)" }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px", fontWeight: 700, color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.55 }}
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}55` }} />
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
  YouTube:     "#ff3b30",
  TikTok:      "#ff0050",
  Rumble:      "#85c742",
  BitChute:    "#f97316",
  "X (Twitter)":"#ffffff",
  Facebook:    "#1877f2",
  Instagram:   "#e879f9",
  Vimeo:       "#1ab7ea",
};

/* ── Sample URLs ───────────────────────────────────────────── */
const SAMPLES = [
  { label: "🎬 YouTube News", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "⚠️ Rumble Clip",  url: "https://rumble.com/v-example-conspiracy-video" },
  { label: "🔬 TikTok Health", url: "https://www.tiktok.com/@example/video/1234567890" },
];

/* ── Page ──────────────────────────────────────────────────── */
export default function VideoScan() {
  const { toast } = useToast();
  const [mode, setMode]           = useState<"url" | "upload">("url");
  const [url, setUrl]             = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]       = useState<VideoAnalysis | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const canAnalyze = mode === "url" ? url.trim().length > 0 : file !== null;
  const platform   = mode === "url" && url ? detectPlatform(url) : null;
  const platColor  = platform ? (PLATFORM_COLOR[platform] ?? "#a855f7") : "#a855f7";

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
    <div className="min-h-screen px-4 py-8 lg:px-8 lg:py-10 max-w-5xl mx-auto space-y-5">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Film className="w-4 h-4" style={{ color: "#a855f7" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-wider"
            style={{ fontFamily: "'Orbitron', monospace", color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
            VIDEO SCAN
          </h1>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.18em",
            color: "rgba(168,85,247,0.6)", background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.2)", borderRadius: "9999px", padding: "2px 8px",
          }}>
            DEEPFAKE · MISINFO AI
          </span>
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em" }}>
          PASTE A VIDEO LINK · UPLOAD A CLIP · AI DETECTS MANIPULATION IN SECONDS
        </p>
      </motion.div>

      {/* ── Input card ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.03)" }}>

        {/* Mode tabs */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
          {([ ["url", Link2, "PASTE URL"], ["upload", Upload, "UPLOAD FILE"] ] as const).map(([m, Icon, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3"
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: "8.5px", letterSpacing: "0.15em",
                cursor: "pointer", border: "none",
                color: mode === m ? "#a855f7" : "rgba(255,255,255,0.28)",
                background: mode === m ? "rgba(168,85,247,0.07)" : "transparent",
                borderBottom: mode === m ? "2px solid #a855f7" : "2px solid transparent",
                transition: "all 0.2s",
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
                  style={{ color: "rgba(168,85,247,0.45)" }} />
                <input
                  type="url" value={url} onChange={e => { setUrl(e.target.value); setResult(null); }}
                  placeholder="https://youtube.com/watch?v=...  or any video URL"
                  onKeyDown={e => e.key === "Enter" && analyze()}
                  className="w-full pl-10 pr-10 py-3 rounded-xl outline-none"
                  style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.2)",
                    color: "rgba(255,255,255,0.85)", fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "13px", letterSpacing: "0.02em", caretColor: "#a855f7",
                  }}
                />
                {url && (
                  <button onClick={() => { setUrl(""); setResult(null); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} />
                  </button>
                )}
              </div>

              {/* Platform pill */}
              <AnimatePresence>
                {platform && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)" }}>
                      PLATFORM DETECTED:
                    </span>
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: "8.5px", letterSpacing: "0.1em",
                      color: platColor, background: `${platColor}14`,
                      border: `1px solid ${platColor}30`, borderRadius: "6px", padding: "2px 7px",
                    }}>
                      {platform}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sample quick-load */}
              {!url && (
                <div className="flex flex-wrap gap-2">
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", alignSelf: "center" }}>
                    TRY A SAMPLE:
                  </span>
                  {SAMPLES.map(s => (
                    <button key={s.label} onClick={() => setUrl(s.url)}
                      className="px-2.5 py-1 rounded-lg text-[8px] tracking-wider transition-all"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.14)",
                        color: "rgba(168,85,247,0.55)", cursor: "pointer",
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
                border: `2px dashed ${isDragging ? "#a855f7" : file ? "rgba(0,255,136,0.4)" : "rgba(168,85,247,0.22)"}`,
                background: isDragging ? "rgba(168,85,247,0.07)" : file ? "rgba(0,255,136,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }} />
              {file ? (
                <>
                  <Film className="w-7 h-7" style={{ color: "#00ff88" }} />
                  <div className="text-center">
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", color: "#00ff88", fontWeight: 600 }}>
                      {file.name}
                    </p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", marginTop: "3px" }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type || "video"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" style={{ color: "rgba(168,85,247,0.35)" }} />
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8.5px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
                    DROP VIDEO FILE HERE<br />
                    <span style={{ color: "rgba(255,255,255,0.16)" }}>OR CLICK TO BROWSE</span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Analyze button */}
          <motion.button
            onClick={analyze}
            disabled={isAnalyzing || !canAnalyze}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.2em",
              border: `1px solid ${canAnalyze && !isAnalyzing ? "rgba(168,85,247,0.45)" : "rgba(168,85,247,0.1)"}`,
              background: canAnalyze && !isAnalyzing
                ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))"
                : "rgba(168,85,247,0.05)",
              color: canAnalyze && !isAnalyzing ? "#a855f7" : "rgba(168,85,247,0.28)",
              cursor: canAnalyze && !isAnalyzing ? "pointer" : "not-allowed",
            }}
            whileHover={canAnalyze && !isAnalyzing ? { scale: 1.01 } : {}}
            whileTap={canAnalyze && !isAnalyzing ? { scale: 0.98 } : {}}
          >
            {isAnalyzing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <ScanLine className="w-4 h-4" />
                </motion.div>
                ANALYZING VIDEO…
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                ANALYZE VIDEO
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Loading shimmer ── */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl p-5 space-y-4"
            style={{ border: "1px solid rgba(168,85,247,0.14)", background: "rgba(168,85,247,0.04)" }}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {["SCANNING URL", "FETCHING METADATA", "AI PROCESSING", "COMPUTING RISK SCORE"].map((step, i) => (
                <motion.div key={step} className="flex items-center gap-1.5"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: "#a855f7" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7px", letterSpacing: "0.1em", color: "rgba(168,85,247,0.6)" }}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
            {/* Scanline bar */}
            <div className="h-px w-full rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.1)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)", width: "28%" }}
                animate={{ x: ["-28%", "400%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !isAnalyzing && (() => {
          const sev = RISK[result.riskLevel as keyof typeof RISK] ?? RISK.Medium;
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4">

              {/* Verdict banner */}
              <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ border: `1px solid ${sev.border}`, background: sev.bg }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "22px" }}>{sev.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: 700, color: sev.color, letterSpacing: "0.12em" }}>
                      {sev.label}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13.5px", color: "rgba(255,255,255,0.78)", marginTop: "3px", lineHeight: 1.45 }}>
                      {result.verdict}
                    </div>
                  </div>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.14em", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                  <RefreshCw className="w-3 h-3" />
                  NEW SCAN
                </button>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Gauge column */}
                <div className="rounded-xl p-5 flex flex-col items-center gap-5"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.22)" }}>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>
                    OVERALL RISK
                  </p>
                  <RiskGauge score={result.riskScore} riskLevel={result.riskLevel as keyof typeof RISK} />
                  <div className="w-full space-y-3 pt-1">
                    <SubScore label="DEEPFAKE RISK"   value={result.deepfakeRisk}        color="#e879f9" emoji="🎭" />
                    <SubScore label="MISINFORMATION"  value={result.misinformationRisk}  color="#f97316" emoji="⚠️" />
                    <SubScore label="SENSATIONALISM"  value={result.sensationalismScore}  color="#eab308" emoji="📢" />
                  </div>
                </div>

                {/* Details column */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Video info */}
                  <div className="rounded-xl p-4"
                    style={{ border: "1px solid rgba(168,85,247,0.14)", background: "rgba(168,85,247,0.04)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Film className="w-3.5 h-3.5" style={{ color: "rgba(168,85,247,0.5)" }} />
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.18em", color: "rgba(168,85,247,0.45)" }}>
                        ANALYZED CONTENT
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.45 }}>
                      {result.videoTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.1em",
                        color: PLATFORM_COLOR[result.platform] ?? "#a855f7",
                        background: `${PLATFORM_COLOR[result.platform] ?? "#a855f7"}12`,
                        border: `1px solid ${PLATFORM_COLOR[result.platform] ?? "#a855f7"}28`,
                        borderRadius: "6px", padding: "2px 7px",
                      }}>
                        {result.platform}
                      </span>
                      {mode === "url" && url && (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.1em", color: "rgba(168,85,247,0.4)" }}>
                          <ExternalLink className="w-2.5 h-2.5" />
                          OPEN ORIGINAL
                        </a>
                      )}
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="rounded-xl p-4"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.18)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Info className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.22)" }} />
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)" }}>
                        AI ANALYSIS
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13.5px", color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>
                      {result.explanation}
                    </p>
                  </div>

                  {/* Red flags */}
                  {result.redFlags.length > 0 && (
                    <div className="rounded-xl p-4"
                      style={{ border: "1px solid rgba(239,68,68,0.16)", background: "rgba(239,68,68,0.04)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5" style={{ color: "rgba(239,68,68,0.6)" }} />
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.18em", color: "rgba(239,68,68,0.5)" }}>
                          RED FLAGS DETECTED ({result.redFlags.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.redFlags.map((flag, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.07 }}
                            className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)" }}>
                              <span style={{ color: "#ef4444", fontSize: "9px", fontWeight: 700 }}>!</span>
                            </div>
                            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12.5px", color: "rgba(255,255,255,0.68)", lineHeight: 1.55 }}>
                              {flag}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credibility signals */}
                  {result.credibilitySignals.length > 0 && (
                    <div className="rounded-xl p-4"
                      style={{ border: "1px solid rgba(0,255,136,0.12)", background: "rgba(0,255,136,0.03)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: "rgba(0,255,136,0.5)" }} />
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", letterSpacing: "0.18em", color: "rgba(0,255,136,0.4)" }}>
                          CREDIBILITY SIGNALS
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.credibilitySignals.map((sig, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 + i * 0.07 }}
                            className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00ff88" }} />
                            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12.5px", color: "rgba(255,255,255,0.65)", lineHeight: 1.52 }}>
                              {sig}
                            </p>
                          </motion.div>
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
