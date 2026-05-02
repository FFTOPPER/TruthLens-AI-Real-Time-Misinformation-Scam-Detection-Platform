import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { BarChart3, ShieldAlert, Activity, Database, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  glow,
  delay,
  testId,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  glow: string;
  delay: number;
  testId?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="rounded-xl relative overflow-hidden p-6"
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${glow.replace("0.4", "0.2")}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${glow}, inset 0 0 30px ${glow.replace("0.4", "0.05")}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Decorative gradient */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glow.replace("0.4", "0.08")} 0%, transparent 70%)` }}
      />

      <div className="flex items-start gap-4 relative z-10">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${glow.replace("0.4", "0.1")}`, border: `1px solid ${glow.replace("0.4", "0.3")}` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p
            className="text-[10px] tracking-[0.2em] mb-2"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
          >
            {label}
          </p>
          <motion.p
            key={String(value)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: delay + 0.1 }}
            className="text-5xl font-bold tabular-nums"
            style={{
              fontFamily: "'Orbitron', monospace",
              color,
              textShadow: `0 0 20px ${glow}, 0 0 40px ${glow.replace("0.4", "0.2")}`,
            }}
            data-testid={testId}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const { data: stats, isLoading } = useGetAnalysisStats({
    query: { queryKey: getGetAnalysisStatsQueryKey() }
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
            style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.3)" }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: "#00e5ff" }} />
          </div>
          <h2
            className="text-2xl font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0, 229, 255, 0.5)" }}
          >
            THREAT METRICS
          </h2>
        </div>
        <p
          className="text-xs tracking-widest ml-11"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
        >
          AGGREGATE INTELLIGENCE DATA
        </p>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(0, 229, 255, 0.4), rgba(168, 85, 247, 0.4), transparent)" }} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              className="h-36 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            />
          ))}
        </div>
      ) : !stats || stats.totalAnalyses === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-xl gap-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(0, 229, 255, 0.15)" }}
        >
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ border: "1px solid rgba(0, 229, 255, 0.15)", background: "rgba(0, 229, 255, 0.03)" }}
          >
            <Database className="w-7 h-7" style={{ color: "rgba(0, 229, 255, 0.3)" }} />
          </motion.div>
          <p
            className="text-xs tracking-[0.2em]"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}
          >
            INSUFFICIENT DATA · RUN ANALYSIS FIRST
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Top stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              icon={Database}
              label="TOTAL TRANSMISSIONS ANALYZED"
              value={stats.totalAnalyses}
              color="#00e5ff"
              glow="rgba(0, 229, 255, 0.4)"
              delay={0.05}
              testId="text-total-analyses"
            />
            <StatCard
              icon={Activity}
              label="AVG CREDIBILITY INDEX"
              value={Math.round(stats.avgCredibilityScore)}
              color={stats.avgCredibilityScore < 40 ? "#ef4444" : stats.avgCredibilityScore < 70 ? "#f59e0b" : "#00e5ff"}
              glow={stats.avgCredibilityScore < 40 ? "rgba(239, 68, 68, 0.4)" : stats.avgCredibilityScore < 70 ? "rgba(245, 158, 11, 0.4)" : "rgba(0, 229, 255, 0.4)"}
              delay={0.1}
              testId="text-avg-score"
            />
          </div>

          {/* Risk distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="px-6 py-4 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
            >
              <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
              <span
                className="text-[11px] tracking-[0.25em]"
                style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}
              >
                RISK DISTRIBUTION MATRIX
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  label: "LOW RISK",
                  value: stats.riskDistribution.Low,
                  color: "#00e5ff",
                  bg: "rgba(0, 229, 255, 0.06)",
                  border: "rgba(0, 229, 255, 0.2)",
                  glow: "rgba(0, 229, 255, 0.3)",
                },
                {
                  icon: AlertTriangle,
                  label: "MEDIUM RISK",
                  value: stats.riskDistribution.Medium,
                  color: "#f59e0b",
                  bg: "rgba(245, 158, 11, 0.06)",
                  border: "rgba(245, 158, 11, 0.2)",
                  glow: "rgba(245, 158, 11, 0.3)",
                },
                {
                  icon: ShieldAlert,
                  label: "HIGH RISK",
                  value: stats.riskDistribution.High,
                  color: "#ef4444",
                  bg: "rgba(239, 68, 68, 0.06)",
                  border: "rgba(239, 68, 68, 0.2)",
                  glow: "rgba(239, 68, 68, 0.3)",
                },
              ].map(({ icon: Icon, label, value, color, bg, border, glow }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl relative overflow-hidden"
                  style={{ background: bg, border: `1px solid ${border}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${glow}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <Icon className="w-8 h-8" style={{ color, opacity: 0.7 }} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.35 + i * 0.1 }}
                    className="text-4xl font-bold"
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      color,
                      textShadow: `0 0 20px ${glow}`,
                    }}
                  >
                    {value}
                  </motion.div>
                  <span
                    className="text-[10px] tracking-[0.2em]"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
                  >
                    {label}
                  </span>

                  {/* Percentage bar */}
                  {stats.totalAnalyses > 0 && (
                    <div className="w-full rounded-full overflow-hidden h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(value / stats.totalAnalyses) * 100}%` }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: color, boxShadow: `0 0 8px ${glow}` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
