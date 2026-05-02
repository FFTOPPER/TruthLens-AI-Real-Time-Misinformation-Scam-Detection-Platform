import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyzeText, getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ShieldCheck, ScanLine, Zap, Eye, BrainCircuit } from "lucide-react";
import { Gauge } from "@/components/Gauge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function ScanningDots() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <motion.div
          className="w-20 h-20 rounded-full"
          style={{ border: "2px solid rgba(0, 229, 255, 0.2)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ border: "2px solid rgba(0, 229, 255, 0.4)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0, 229, 255, 0.08)", border: "1px solid rgba(0, 229, 255, 0.5)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <ScanLine className="w-6 h-6" style={{ color: "#00e5ff" }} />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="text-sm tracking-[0.3em] font-semibold"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 10px rgba(0, 229, 255, 0.8)" }}
          >
            SCANNING
          </span>
          <div className="flex items-end gap-1 h-4">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
        >
          PROCESSING TRANSMISSION DATA
        </span>
      </div>
    </div>
  );
}

interface ManipulationBarProps {
  label: string;
  sublabel: string;
  value: number;
  color: string;
  glow: string;
  delay: number;
  icon: string;
}

function ManipulationBar({ label, sublabel, value, color, glow, delay, icon }: ManipulationBarProps) {
  const intensity = value >= 70 ? "HIGH" : value >= 40 ? "MED" : "LOW";
  const intensityColor = value >= 70 ? "#ef4444" : value >= 40 ? "#f59e0b" : "rgba(255,255,255,0.3)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <div>
            <span
              className="text-[11px] font-semibold tracking-[0.12em]"
              style={{ fontFamily: "'Rajdhani', sans-serif", color: "rgba(255,255,255,0.75)" }}
            >
              {label}
            </span>
            <p
              className="text-[9px] tracking-wider leading-tight"
              style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}
            >
              {sublabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] tracking-[0.15em] px-1.5 py-0.5 rounded"
            style={{ fontFamily: "'Orbitron', monospace", color: intensityColor, background: `${intensityColor}18`, border: `1px solid ${intensityColor}30` }}
          >
            {intensity}
          </span>
          <span
            className="text-sm font-bold tabular-nums w-8 text-right"
            style={{ fontFamily: "'Orbitron', monospace", color, textShadow: `0 0 8px ${glow}` }}
          >
            {Math.round(value)}
          </span>
        </div>
      </div>
      {/* Track */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Animated fill */}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${glow}, 0 0 16px ${glow}`,
          }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute top-0 h-full w-8 rounded-full pointer-events-none"
          initial={{ left: "-10%" }}
          animate={{ left: "110%" }}
          transition={{ duration: 1.5, delay: delay + 0.4, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)` }}
        />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useAnalyzeText({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        toast({ title: "Analysis Complete", description: "Intelligence report generated." });
      },
      onError: () => {
        toast({ title: "Analysis Failed", description: "System error during processing.", variant: "destructive" });
      }
    }
  });

  const handleSubmit = () => {
    if (!text.trim() || text.length < 10) {
      toast({ title: "Input Error", description: "Provide at least 10 characters.", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate({ data: { text } });
  };

  const result = analyzeMutation.data;
  const isPending = analyzeMutation.isPending;

  const manipBars: ManipulationBarProps[] = result
    ? [
        {
          label: "Fear Tactics",
          sublabel: "Threats · danger · doom language",
          value: result.manipulationBreakdown.fear,
          color: "#ef4444",
          glow: "rgba(239,68,68,0.6)",
          delay: 0.55,
          icon: "⚠",
        },
        {
          label: "Urgency Language",
          sublabel: "Act now · deadlines · scarcity · FOMO",
          value: result.manipulationBreakdown.urgency,
          color: "#f97316",
          glow: "rgba(249,115,22,0.6)",
          delay: 0.65,
          icon: "⏱",
        },
        {
          label: "Emotional Triggers",
          sublabel: "Outrage · sympathy · tribalism",
          value: result.manipulationBreakdown.emotionalTriggers,
          color: "#a855f7",
          glow: "rgba(168,85,247,0.6)",
          delay: 0.75,
          icon: "◈",
        },
        {
          label: "Fake Authority",
          sublabel: "Unverified experts · false credentials",
          value: result.manipulationBreakdown.fakeAuthority,
          color: "#f59e0b",
          glow: "rgba(245,158,11,0.6)",
          delay: 0.85,
          icon: "⬡",
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.3)" }}
            >
              <Eye className="w-4 h-4" style={{ color: "#00e5ff" }} />
            </div>
            <h2
              className="text-2xl font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0, 229, 255, 0.5)" }}
            >
              THREAT ANALYSIS
            </h2>
          </div>
          <p
            className="text-xs tracking-widest ml-11"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
          >
            DEEP-STATE CREDIBILITY EVALUATION TERMINAL
          </p>
        </motion.div>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(0, 229, 255, 0.4), rgba(168, 85, 247, 0.4), transparent)" }} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl relative overflow-hidden corner-brackets"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 229, 255, 0.12)",
            boxShadow: "0 0 40px rgba(0, 229, 255, 0.04), inset 0 0 40px rgba(0, 229, 255, 0.02)",
          }}
        >
          <span />
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(0, 229, 255, 0.08)", background: "rgba(0, 229, 255, 0.03)" }}
          >
            <ScanLine className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
            <span
              className="text-[11px] tracking-[0.25em] font-semibold"
              style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}
            >
              INPUT STREAM
            </span>
          </div>

          <div className="p-6">
            <div className="relative">
              <textarea
                placeholder="Paste transmission data here — news article, message, URL content..."
                className="w-full min-h-[280px] resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-all duration-300"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  lineHeight: "1.7",
                }}
                onFocus={e => {
                  e.currentTarget.style.border = "1px solid rgba(0, 229, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 229, 255, 0.08)";
                }}
                onBlur={e => {
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={text}
                onChange={e => setText(e.target.value)}
                data-testid="input-text-analysis"
              />
              <span
                className="absolute bottom-3 right-3 text-[10px]"
                style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}
              >
                {text.length} chars
              </span>
            </div>

            <div className="mt-5 flex justify-end">
              <motion.button
                onClick={handleSubmit}
                disabled={isPending || !text.trim()}
                className="relative overflow-hidden px-8 py-3 rounded-lg text-xs tracking-[0.25em] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  background: isPending
                    ? "rgba(0, 229, 255, 0.1)"
                    : "linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(168, 85, 247, 0.15))",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  color: "#00e5ff",
                  boxShadow: isPending ? "none" : "0 0 20px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0, 229, 255, 0.05)",
                }}
                whileHover={!isPending && text.trim() ? {
                  scale: 1.02,
                  boxShadow: "0 0 40px rgba(0, 229, 255, 0.4), 0 0 80px rgba(0, 229, 255, 0.15), inset 0 0 20px rgba(0, 229, 255, 0.1)",
                } : {}}
                whileTap={!isPending && text.trim() ? { scale: 0.97 } : {}}
                data-testid="button-submit-analysis"
              >
                {!isPending && text.trim() && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.15), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {isPending ? "PROCESSING..." : "INITIATE SCAN"}
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Result card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(168, 85, 247, 0.12)",
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.04), inset 0 0 40px rgba(168, 85, 247, 0.02)",
            minHeight: "420px",
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.08)", background: "rgba(168, 85, 247, 0.03)" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
            <span
              className="text-[11px] tracking-[0.25em] font-semibold"
              style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}
            >
              INTELLIGENCE REPORT
            </span>
          </div>

          <div className="p-6 h-full">
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full min-h-[320px] scan-overlay rounded-lg"
                  style={{ background: "rgba(0, 229, 255, 0.02)", border: "1px solid rgba(0, 229, 255, 0.08)" }}
                >
                  <ScanningDots />
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  {/* Gauge */}
                  <div
                    className="flex items-center justify-center py-4 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <Gauge score={result.credibilityScore} />
                  </div>

                  {/* Explanation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-lg p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p
                      className="text-[10px] tracking-[0.2em] mb-2"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
                    >
                      ANALYSIS SUMMARY
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.7" }}
                      data-testid="text-explanation"
                    >
                      {result.explanation}
                    </p>
                  </motion.div>

                  {/* Manipulation breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(168, 85, 247, 0.15)", background: "rgba(168, 85, 247, 0.03)" }}
                  >
                    <div
                      className="px-4 py-3 flex items-center gap-2"
                      style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.1)", background: "rgba(168, 85, 247, 0.04)" }}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                      <span
                        className="text-[10px] tracking-[0.2em] font-semibold"
                        style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}
                      >
                        MANIPULATION TECHNIQUE BREAKDOWN
                      </span>
                    </div>
                    <div className="px-4 py-4 space-y-4">
                      {manipBars.map(bar => (
                        <ManipulationBar key={bar.label} {...bar} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Suspicious phrases */}
                  {result.suspiciousPhrases.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.95 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
                        <span
                          className="text-[10px] tracking-[0.2em]"
                          style={{ fontFamily: "'Space Mono', monospace", color: "#ef4444" }}
                        >
                          DETECTED ANOMALIES
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.suspiciousPhrases.map((phrase, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + i * 0.08 }}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                          >
                            <span
                              className="text-[10px] mt-0.5 flex-shrink-0 font-bold"
                              style={{ color: "rgba(239, 68, 68, 0.5)", fontFamily: "'Space Mono', monospace" }}
                            >
                              [{String(i + 1).padStart(2, "0")}]
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: "#fca5a5",
                                fontFamily: "'Space Mono', monospace",
                                textDecoration: "underline",
                                textDecorationColor: "rgba(239, 68, 68, 0.4)",
                                textUnderlineOffset: "3px",
                              }}
                            >
                              {phrase}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4"
                >
                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ border: "1px solid rgba(168, 85, 247, 0.2)", background: "rgba(168, 85, 247, 0.04)" }}
                  >
                    <ShieldCheck className="w-8 h-8" style={{ color: "rgba(168, 85, 247, 0.4)" }} />
                  </motion.div>
                  <div className="text-center">
                    <p
                      className="text-xs tracking-[0.2em]"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}
                    >
                      AWAITING TRANSMISSION
                    </p>
                    <p
                      className="text-[10px] tracking-widest mt-1"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.1)" }}
                    >
                      SUBMIT TEXT TO BEGIN ANALYSIS
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
