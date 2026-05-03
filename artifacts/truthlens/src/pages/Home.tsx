import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyzeText, getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ShieldCheck, ScanLine, Zap, Eye, BrainCircuit, ChevronDown, FlaskConical, Lightbulb, Cpu, MessageCircle, CheckCircle2 } from "lucide-react";
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
    tagColor: "#22c55e",
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

/* ── Explain Deeply types ──────────────────────────────────── */
interface ExplainPattern { name: string; description: string; severity: "low" | "medium" | "high"; }
interface ExplainStep { step: number; action: string; why: string; }
interface ExplainData { summary: string; whyMisleading: string; patternsDetected: ExplainPattern[]; nextSteps: ExplainStep[]; }

const SEV_CFG = {
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.22)",  label: "HIGH RISK" },
  medium: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.22)", label: "MEDIUM" },
  low:    { color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.22)",  label: "LOW" },
};

/* ── 3-D pattern card ───────────────────────────────────────── */
function PatternCard3D({ pattern, idx }: { pattern: ExplainPattern; idx: number }) {
  const sev = SEV_CFG[pattern.severity] ?? SEV_CFG.medium;
  return (
    <div style={{ perspective: "900px" }}>
      <motion.div
        initial={{ opacity: 0, y: 10, rotateX: -12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        whileHover={{ rotateY: 7, rotateX: -5, scale: 1.03, z: 30 }}
        transition={{ delay: 0.1 + idx * 0.07, type: "spring", stiffness: 220, damping: 22 }}
        style={{
          transformStyle: "preserve-3d", background: sev.bg,
          border: `1px solid ${sev.border}`, borderRadius: "10px", padding: "12px 14px",
          boxShadow: `0 8px 32px ${sev.color}1a, 0 2px 8px rgba(0,0,0,0.3)`,
          cursor: "default",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold" style={{ fontFamily: F, color: sev.color }}>
            {pattern.name}
          </span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full"
            style={{ fontFamily: F, color: sev.color,
              background: `${sev.color}22`, border: `1px solid ${sev.color}44` }}>
            {sev.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--c-txt1)", fontFamily: F, fontSize: "12px", lineHeight: "1.55" }}>
          {pattern.description}
        </p>
        {/* 3-D depth layer */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "10px", background: `linear-gradient(135deg, ${sev.color}08 0%, transparent 60%)`, pointerEvents: "none" }} />
      </motion.div>
    </div>
  );
}

/* ── Explain Deep panel ─────────────────────────────────────── */
function ExplainPanel({ data }: { data: ExplainData }) {
  const STEP_ICONS = ["①", "②", "③", "④", "⑤"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.015)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.05)" }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
          <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "#06b6d4" }}>
            Deep Analysis
          </span>
        </div>
        <span className="text-[8px] px-2 py-0.5 rounded-full"
          style={{ fontFamily: F, color: "#06b6d4",
            background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)" }}>
          AI ADVISOR
        </span>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-5">
        {/* Conversational summary bubble */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          className="flex gap-3 p-3 rounded-xl"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)",
            boxShadow: "0 4px 24px rgba(6,182,212,0.06)" }}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)" }}>
            <BrainCircuit className="w-4 h-4" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <p className="text-[9px] mb-1.5 font-medium" style={{ fontFamily: F, color: "rgba(6,182,212,0.6)" }}>
              AI Advisor · plain English
            </p>
            <p style={{ color: "var(--c-hi)", fontFamily: F, fontSize: "14px", fontWeight: 400, lineHeight: "1.65" }}>
              "{data.summary}"
            </p>
          </div>
        </motion.div>

        {/* Why it matters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-3 h-3" style={{ color: "#06b6d4" }} />
            <span className="text-[9px] font-medium" style={{ fontFamily: F, color: "#06b6d4" }}>
              Why this matters
            </span>
          </div>
          <p style={{ color: "var(--c-txt1)", fontFamily: F, fontSize: "13px", lineHeight: "1.72" }}>
            {data.whyMisleading}
          </p>
        </motion.div>

        {/* Patterns detected — 3-D cards */}
        {data.patternsDetected.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3 h-3" style={{ color: "#06b6d4" }} />
              <span className="text-[9px] font-medium" style={{ fontFamily: F, color: "#06b6d4" }}>
                Patterns detected
              </span>
              <span className="text-[8px] ml-auto px-1.5 py-0.5 rounded-full"
                style={{ fontFamily: F, color: "rgba(6,182,212,0.5)",
                  background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                HOVER FOR 3-D
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {data.patternsDetected.map((p, i) => (
                <PatternCard3D key={p.name} pattern={p} idx={i} />
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        {data.nextSteps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-3 h-3" style={{ color: "#06b6d4" }} />
              <span className="text-[9px] font-medium" style={{ fontFamily: F, color: "#06b6d4" }}>
                What to do next
              </span>
            </div>
            <div className="space-y-2">
              {data.nextSteps.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex gap-3 items-start p-3 rounded-lg"
                  style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)" }}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)" }}>
                    <span style={{ color: "#06b6d4", fontFamily: F, fontSize: "9px", fontWeight: "bold" }}>
                      {STEP_ICONS[i] ?? s.step}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: "var(--c-hi)", fontFamily: F, fontSize: "13px" }}>
                      {s.action}
                    </p>
                    <p style={{ color: "var(--c-txt2)", fontFamily: F, fontSize: "11.5px" }}>
                      {s.why}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Cognitive impact types ────────────────────────────────── */
interface CognitiveTechnique { name: string; active: boolean; mechanism: string; }
interface CognitiveImpactData { brainReaction: string; techniques: CognitiveTechnique[]; }
interface ExtendedResult {
  credibilityScore: number; riskLevel: string; explanation: string;
  suspiciousPhrases: string[];
  manipulationBreakdown: { fear: number; urgency: number; emotionalTriggers: number; fakeAuthority: number; };
  cognitiveImpact?: CognitiveImpactData;
  counterTruth?: string;
}

const TECH_CFG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "Fear Induction":   { color: "#ef4444", bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.22)",  icon: "⚡" },
  "Urgency Pressure": { color: "#f97316", bg: "rgba(249,115,22,0.07)", border: "rgba(249,115,22,0.22)", icon: "⏱" },
  "Authority Bias":   { color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.22)", icon: "⬡" },
  "Social Proof":     { color: "#a855f7", bg: "rgba(168,85,247,0.07)", border: "rgba(168,85,247,0.22)", icon: "◈" },
};

/* ── Neural Diagram SVG ─────────────────────────────────────── */
function NeuralDiagram({ techniques }: { techniques: CognitiveTechnique[] }) {
  const nodes = [
    { name: "Fear Induction",   cx: 110, cy: 28,  label: "FEAR" },
    { name: "Urgency Pressure", cx: 192, cy: 110, label: "URGENCY" },
    { name: "Authority Bias",   cx: 110, cy: 192, label: "AUTHORITY" },
    { name: "Social Proof",     cx: 28,  cy: 110, label: "SOCIAL" },
  ];
  const CX = 110, CY = 110;
  return (
    <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[180px] mx-auto">
      {/* Orbit rings */}
      <circle cx={CX} cy={CY} r={82} fill="none" stroke="var(--c-card-md)" strokeWidth="0.5" />
      <circle cx={CX} cy={CY} r={60} fill="none" stroke="var(--c-card)" strokeWidth="0.5" strokeDasharray="4,6" />
      {/* Connection lines */}
      {nodes.map(node => {
        const tech = techniques.find(t => t.name === node.name);
        const active = tech?.active ?? false;
        const cfg = TECH_CFG[node.name];
        return (
          <line key={node.name} x1={CX} y1={CY} x2={node.cx} y2={node.cy}
            stroke={active ? cfg.color : "var(--c-border-sub)"}
            strokeWidth={active ? 1.5 : 0.5}
            strokeDasharray={active ? "" : "3,4"}
            opacity={active ? 0.7 : 0.3}
          />
        );
      })}
      {/* Technique nodes */}
      {nodes.map(node => {
        const tech = techniques.find(t => t.name === node.name);
        const active = tech?.active ?? false;
        const cfg = TECH_CFG[node.name];
        return (
          <g key={node.name}>
            {active && <circle cx={node.cx} cy={node.cy} r={19} fill={`${cfg.color}18`} stroke={`${cfg.color}55`} strokeWidth="1" />}
            <circle cx={node.cx} cy={node.cy} r={12}
              fill={active ? `${cfg.color}28` : "var(--c-card)"}
              stroke={active ? cfg.color : "var(--c-border)"}
              strokeWidth={active ? 1.5 : 0.5}
            />
            <circle cx={node.cx} cy={node.cy} r={4}
              fill={active ? cfg.color : "var(--c-border)"}
            />
            <text x={node.cx} y={node.cy + (node.cy < CY ? -18 : node.cy > CY ? 22 : 0)}
              dy={node.cy === CY ? (node.cx < CX ? 0 : 0) : 0}
              dx={node.cy === CY ? (node.cx < CX ? -22 : 22) : 0}
              textAnchor={node.cy === CY ? (node.cx < CX ? "end" : "start") : "middle"}
              dominantBaseline="middle"
              fill={active ? cfg.color : "var(--c-txt4)"}
              fontSize="6" fontFamily="Inter, system-ui, sans-serif"
            >{node.label}</text>
          </g>
        );
      })}
      {/* Center brain */}
      <circle cx={CX} cy={CY} r={26} fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={17} fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
      <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="middle" fill="#10b981" fontSize="6" fontFamily="Inter, system-ui, sans-serif" fontWeight="bold">HUMAN</text>
      <text x={CX} y={CY + 5} textAnchor="middle" dominantBaseline="middle" fill="#10b981" fontSize="6" fontFamily="Inter, system-ui, sans-serif" fontWeight="bold">BRAIN</text>
    </svg>
  );
}

/* ── Cognitive technique card ──────────────────────────────── */
function CognitiveTechCard({ tech, idx }: { tech: CognitiveTechnique; idx: number }) {
  const cfg = TECH_CFG[tech.name] ?? TECH_CFG["Fear Induction"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 + idx * 0.07 }}
      className="p-2.5 rounded-lg"
      style={{ background: tech.active ? cfg.bg : "var(--c-card)", border: `1px solid ${tech.active ? cfg.border : "var(--c-border-sub)"}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span style={{ color: tech.active ? cfg.color : "var(--c-txt4)", fontSize: "10px" }}>{cfg.icon}</span>
          <span className="text-[9px] font-semibold" style={{ fontFamily: F, color: tech.active ? cfg.color : "var(--c-txt4)" }}>
            {tech.name}
          </span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded-full"
          style={{ fontFamily: F,
            background: tech.active ? `${cfg.color}22` : "var(--c-card-md)",
            color: tech.active ? cfg.color : "var(--c-txt4)",
            border: `1px solid ${tech.active ? `${cfg.color}44` : "var(--c-border-sub)"}` }}
        >
          {tech.active ? "ACTIVE" : "NONE"}
        </span>
      </div>
      <p className="text-[10px] leading-snug"
        style={{ color: tech.active ? "var(--c-txt2)" : "var(--c-txt4)", fontFamily: F, fontSize: "11px" }}>
        {tech.mechanism}
      </p>
    </motion.div>
  );
}

const F = "Inter, system-ui, sans-serif";

/* ── Scanning overlay ─────────────────────────────────────── */
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
          className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          {/* Spinner ring */}
          <motion.div
            className="w-16 h-16 rounded-full"
            style={{ border: "2px solid rgba(59,130,246,0.15)", borderTopColor: "#3b82f6" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex flex-col items-center gap-2">
            <span style={{ fontFamily: F, fontSize: "14px", fontWeight: 600, color: "var(--c-txt1)" }}>
              Analyzing…
            </span>
            <div className="flex items-center gap-1.5">
              {[0,1,2,3,4].map(i => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ background: "#3b82f6" }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </div>
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
  const intensityColor = value >= 70 ? "#ef4444" : value >= 40 ? "#f59e0b" : "var(--c-txt3)";

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
            <span className="text-[11px] font-semibold" style={{ fontFamily: F, color: "var(--c-txt1)" }}>
              {label}
            </span>
            <p className="text-[9px] leading-tight" style={{ fontFamily: F, color: "var(--c-txt3)" }}>
              {sublabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] tracking-[0.15em] px-1.5 py-0.5 rounded"
            style={{ fontFamily: F, color: intensityColor, background: `${intensityColor}18`, border: `1px solid ${intensityColor}30` }}
          >
            {intensity}
          </span>
          <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ fontFamily: F, color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--c-card-md)", border: "1px solid var(--c-card-md)" }}>
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
          style={{ background: "linear-gradient(90deg, transparent, var(--c-txt2), transparent)" }}
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

  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const handleExplainDeeply = async () => {
    if (!result) return;
    setExplainLoading(true);
    setExplainData(null);
    try {
      const res = await fetch("/api/analysis/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          credibilityScore: result.credibilityScore,
          riskLevel: result.riskLevel,
          manipulationBreakdown: result.manipulationBreakdown,
        }),
      });
      if (!res.ok) throw new Error("explain failed");
      const data = (await res.json()) as ExplainData;
      setExplainData(data);
    } catch {
      toast({ title: "Explain Failed", description: "Could not generate explanation.", variant: "destructive" });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || text.length < 10) {
      toast({ title: "Input Error", description: "Provide at least 10 characters.", variant: "destructive" });
      return;
    }
    setExplainData(null);
    setExplainLoading(false);
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
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.02) 50%, transparent 100%)",
            border: "1px solid var(--c-card-md)",
          }}
        >
          {/* Background grid lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)",
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
            style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.22)" }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#3b82f6" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] tracking-wide font-semibold" style={{ fontFamily: F, color: "#3b82f6" }}>
              Live · Scan ready
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl sm:text-6xl font-black tracking-tight mb-4 leading-none"
            style={{
              fontFamily: F,
              color: "#e2e8f0",
              letterSpacing: "-0.03em",
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
            style={{ color: "var(--c-txt2)", lineHeight: "1.6" }}
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
                style={{ background: "var(--c-card-md)", border: "1px solid var(--c-border)" }}
              >
                <span className="text-xs">{f.icon}</span>
                <span className="text-[10px] tracking-wide" style={{ fontFamily: F, color: "var(--c-txt2)" }}>
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
              fontFamily: F,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
            }}
            whileHover={{ scale: 1.04, background: "rgba(59,130,246,0.16)", borderColor: "rgba(59,130,246,0.55)" }}
            whileTap={{ scale: 0.97 }}
          >
            <div />
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
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}
                >
                  <Eye className="w-4 h-4" style={{ color: "#3b82f6" }} />
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: F, color: "#e2e8f0", letterSpacing: "-0.01em" }}
                >
                  Threat Analysis
                </h2>
              </div>
              <p className="text-xs ml-11" style={{ fontFamily: F, color: "var(--c-txt3)" }}>
                Paste text · get the truth
              </p>
            </motion.div>
            <div className="mt-4" style={{ height: "1px", background: "var(--c-border-sub)" }} />
          </div>

          {/* ── Sample buttons ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 mr-1">
              <FlaskConical className="w-3.5 h-3.5" style={{ color: "var(--c-txt3)" }} />
              <span className="text-[10px]" style={{ fontFamily: F, color: "var(--c-txt3)" }}>
                Try a sample:
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
                  fontFamily: F,
                  background: `${s.tagColor}0d`,
                  border: `1px solid ${s.tagColor}30`,
                  color: "var(--c-txt1)",
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
                className="rounded-xl relative overflow-hidden"
                style={{
                  background: "var(--c-card)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <span />
                <div
                  className="px-6 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--c-border-sub)", background: "var(--c-card)" }}
                >
                  <ScanLine className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                  <span className="text-[11px] font-semibold" style={{ fontFamily: F, color: "var(--c-txt2)" }}>
                    Your text
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
                        border: "1px solid var(--c-border-sub)",
                        color: "var(--c-hi)",
                        fontFamily: F,
                        fontSize: "13px",
                        lineHeight: "1.7",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = "1px solid rgba(59,130,246,0.35)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = "1px solid var(--c-border-sub)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      data-testid="input-text-analysis"
                    />
                    <span
                      className="absolute bottom-3 right-3 text-[10px]"
                      style={{ fontFamily: F, color: "var(--c-txt4)" }}
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
                        fontFamily: F,
                        background: isPending ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.4)",
                        color: "#60a5fa",
                      }}
                      whileHover={!isPending && text.trim() ? { scale: 1.02, background: "rgba(59,130,246,0.18)" } : {}}
                      whileTap={!isPending && text.trim() ? { scale: 0.97 } : {}}
                      data-testid="button-submit-analysis"
                    >
                      <div />
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
                  background: "var(--c-card)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--c-border-sub)",
                }}
              >
                <div
                  className="px-6 py-3 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--c-card-md)", background: "var(--c-card)" }}
                >
                  <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "var(--c-txt3)" }}>
                    ◈ Trust Signal
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
                background: "var(--c-card)",
                border: "1px solid var(--c-border)",
                minHeight: "420px",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--c-border-sub)", background: "var(--c-card)" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--c-txt2)" }} />
                <span className="text-[11px] font-semibold" style={{ fontFamily: F, color: "var(--c-txt2)" }}>
                  Results
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
                      <span className="text-[11px]" style={{ fontFamily: F, color: "var(--c-txt2)" }}>
                        Checking…
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
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--c-card-md)" }}
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
                          style={{ borderBottom: "1px solid var(--c-border-sub)", background: "var(--c-card)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3" style={{ color: "#3b82f6" }} />
                            <span className="text-[10px]" style={{ fontFamily: F, color: "var(--c-txt2)" }}>
                              Findings
                            </span>
                          </div>
                          <span
                            className="text-[8px] px-2 py-0.5 rounded-full"
                            style={{
                              fontFamily: F,
                              color: riskLevel === "High" ? "#ef4444" : riskLevel === "Medium" ? "#f59e0b" : "#22c55e",
                              background: riskLevel === "High" ? "rgba(239,68,68,0.1)" : riskLevel === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                              border: `1px solid ${riskLevel === "High" ? "rgba(239,68,68,0.25)" : riskLevel === "Medium" ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.22)"}`,
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
                                  background: "var(--c-card)",
                                  border: "1px solid var(--c-card-md)",
                                  transition: "background 0.2s, border-color 0.2s",
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.04)";
                                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.15)";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLDivElement).style.background = "var(--c-card)";
                                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--c-card-md)";
                                }}
                              >
                                {/* Bullet marker */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
                                  <motion.div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                      background: i === 0 ? "#3b82f6" : "var(--c-txt4)",
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
                                        background: "linear-gradient(180deg, rgba(59,130,246,0.2), rgba(59,130,246,0.03))",
                                        minHeight: "12px",
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Index + text */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                      className="text-[8px] font-bold"
                                      style={{ fontFamily: F, color: "rgba(59,130,246,0.4)" }}
                                    >
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs leading-relaxed"
                                    style={{ color: "var(--c-txt1)", lineHeight: "1.65", fontFamily: F, fontSize: "13px", fontWeight: 400 }}
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
                          <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "#a855f7" }}>
                            Manipulation Signals
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
                            <span className="text-[10px] font-medium" style={{ fontFamily: F, color: "#ef4444" }}>
                              Flagged Phrases
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
                                <span className="text-[10px] mt-0.5 flex-shrink-0 font-bold" style={{ color: "rgba(239,68,68,0.5)", fontFamily: F }}>
                                  [{String(i + 1).padStart(2, "0")}]
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "#fca5a5", fontFamily: F, textDecoration: "underline", textDecorationColor: "rgba(239,68,68,0.4)", textUnderlineOffset: "3px" }}
                                >
                                  {phrase}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* ── COGNITIVE IMPACT ANALYSIS ────────────────────── */}
                      {(() => {
                        const ext = result as unknown as ExtendedResult;
                        const ci = ext.cognitiveImpact;
                        if (!ci) return null;
                        const activeTechs = ci.techniques.filter(t => t.active).length;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.1 }}
                            className="rounded-xl overflow-hidden"
                            style={{ border: "1px solid rgba(16,185,129,0.18)", background: "rgba(16,185,129,0.02)" }}
                          >
                            {/* Header */}
                            <div className="px-4 py-3 flex items-center justify-between"
                              style={{ borderBottom: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.04)" }}>
                              <div className="flex items-center gap-2">
                                <BrainCircuit className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                                <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "#10b981" }}>
                                  Cognitive Impact
                                </span>
                              </div>
                              <span className="text-[8px] px-2 py-0.5 rounded-full"
                                style={{ fontFamily: F,
                                  color: activeTechs > 2 ? "#ef4444" : activeTechs > 0 ? "#f59e0b" : "#10b981",
                                  background: activeTechs > 2 ? "rgba(239,68,68,0.1)" : activeTechs > 0 ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                                  border: `1px solid ${activeTechs > 2 ? "rgba(239,68,68,0.25)" : activeTechs > 0 ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)"}` }}>
                                {activeTechs} TECHNIQUE{activeTechs !== 1 ? "S" : ""} ACTIVE
                              </span>
                            </div>

                            {/* Brain reaction statement */}
                            <div className="px-4 pt-3 pb-2">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="px-3 py-2.5 rounded-lg mb-3"
                                style={{ background: "rgba(16,185,129,0.06)", borderLeft: "3px solid rgba(16,185,129,0.5)" }}
                              >
                                <p className="text-[9px] mb-1 font-medium" style={{ fontFamily: F, color: "rgba(16,185,129,0.6)" }}>
                                  Brain reaction
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--c-txt1)", fontFamily: F, fontSize: "13px", fontWeight: 400 }}>
                                  {ci.brainReaction}
                                </p>
                              </motion.div>

                              {/* Diagram + technique cards */}
                              <div className="flex gap-3 items-start">
                                {/* Neural diagram */}
                                <div className="flex-shrink-0 w-[110px]">
                                  <NeuralDiagram techniques={ci.techniques} />
                                </div>
                                {/* Technique cards 2×2 */}
                                <div className="flex-1 grid grid-cols-1 gap-1.5">
                                  {ci.techniques.map((tech, i) => (
                                    <CognitiveTechCard key={tech.name} tech={tech} idx={i} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* ── COUNTER TRUTH SUGGESTION ─────────────────────── */}
                      {(() => {
                        const ext = result as unknown as ExtendedResult;
                        if (!ext.counterTruth) return null;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.25 }}
                            className="rounded-xl overflow-hidden"
                            style={{ border: "1px solid rgba(251,191,36,0.18)", background: "rgba(251,191,36,0.02)" }}
                          >
                            {/* Header */}
                            <div className="px-4 py-3 flex items-center justify-between"
                              style={{ borderBottom: "1px solid rgba(251,191,36,0.1)", background: "rgba(251,191,36,0.04)" }}>
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                                <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "#fbbf24" }}>
                                  Counter Truth
                                </span>
                              </div>
                              <span className="text-[8px] px-2 py-0.5 rounded-full"
                                style={{ fontFamily: F, color: "#fbbf24",
                                  background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                                AI REWRITE
                              </span>
                            </div>

                            {/* Rewritten text */}
                            <div className="px-4 py-3">
                              <p className="text-[9px] mb-2 font-medium" style={{ fontFamily: F, color: "rgba(251,191,36,0.45)" }}>
                                Neutral · Factual · Manipulation-free version
                              </p>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.35 }}
                                className="px-3 py-3 rounded-lg"
                                style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}
                              >
                                <Cpu className="w-3 h-3 mb-2" style={{ color: "rgba(251,191,36,0.4)" }} />
                                <p className="text-sm leading-relaxed" style={{ color: "var(--c-txt1)", fontFamily: F, fontSize: "13px", fontWeight: 400, lineHeight: "1.7" }}>
                                  {ext.counterTruth}
                                </p>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* ── EXPLAIN DEEPLY BUTTON ──────────────────────── */}
                      {!explainData && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.45 }}
                        >
                          <motion.button
                            onClick={handleExplainDeeply}
                            disabled={explainLoading}
                            whileHover={!explainLoading ? { scale: 1.015 } : {}}
                            whileTap={!explainLoading ? { scale: 0.985 } : {}}
                            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 relative overflow-hidden"
                            style={{
                              background: "rgba(6,182,212,0.05)",
                              border: `1px solid ${explainLoading ? "rgba(6,182,212,0.18)" : "rgba(6,182,212,0.32)"}`,
                              cursor: explainLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            {/* Shimmer sweep */}
                            {!explainLoading && (
                              <motion.div
                                animate={{ x: ["-100%", "220%"] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                                className="absolute inset-y-0 w-1/3 pointer-events-none"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.1), transparent)" }}
                              />
                            )}
                            {explainLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ border: "1.5px solid rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }}
                                />
                                <span className="text-[10px]" style={{ fontFamily: F, color: "rgba(6,182,212,0.5)" }}>
                                  AI Advisor thinking…
                                </span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
                                <span className="text-[10px] font-semibold" style={{ fontFamily: F, color: "#06b6d4" }}>
                                  Explain Deeply
                                </span>
                                <span className="text-[9px]" style={{ fontFamily: F, color: "rgba(6,182,212,0.5)" }}>
                                  · plain English
                                </span>
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      )}

                      {/* ── EXPLAIN PANEL ──────────────────────────────── */}
                      {explainData && (
                        <div className="space-y-2">
                          <ExplainPanel data={explainData} />
                          {/* Re-analyze button */}
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            onClick={() => { setExplainData(null); }}
                            className="w-full py-2 rounded-lg text-[8px] tracking-[0.15em]"
                            style={{ fontFamily: F, color: "rgba(6,182,212,0.35)",
                              background: "transparent", border: "1px solid rgba(6,182,212,0.08)", cursor: "pointer" }}
                          >
                            ↺ Re-analyze
                          </motion.button>
                        </div>
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
                        <p className="text-xs" style={{ fontFamily: F, color: "var(--c-txt4)" }}>
                          Ready to scan
                        </p>
                        <p className="text-[10px] mt-1" style={{ fontFamily: F, color: "var(--c-border)" }}>
                          Paste text · hit Scan
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
