import { useGetAnalysisHistory, getGetAnalysisHistoryQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { History as HistoryIcon, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function riskColor(level: string) {
  if (level === "High") return { text: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)", glow: "rgba(239, 68, 68, 0.3)" };
  if (level === "Medium") return { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", glow: "rgba(245, 158, 11, 0.3)" };
  return { text: "#00e5ff", bg: "rgba(0, 229, 255, 0.06)", border: "rgba(0, 229, 255, 0.2)", glow: "rgba(0, 229, 255, 0.3)" };
}

export default function History() {
  const { data: history, isLoading } = useGetAnalysisHistory({
    query: { queryKey: getGetAnalysisHistoryQueryKey() }
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
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
          >
            <HistoryIcon className="w-4 h-4" style={{ color: "#a855f7" }} />
          </div>
          <h2
            className="text-2xl font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#a855f7", textShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
          >
            INTELLIGENCE LOGS
          </h2>
        </div>
        <p
          className="text-xs tracking-widest ml-11"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
        >
          HISTORICAL RECORD OF EVALUATED TRANSMISSIONS
        </p>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(168, 85, 247, 0.4), rgba(0, 229, 255, 0.2), transparent)" }} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="h-24 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-xl gap-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(168, 85, 247, 0.2)" }}
        >
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ border: "1px solid rgba(168, 85, 247, 0.2)", background: "rgba(168, 85, 247, 0.04)" }}
          >
            <HistoryIcon className="w-7 h-7" style={{ color: "rgba(168, 85, 247, 0.4)" }} />
          </motion.div>
          <p
            className="text-xs tracking-[0.2em]"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}
          >
            NO RECORDS FOUND · INITIATE A SCAN FIRST
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {history.map((record, i) => {
              const color = riskColor(record.riskLevel);
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="group rounded-xl relative overflow-hidden cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${color.border}`,
                    transition: "box-shadow 0.2s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${color.glow}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  data-testid={`card-history-record-${record.id}`}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: `linear-gradient(180deg, ${color.text}, transparent)` }}
                  />

                  <div className="flex items-center gap-5 px-6 py-4">
                    {/* Score circle */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        color: color.text,
                        background: color.bg,
                        border: `2px solid ${color.border}`,
                        boxShadow: `0 0 16px ${color.glow}`,
                        textShadow: `0 0 10px ${color.text}`,
                      }}
                    >
                      {Math.round(record.credibilityScore)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.15em] font-semibold"
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            color: color.text,
                            background: color.bg,
                            border: `1px solid ${color.border}`,
                          }}
                        >
                          {record.riskLevel === "High" && <AlertTriangle className="w-2.5 h-2.5 mr-1 inline" />}
                          {record.riskLevel === "Low" && <ShieldCheck className="w-2.5 h-2.5 mr-1 inline" />}
                          {record.riskLevel.toUpperCase()} RISK
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Clock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                          <span
                            className="text-[10px] tabular-nums"
                            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}
                          >
                            {format(new Date(record.analyzedAt), "yyyy-MM-dd HH:mm")}
                          </span>
                        </div>
                      </div>
                      <p
                        className="text-xs truncate"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          color: "rgba(255,255,255,0.4)",
                          borderLeft: "2px solid rgba(255,255,255,0.08)",
                          paddingLeft: "10px",
                        }}
                      >
                        "{record.textSnippet}"
                      </p>
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
