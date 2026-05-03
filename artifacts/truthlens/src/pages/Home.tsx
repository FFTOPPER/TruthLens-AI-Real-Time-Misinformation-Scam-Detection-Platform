import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyzeText, getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ShieldCheck, ScanLine, Zap, Eye, BrainCircuit, ChevronDown, FlaskConical } from "lucide-react";
import { Gauge } from "@/components/Gauge";
import { TrustOrb } from "@/components/TrustOrb";
import { VoiceControls } from "@/components/VoiceControls";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

/* ── Sample data ───────────────────────────────────────────── */
const SAMPLES = [
  {
    label: "Try Sample 1",
    tag: "SCAM",
    tagColor: "#ef4444",
    text: `URGENT: Your bank account has been compromised! Click here IMMEDIATELY to verify your identity or your account will be permanently suspended within 24 hours. Act NOW — hundreds of accounts have already been locked. Our security team has detected suspicious login attempts from 3 different countries. You MUST confirm your details at: secure-bank-verify.click/confirm. WARNING: Failure to act within 2 hours will result in permanent account closure and loss of all funds. This is your FINAL warning.`,
  },
  {
    label: "Try Sample 2",
    tag: "MISLEADING",
    tagColor: "#f59e0b",
    text: `Scientists CONFIRM: Common household chemical cures cancer in 3 days — Big Pharma doesn't want you to know! An anonymous researcher who was fired from a major pharmaceutical company has revealed that mixing bleach with apple cider vinegar creates a miracle cure that destroys all cancer cells. Mainstream media refuses to cover this story. Share this before it gets deleted! The government is suppressing this cure because cancer treatment is a multi-billion dollar industry.`,
  },
  {
    label: "Try Sample 3",
    tag: "SAFE",
    tagColor: "#00ff88",
    text: `NASA's James Webb Space Telescope has captured the most detailed images yet of a galaxy cluster 4.6 billion light-years away, revealing thousands of previously unseen galaxies in the background. The images, released Tuesday, were taken using infrared wavelengths and show the gravitational lensing effect predicted by Einstein's general relativity. Researchers from 12 universities contributed to the analysis published in The Astrophysical Journal.`,
  },
];

/* ── Feature pills for hero ───────────────────────────────── */
const FEATURES = [
  { icon: "◈", text: "Manipulation signals" },
  { icon: "◉", text: "Credibility score" },
  { icon: "⚑", text: "Risk breakdown" },
  { icon: "🎙", text: "Voice readout" },
];

