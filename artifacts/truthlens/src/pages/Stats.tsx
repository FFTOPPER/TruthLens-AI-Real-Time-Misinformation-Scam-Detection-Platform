import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { BarChart3, ShieldAlert, ShieldCheck, AlertTriangle, Database, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const F = "Inter, system-ui, sans-serif";

/* ─── Animated counter ─────────────────────────────────────────── */
function AnimatedNumber({ target, decimals = 0, duration = 1200 }: { target: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <>{display.toFixed(decimals)}</>;
}

/* ─── Donut chart ──────────────────────────────────────────────── */
function DonutChart({ low, medium, high, total }: { low: number; medium: number; high: number; total: number }) {
  const r = 52, cx = 64, cy = 64;
  const safe = Math.max(total, 1);

  const segments = [
    { value: low,    color: "#22c55e", label: "SAFE" },
    { value: medium, color: "#f59e0b", label: "MED"  },
    { value: high,   color: "#ef4444", label: "HIGH" },
  ];

  let offset = 0;
  const segs = segments.map(s => {
    const fraction = s.value / safe;
    const result = { ...s, fraction, offset };
    offset += fraction;
    return result;
  });

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13" />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="13" strokeDasharray="4 8" />
      ) : (
        segs.map((seg, i) =>
          seg.fraction > 0 ? (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="13"
              pathLength={1}
              strokeLinecap="butt"
              initial={{ strokeDasharray: "0 1" }}
              animate={{ strokeDasharray: `${seg.fraction} ${1 - seg.fraction}` }}
              transition={{ duration: 1.1, delay: i * 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                strokeDashoffset: -seg.offset,
                transform: `rotate(-90deg)`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          ) : null
        )
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#3b82f6" fontSize="22" fontFamily="Inter, system-ui, sans-serif" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">
        TOTAL
      </text>
    </svg>
  );
}

/* ─── Score ring ───────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 38, cx = 52, cy = 52;
  const color = score >= 70 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        pathLength={1}
        strokeLinecap="round"
        initial={{ strokeDasharray: "0 1" }}
        animate={{ strokeDasharray: `${score / 100} ${1 - score / 100}` }}
        transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          strokeDashoffset: 0,
          transform: "rotate(-90deg)",
          transformOrigin: `${cx}px ${cy}px`,
        }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="18" fontFamily="Inter, system-ui, sans-serif" fontWeight="bold">
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="7" fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">
        AVG SCORE
      </text>
    </svg>
  );
}

/* ─── Bar row ──────────────────────────────────────────────────── */
function Bar({ label, value, max, color, icon: Icon, delay }: {
  label: string; value: number; max: number; color: string; icon: React.ElementType; delay: number;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color, opacity: 0.7 }} />
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#6b7280", truncate: true }}>
          {label}
        </span>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, delay: delay + 0.2, ease: "easeOut" }}
          style={{ background: color, opacity: 0.85 }}
        />
      </div>
      <span
        className="w-8 text-right text-xs font-bold tabular-nums flex-shrink-0"
        style={{ fontFamily: F, fontWeight: 700, color }}
      >
        {value}
      </span>
    </motion.div>
  );
}

