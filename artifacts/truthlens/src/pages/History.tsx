import { useGetAnalysisHistory, getGetAnalysisHistoryQueryKey } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Globe, AlertTriangle, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const F = "Inter, system-ui, sans-serif";

function riskConfig(level: string) {
  if (level === "High") return {
    text: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)",
    label: "HIGH", icon: ShieldAlert,
  };
  if (level === "Medium") return {
    text: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)",
    label: "MED", icon: AlertTriangle,
  };
  return {
    text: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)",
    label: "SAFE", icon: ShieldCheck,
  };
}

type ManipulationBreakdown = {
  fear: number; urgency: number; emotionalTriggers: number; fakeAuthority: number;
};

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: color }}
      />
    </div>
  );
}

function ManipulationMini({ breakdown }: { breakdown: ManipulationBreakdown }) {
  const bars = [
    { label: "Fear",      value: breakdown.fear,             color: "#ef4444" },
    { label: "Urgency",   value: breakdown.urgency,          color: "#f97316" },
    { label: "Emotion",   value: breakdown.emotionalTriggers, color: "#a855f7" },
    { label: "Authority", value: breakdown.fakeAuthority,    color: "#f59e0b" },
  ];
  return (
    <div className="flex items-center gap-2 mt-2.5">
      {bars.map(b => (
        <div key={b.label} className="flex-1 flex flex-col gap-0.5">
          <span style={{ fontFamily: F, fontSize: "9px", fontWeight: 500, color: "rgba(255,255,255,0.25)" }}>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <Globe className="w-4 h-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: F, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
                Scan History
              </h2>
              <p style={{ fontFamily: F, fontSize: "12px", color: "#475569", marginTop: "1px" }}>
                All analyzed content, sorted by recency
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.16)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
            <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#22c55e" }}>
              Live
            </span>
          </div>
        </div>
        <div className="mt-4" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: `pulse ${1.4 + i * 0.15}s ease infinite`,
              }}
            />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl gap-4"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.1)" }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
          >
            <Globe className="w-6 h-6" style={{ color: "rgba(255,255,255,0.18)" }} />
          </div>
          <div className="text-center">
            <p style={{ fontFamily: F, fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.32)" }}>
              No scan history yet
            </p>
            <p style={{ fontFamily: F, fontSize: "12px", color: "rgba(255,255,255,0.16)", marginTop: "4px" }}>
              Start scanning to build your intelligence feed
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151" }}>
              {history.length} record{history.length !== 1 ? "s" : ""}
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
                  initial={{ opacity: 0, y: -8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, delay: i < 6 ? i * 0.04 : 0 }}
                  className="group rounded-xl relative overflow-hidden cursor-default"
                  style={{
                    background: "#161b27",
                    border: `1px solid ${cfg.border}`,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = cfg.text + "38";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = cfg.border;
                  }}
                  data-testid={`card-history-record-${record.id}`}
                >
                  {/* Left accent bar */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: cfg.text }}
                    initial={{ scaleY: 0, originY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  />

                  <div className="flex items-start gap-4 px-5 py-4 relative">
                    {/* Score circle */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        fontFamily: F,
                        fontSize: "15px",
                        fontWeight: 700,
                        color: cfg.text,
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                      }}
                    >
                      {Math.round(record.credibilityScore)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        {/* Risk badge */}
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                          style={{
                            fontFamily: F,
                            fontSize: "10px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
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
                          <Clock className="w-2.5 h-2.5" style={{ color: "#374151" }} />
                          <span
                            className="tabular-nums"
                            style={{ fontFamily: F, fontSize: "10px", color: "#374151", fontWeight: 400 }}
                          >
                            {relativeTime}
                          </span>
                        </div>
                      </div>

                      {/* Text snippet */}
                      <p
                        className="line-clamp-2"
                        style={{
                          fontFamily: F,
                          color: "#6b7280",
                          fontSize: "12px",
                          lineHeight: "1.6",
                          borderLeft: `2px solid ${cfg.border}`,
                          paddingLeft: "8px",
                        }}
                      >
                        {record.textSnippet}
                      </p>

                      {breakdown && <ManipulationMini breakdown={breakdown} />}
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
