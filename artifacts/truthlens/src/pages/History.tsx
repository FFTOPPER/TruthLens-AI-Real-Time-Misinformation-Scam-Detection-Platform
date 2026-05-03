import { useGetAnalysisHistory, getGetAnalysisHistoryQueryKey } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Globe, AlertTriangle, ShieldCheck, ShieldAlert, Clock, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function riskConfig(level: string) {
  if (level === "High") return {
    text: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)",
    glow: "rgba(239,68,68,0.3)", label: "HIGH", icon: ShieldAlert,
  };
  if (level === "Medium") return {
    text: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.3)", label: "MEDIUM", icon: AlertTriangle,
  };
  return {
    text: "#00ff88", bg: "rgba(0,255,136,0.06)", border: "rgba(0,255,136,0.2)",
    glow: "rgba(0,255,136,0.25)", label: "SAFE", icon: ShieldCheck,
  };
}

type ManipulationBreakdown = {
  fear: number;
  urgency: number;
  emotionalTriggers: number;
  fakeAuthority: number;
};

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
      />
    </div>
  );
}

function ManipulationMini({ breakdown }: { breakdown: ManipulationBreakdown }) {
  const bars = [
    { label: "FEAR", value: breakdown.fear, color: "#ef4444" },
    { label: "URGENCY", value: breakdown.urgency, color: "#f97316" },
    { label: "EMOTION", value: breakdown.emotionalTriggers, color: "#a855f7" },
    { label: "AUTHORITY", value: breakdown.fakeAuthority, color: "#f59e0b" },
  ];
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {bars.map(b => (
        <div key={b.label} className="flex-1 flex flex-col gap-0.5">
          <span className="text-[7px] tracking-widest" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
            {b.label}
          </span>
          <MiniBar value={b.value} color={b.color} />
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const { data: history, isLoading } = useGetAnalysisHistory({
    query: {
      queryKey: getGetAnalysisHistoryQueryKey(),
      refetchInterval: 8000,
      staleTime: 4000,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}
            >
              <Globe className="w-4 h-4" style={{ color: "#00e5ff" }} />
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
            >
              GLOBAL INTELLIGENCE FEED
            </h2>
          </div>

          {/* Live indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <Radio className="w-2.5 h-2.5" style={{ color: "#00e5ff" }} />
            <span className="text-[9px] tracking-[0.2em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
              LIVE
            </span>
          </div>
        </div>
        <p className="text-xs tracking-widest ml-11" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
          REAL-TIME RECORD OF ALL EVALUATED TRANSMISSIONS
        </p>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(0,229,255,0.4), rgba(168,85,247,0.3), transparent)" }} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
              className="h-28 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
            />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-xl gap-5"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(0,229,255,0.15)" }}
        >
          <motion.div
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.05, 1] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ border: "1px solid rgba(0,229,255,0.18)", background: "rgba(0,229,255,0.04)" }}
          >
            <Globe className="w-7 h-7" style={{ color: "rgba(0,229,255,0.35)" }} />
          </motion.div>
          <div className="text-center space-y-1">
            <p className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
              No global intelligence yet.
            </p>
            <p className="text-xs tracking-[0.18em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
              START SCANNING TO BUILD INSIGHTS
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
              {history.length} RECORD{history.length !== 1 ? "S" : ""} · SORTED BY RECENCY
            </span>
          </div>

          <AnimatePresence initial={false}>
            {history.map((record, i) => {
              const cfg = riskConfig(record.riskLevel);
              const RiskIcon = cfg.icon;
              let relativeTime = "";
              try {
                relativeTime = formatDistanceToNow(new Date(record.analyzedAt), { addSuffix: true });
              } catch {
                relativeTime = record.analyzedAt;
              }

              let breakdown: ManipulationBreakdown | null = null;
              try {
                const raw = record.manipulationBreakdown as unknown;
                if (raw && typeof raw === "object") {
                  breakdown = raw as ManipulationBreakdown;
                }
              } catch { /* skip */ }

              return (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: i < 5 ? i * 0.05 : 0 }}
                  className="group rounded-xl relative overflow-hidden cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${cfg.border}`,
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = `0 0 28px ${cfg.glow}`;
                    el.style.borderColor = cfg.text + "55";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = "none";
                    el.style.borderColor = cfg.border;
                  }}
                  data-testid={`card-history-record-${record.id}`}
                >
                  {/* Left accent bar */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: `linear-gradient(180deg, ${cfg.text}, transparent 80%)` }}
                    initial={{ scaleY: 0, originY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  />

                  {/* Subtle bg glow */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
                    style={{ background: `linear-gradient(270deg, ${cfg.bg}, transparent)` }}
                  />

                  <div className="flex items-start gap-4 px-5 py-4 relative">
                    {/* Score circle */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        color: cfg.text,
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        boxShadow: `0 0 14px ${cfg.glow}`,
                        textShadow: `0 0 8px ${cfg.text}`,
                      }}
                    >
                      {Math.round(record.credibilityScore)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        {/* Risk badge */}
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "9px",
                            letterSpacing: "0.18em",
                            color: cfg.text,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          <RiskIcon className="w-2.5 h-2.5" />
                          <span>{cfg.label} RISK</span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.2)" }} />
                          <span
                            className="text-[9px] tabular-nums"
                            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.28)" }}
                          >
                            {relativeTime}
                          </span>
                        </div>
                      </div>

                      {/* Text snippet */}
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          color: "rgba(255,255,255,0.38)",
                          fontSize: "10px",
                          lineHeight: "1.7",
                          borderLeft: `2px solid ${cfg.border}`,
                          paddingLeft: "8px",
                        }}
                      >
                        {record.textSnippet}
                      </p>

                      {/* Mini manipulation bars */}
                      {breakdown && (
                        <ManipulationMini breakdown={breakdown} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