/* ─── Manipulation bar ─────────────────────────────────────────── */
function ManipBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center">
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>{label}</span>
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 700, color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, delay: delay + 0.12, ease: "easeOut" }}
          style={{ background: color, opacity: 0.85 }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Card shell ───────────────────────────────────────────────── */
function Card({
  icon: Icon, color, title, children, delay = 0,
}: {
  icon: React.ElementType; color: string; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl overflow-hidden"
      style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color, opacity: 0.8 }} />
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", color: "#6b7280", textTransform: "uppercase" as const }}>
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Stats() {
  const { data: stats, isLoading } = useGetAnalysisStats({
    query: {
      queryKey: getGetAnalysisStatsQueryKey(),
      refetchInterval: 10000,
      staleTime: 5000,
    },
  });

  const total  = stats?.totalAnalyses ?? 0;
  const avg    = stats?.avgCredibilityScore ?? 0;
  const low    = stats?.riskDistribution?.Low ?? 0;
  const medium = stats?.riskDistribution?.Medium ?? 0;
  const high   = stats?.riskDistribution?.High ?? 0;
  const safeRate = total > 0 ? Math.round((low / total) * 100) : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manip = (stats as any)?.avgManipulation ?? { fear: 0, urgency: 0, emotionalTriggers: 0, fakeAuthority: 0 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <BarChart3 className="w-4 h-4" style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: F, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              Global Intelligence
            </h2>
            <p style={{ fontFamily: F, fontSize: "12px", color: "#475569", marginTop: "1px" }}>
              Aggregate threat metrics across all scans
            </p>
          </div>
        </div>
        <div className="mt-4" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}
              className="h-32 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", animation: `pulse ${1.4 + i * 0.15}s ease infinite` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">

          {/* Row 1: Overview */}
          <Card icon={Database} color="#3b82f6" title="Overview" delay={0.04}>
            <div className="p-5 flex flex-wrap items-center gap-6">
              {/* Donut */}
              <div className="flex flex-col items-center gap-3">
                <DonutChart low={low} medium={medium} high={high} total={total} />
                <div className="flex gap-3">
                  {[
                    { label: "Safe",   color: "#22c55e" },
                    { label: "Medium", color: "#f59e0b" },
                    { label: "High",   color: "#ef4444" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#6b7280" }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden sm:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Score ring */}
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={avg} />
                <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#6b7280" }}>
                  Credibility
                </span>
              </div>

              <div className="hidden sm:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Stat numbers */}
              <div className="flex-1 min-w-[120px] flex flex-col gap-4">
                <div>
                  <p style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151", letterSpacing: "0.03em", marginBottom: "4px" }}>
                    ANALYSES RUN
                  </p>
                  <p style={{ fontFamily: F, fontSize: "36px", fontWeight: 800, color: "#3b82f6", lineHeight: 1 }}>
                    <AnimatedNumber target={total} duration={1000} />
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151", letterSpacing: "0.03em", marginBottom: "4px" }}>
                    SAFE RATE
                  </p>
                  <p style={{ fontFamily: F, fontSize: "36px", fontWeight: 800, color: "#22c55e", lineHeight: 1 }}>
                    <AnimatedNumber target={safeRate} duration={1200} />%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Row 2: Risk distribution */}
          <Card icon={ShieldAlert} color="#f59e0b" title="Risk Distribution" delay={0.1}>
            <div className="p-5 space-y-4">
              <Bar label="Safe / Low"   value={low}    max={total} color="#22c55e" icon={ShieldCheck}  delay={0.14} />
              <Bar label="Medium Risk"  value={medium} max={total} color="#f59e0b" icon={AlertTriangle} delay={0.2}  />
              <Bar label="High Risk"    value={high}   max={total} color="#ef4444" icon={ShieldAlert}   delay={0.26} />
            </div>

            {total > 0 && (
              <div className="px-5 pb-5">
                <div className="flex rounded-lg overflow-hidden h-2.5 gap-0.5">
                  {low > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: low }}
                      transition={{ duration: 1.1, delay: 0.38, ease: "easeOut" }}
                      style={{ background: "#22c55e", opacity: 0.8 }}
                    />
                  )}
                  {medium > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: medium }}
                      transition={{ duration: 1.1, delay: 0.48, ease: "easeOut" }}
                      style={{ background: "#f59e0b", opacity: 0.8 }}
                    />
                  )}
                  {high > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: high }}
                      transition={{ duration: 1.1, delay: 0.56, ease: "easeOut" }}
                      style={{ background: "#ef4444", opacity: 0.8 }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#374151" }}>Safest</span>
                  <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#374151" }}>Most Dangerous</span>
                </div>
              </div>
            )}
          </Card>

          {/* Row 3: Manipulation averages */}
          <Card icon={Zap} color="#f97316" title="Avg Manipulation Vectors" delay={0.16}>
            <div className="p-5 space-y-4">
              <ManipBar label="Fear Tactics"        value={manip.fear}             color="#ef4444" delay={0.22} />
              <ManipBar label="Urgency / FOMO"      value={manip.urgency}          color="#f97316" delay={0.27} />
              <ManipBar label="Emotional Triggers"  value={manip.emotionalTriggers} color="#a855f7" delay={0.32} />
              <ManipBar label="Fake Authority"      value={manip.fakeAuthority}    color="#f59e0b" delay={0.37} />
            </div>
            {total === 0 && (
              <div className="px-5 pb-5">
                <p style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151", textAlign: "center", paddingTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
                  Run analyses to see manipulation averages
                </p>
              </div>
            )}
          </Card>

          {/* Row 4: Stat callouts */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck,  label: "Safe Scans", value: low,    color: "#22c55e", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.14)"  },
              { icon: AlertTriangle,label: "Medium",     value: medium, color: "#f59e0b", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.14)" },
              { icon: ShieldAlert,  label: "High Risk",  value: high,   color: "#ef4444", bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.14)"  },
            ].map(({ icon: Icon, label, value, color, bg, border }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28 + i * 0.07, type: "spring", stiffness: 280 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <Icon className="w-4 h-4" style={{ color, opacity: 0.75 }} />
                <motion.p
                  style={{ fontFamily: F, fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.33 + i * 0.07 }}
                >
                  {value}
                </motion.p>
                <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#6b7280", textAlign: "center" as const }}>
                  {label}
                </span>
                {total > 0 && (
                  <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / total) * 100}%` }}
                      transition={{ duration: 1.0, delay: 0.45 + i * 0.07, ease: "easeOut" }}
                      style={{ background: color }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Activity badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48 }}
            className="flex items-center gap-2 justify-center py-2"
          >
            <Activity className="w-3 h-3" style={{ color: "#374151" }} />
            <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, color: "#374151" }}>
              Live · refreshes every 10s · {total} signal{total !== 1 ? "s" : ""} catalogued
            </span>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
}