/* ── Scanning line overlay ────────────────────────────────── */
function ScanOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        >
          {/* Repeating scan line */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute left-0 right-0"
              style={{
                height: 2,
                background: "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.0) 5%, rgba(0,229,255,0.9) 40%, rgba(168,85,247,0.9) 60%, rgba(0,229,255,0.0) 95%, transparent 100%)",
                boxShadow: "0 0 20px rgba(0,229,255,0.6), 0 0 60px rgba(0,229,255,0.2)",
                top: "-4px",
              }}
              animate={{ top: ["0%", "100%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "linear",
              }}
            />
          ))}

          {/* Center HUD */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full"
                style={{ border: "1px solid rgba(0,229,255,0.3)" }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-3 rounded-full"
                style={{ border: "1px solid rgba(0,229,255,0.5)" }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              />
              <motion.div
                className="absolute inset-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.6)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              >
                <ScanLine className="w-7 h-7" style={{ color: "#00e5ff" }} />
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-base tracking-[0.35em] font-bold"
                  style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 16px rgba(0,229,255,0.9)" }}
                >
                  SCANNING
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0,1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </div>

            {/* Corner brackets on the HUD */}
            {[
              { top: "30%", left: "25%", borderTop: "2px solid", borderLeft: "2px solid", w: 24, h: 24 },
              { top: "30%", right: "25%", borderTop: "2px solid", borderRight: "2px solid", w: 24, h: 24 },
              { bottom: "30%", left: "25%", borderBottom: "2px solid", borderLeft: "2px solid", w: 24, h: 24 },
              { bottom: "30%", right: "25%", borderBottom: "2px solid", borderRight: "2px solid", w: 24, h: 24 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  ...s,
                  width: s.w,
                  height: s.h,
                  borderColor: "rgba(0,229,255,0.5)",
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Manipulation bar ──────────────────────────────────────── */
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
            <span className="text-[11px] font-semibold tracking-[0.12em]" style={{ fontFamily: "'Rajdhani', sans-serif", color: "rgba(255,255,255,0.75)" }}>
              {label}
            </span>
            <p className="text-[9px] tracking-wider leading-tight" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
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
          <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ fontFamily: "'Orbitron', monospace", color, textShadow: `0 0 8px ${glow}` }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${glow}, 0 0 16px ${glow}` }}
        />
        <motion.div
          className="absolute top-0 h-full w-8 rounded-full pointer-events-none"
          initial={{ left: "-10%" }}
          animate={{ left: "110%" }}
          transition={{ duration: 1.5, delay: delay + 0.4, ease: "easeOut" }}
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
        />
      </div>
    </motion.div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function Home() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const analyzeMutation = useAnalyzeText({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        toast({ title: "Analysis Complete", description: "Intelligence report generated." });
      },
      onError: () => {
        toast({ title: "Analysis Failed", description: "System error during processing.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = () => {
    if (!text.trim() || text.length < 10) {
      toast({ title: "Input Error", description: "Provide at least 10 characters.", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate({ data: { text } });
  };

  const handleSample = (sample: (typeof SAMPLES)[number]) => {
    setText(sample.text);
    terminalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  const scrollToTerminal = () => {
    terminalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const result = analyzeMutation.data;
  const isPending = analyzeMutation.isPending;
  const riskLevel = (result?.riskLevel as "Low" | "Medium" | "High" | null) ?? null;

  const manipBars: ManipulationBarProps[] = result
    ? [
        { label: "Fear Tactics", sublabel: "Threats · danger · doom language", value: result.manipulationBreakdown.fear, color: "#ef4444", glow: "rgba(239,68,68,0.6)", delay: 0.55, icon: "⚠" },
        { label: "Urgency Language", sublabel: "Act now · deadlines · scarcity · FOMO", value: result.manipulationBreakdown.urgency, color: "#f97316", glow: "rgba(249,115,22,0.6)", delay: 0.65, icon: "⏱" },
        { label: "Emotional Triggers", sublabel: "Outrage · sympathy · tribalism", value: result.manipulationBreakdown.emotionalTriggers, color: "#a855f7", glow: "rgba(168,85,247,0.6)", delay: 0.75, icon: "◈" },
        { label: "Fake Authority", sublabel: "Unverified experts · false credentials", value: result.manipulationBreakdown.fakeAuthority, color: "#f59e0b", glow: "rgba(245,158,11,0.6)", delay: 0.85, icon: "⬡" },
      ]
    : [];

  return (
    <>
      {/* Full-screen scan overlay */}
      <ScanOverlay active={isPending} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-12"
      >
        {/* ── HERO ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex flex-col items-center text-center py-12 px-4 overflow-hidden rounded-2xl"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.06) 0%, rgba(168,85,247,0.04) 50%, transparent 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Background grid lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 100%)",
            }}
          />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.2)" }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] tracking-[0.2em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
              LIVE · SCAN READY
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl sm:text-6xl font-black tracking-tight mb-4 leading-none"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: "linear-gradient(135deg, #00e5ff 0%, #a855f7 50%, #00e5ff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              filter: "drop-shadow(0 0 30px rgba(0,229,255,0.3))",
            }}
          >
            TruthLens AI
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg mb-8 max-w-md"
            style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}
          >
            Know what's real.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-xs">{f.icon}</span>
                <span className="text-[10px] tracking-wide" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.45)" }}>
                  {f.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.button
            onClick={scrollToTerminal}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative overflow-hidden px-8 py-3 rounded-xl text-xs tracking-[0.25em] font-bold flex items-center gap-2"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))",
              border: "1px solid rgba(0,229,255,0.35)",
              color: "#00e5ff",
              boxShadow: "0 0 30px rgba(0,229,255,0.15), inset 0 0 20px rgba(0,229,255,0.05)",
            }}
            whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(0,229,255,0.35), inset 0 0 30px rgba(0,229,255,0.08)" }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.12), transparent)" }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <Zap className="w-3.5 h-3.5 relative" />
            <span className="relative">START SCANNING</span>
            <ChevronDown className="w-3.5 h-3.5 relative" />
          </motion.button>
        </motion.section>

        {/* ── ANALYSIS TERMINAL ──────────────────────────────── */}
        <div ref={terminalRef} className="space-y-8">
          {/* Section heading */}
          <div className="relative">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}
                >
                  <Eye className="w-4 h-4" style={{ color: "#00e5ff" }} />
                </div>
                <h2
                  className="text-2xl font-bold tracking-widest"
                  style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
                >
                  THREAT ANALYSIS
                </h2>
              </div>
              <p className="text-xs tracking-widest ml-11" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}>
                PASTE TEXT · GET THE TRUTH
              </p>
            </motion.div>
            <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(0,229,255,0.4), rgba(168,85,247,0.4), transparent)" }} />
          </div>

          {/* ── Sample buttons ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 mr-1">
              <FlaskConical className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
              <span className="text-[10px] tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                TRY A SAMPLE:
              </span>
            </div>
            {SAMPLES.map((s, i) => (
              <motion.button
                key={s.label}
                onClick={() => handleSample(s)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] tracking-[0.12em] font-semibold"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: `${s.tagColor}0d`,
                  border: `1px solid ${s.tagColor}30`,
                  color: "rgba(255,255,255,0.6)",
                }}
                whileHover={{ scale: 1.04, background: `${s.tagColor}18`, borderColor: `${s.tagColor}55` }}
                whileTap={{ scale: 0.96 }}
              >
                <span
                  className="text-[8px] px-1 py-0.5 rounded font-bold tracking-widest"
                  style={{ background: `${s.tagColor}22`, color: s.tagColor, border: `1px solid ${s.tagColor}44` }}
                >
                  {s.tag}
                </span>
                {s.label}
              </motion.button>
            ))}
          </motion.div>

          {/* ── Main grid ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input + Trust Orb */}
            <div className="flex flex-col gap-6">
              {/* Input card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-xl relative overflow-hidden corner-brackets"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,229,255,0.12)",
                  boxShadow: "0 0 40px rgba(0,229,255,0.04), inset 0 0 40px rgba(0,229,255,0.02)",
                }}
              >
                <span />
                <div
                  className="px-6 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,229,255,0.03)" }}
                >
                  <ScanLine className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
                  <span className="text-[11px] tracking-[0.25em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
                    YOUR TEXT
                  </span>
                </div>

                <div className="p-6">
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      placeholder="Paste any text to check — news, messages, claims..."
                      className="w-full min-h-[200px] resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-all duration-300"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "12px",
                        lineHeight: "1.7",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = "1px solid rgba(0,229,255,0.3)";
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,0.08)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
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
                          ? "rgba(0,229,255,0.1)"
                          : "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))",
                        border: "1px solid rgba(0,229,255,0.4)",
                        color: "#00e5ff",
                        boxShadow: isPending ? "none" : "0 0 20px rgba(0,229,255,0.2), inset 0 0 20px rgba(0,229,255,0.05)",
                      }}
                      whileHover={!isPending && text.trim() ? {
                        scale: 1.02,
                        boxShadow: "0 0 40px rgba(0,229,255,0.4), 0 0 80px rgba(0,229,255,0.15), inset 0 0 20px rgba(0,229,255,0.1)",
                      } : {}}
                      whileTap={!isPending && text.trim() ? { scale: 0.97 } : {}}
                      data-testid="button-submit-analysis"
                    >
                      {!isPending && text.trim() && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      <div className="relative flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        {isPending ? "SCANNING..." : "SCAN"}
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Trust Orb */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.015)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="px-6 py-3 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-[10px] tracking-[0.25em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
                    ◈ TRUST SIGNAL
                  </span>
                </div>
                <div className="py-6 flex items-center justify-center">
                  <TrustOrb risk={isPending ? null : riskLevel} score={isPending ? null : (result?.credibilityScore ?? null)} />
                </div>
              </motion.div>
            </div>

            {/* Right: Intelligence Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-xl relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(168,85,247,0.12)",
                boxShadow: "0 0 40px rgba(168,85,247,0.04), inset 0 0 40px rgba(168,85,247,0.02)",
                minHeight: "420px",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(168,85,247,0.08)", background: "rgba(168,85,247,0.03)" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                <span className="text-[11px] tracking-[0.25em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}>
                  RESULTS
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
                      className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4"
                    >
                      <span className="text-[11px] tracking-[0.25em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(0,229,255,0.5)" }}>
                        CHECKING...
                      </span>
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

                      {/* Voice controls */}
                      <VoiceControls result={result} />

                      {/* Explanation — bullet findings */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(0,229,255,0.1)", background: "rgba(0,229,255,0.02)" }}
                      >
                        {/* Header */}
                        <div
                          className="px-4 py-3 flex items-center justify-between"
                          style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,229,255,0.03)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3" style={{ color: "#00e5ff" }} />
                            <span className="text-[10px] tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
                              FINDINGS
                            </span>
                          </div>
                          <span
                            className="text-[8px] tracking-[0.15em] px-2 py-0.5 rounded-full"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: riskLevel === "High" ? "#ef4444" : riskLevel === "Medium" ? "#f59e0b" : "#00ff88",
                              background: riskLevel === "High" ? "rgba(239,68,68,0.1)" : riskLevel === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(0,255,136,0.1)",
                              border: `1px solid ${riskLevel === "High" ? "rgba(239,68,68,0.25)" : riskLevel === "Medium" ? "rgba(245,158,11,0.25)" : "rgba(0,255,136,0.25)"}`,
                            }}
                          >
                            {riskLevel === "High" ? "HIGH RISK" : riskLevel === "Medium" ? "MEDIUM RISK" : "LOW RISK"}
                          </span>
                        </div>

                        {/* Bullets */}
                        <div className="px-4 py-3 space-y-2" data-testid="text-explanation">
                          {result.explanation
                            .split(/(?<=[.!?])\s+/)
                            .map(s => s.trim())
                            .filter(s => s.length > 4)
                            .map((sentence, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.1, duration: 0.3 }}
                                className="group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-default"
                                style={{
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.04)",
                                  transition: "background 0.2s, border-color 0.2s",
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLDivElement).style.background = "rgba(0,229,255,0.04)";
                                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,229,255,0.15)";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.04)";
                                }}
                              >
                                {/* Bullet marker */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
                                  <motion.div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                      background: i === 0 ? "#00e5ff" : "rgba(255,255,255,0.2)",
                                      boxShadow: i === 0 ? "0 0 6px #00e5ff" : "none",
                                    }}
                                    animate={i === 0 ? { opacity: [0.6, 1, 0.6] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  {i < result.explanation.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 4).length - 1 && (
                                    <motion.div
                                      className="w-px flex-1"
                                      initial={{ height: 0 }}
                                      animate={{ height: "100%" }}
                                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                                      style={{
                                        background: "linear-gradient(180deg, rgba(0,229,255,0.2), rgba(0,229,255,0.04))",
                                        minHeight: "12px",
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Index + text */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                      className="text-[8px] font-bold tracking-[0.2em]"
                                      style={{ fontFamily: "'Orbitron', monospace", color: "rgba(0,229,255,0.35)" }}
                                    >
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs leading-relaxed"
                                    style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.65", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", fontWeight: 500 }}
                                  >
                                    {sentence}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </motion.div>

                      {/* Manipulation breakdown */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.03)" }}
                      >
                        <div
                          className="px-4 py-3 flex items-center gap-2"
                          style={{ borderBottom: "1px solid rgba(168,85,247,0.1)", background: "rgba(168,85,247,0.04)" }}
                        >
                          <BrainCircuit className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                          <span className="text-[10px] tracking-[0.2em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}>
                            MANIPULATION SIGNALS
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
                            <span className="text-[10px] tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace", color: "#ef4444" }}>
                              FLAGGED PHRASES
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
                                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                              >
                                <span className="text-[10px] mt-0.5 flex-shrink-0 font-bold" style={{ color: "rgba(239,68,68,0.5)", fontFamily: "'Space Mono', monospace" }}>
                                  [{String(i + 1).padStart(2, "0")}]
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "#fca5a5", fontFamily: "'Space Mono', monospace", textDecoration: "underline", textDecorationColor: "rgba(239,68,68,0.4)", textUnderlineOffset: "3px" }}
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
                        style={{ border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.04)" }}
                      >
                        <ShieldCheck className="w-8 h-8" style={{ color: "rgba(168,85,247,0.4)" }} />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-xs tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
                          READY TO SCAN
                        </p>
                        <p className="text-[10px] tracking-widest mt-1" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.1)" }}>
                          PASTE TEXT · HIT SCAN
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
