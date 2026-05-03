import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { BarChart3, ShieldAlert, ShieldCheck, AlertTriangle, Database, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
  const r = 52;
  const cx = 64;
  const cy = 64;
  const safe = Math.max(total, 1);

  const segments = [
    { value: low, color: "#00e5ff", glow: "rgba(0,229,255,0.6)", label: "LOW" },
    { value: medium, color: "#f59e0b", glow: "rgba(245,158,11,0.6)", label: "MED" },
    { value: high, color: "#ef4444", glow: "rgba(239,68,68,0.6)", label: "HIGH" },
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
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeDasharray="4 8" />
      ) : (
        segs.map((seg, i) =>
          seg.fraction > 0 ? (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              pathLength={1}
              strokeLinecap="butt"
              initial={{ strokeDasharray: "0 1" }}
              animate={{ strokeDasharray: `${seg.fraction} ${1 - seg.fraction}` }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                strokeDashoffset: -seg.offset,
                transform: `rotate(-90deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                filter: `drop-shadow(0 0 6px ${seg.glow})`,
              }}
            />
          ) : null
        )
      )}
      {/* center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#00e5ff" fontSize="22" fontFamily="'Orbitron', monospace" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="'Space Mono', monospace" letterSpacing="2">
        TOTAL
      </text>
    </svg>
  );
}

/* ─── Score ring ───────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const cx = 52;
  const cy = 52;
  const color = score >= 70 ? "#00e5ff" : score >= 40 ? "#f59e0b" : "#ef4444";
  const glow = score >= 70 ? "rgba(0,229,255,0.5)" : score >= 40 ? "rgba(245,158,11,0.5)" : "rgba(239,68,68,0.5)";

  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        pathLength={1}
        strokeLinecap="round"
        initial={{ strokeDasharray: "0 1" }}
        animate={{ strokeDasharray: `${score / 100} ${1 - score / 100}` }}
        transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          strokeDashoffset: 0,
          transform: "rotate(-90deg)",
          transformOrigin: `${cx}px ${cy}px`,
          filter: `drop-shadow(0 0 8px ${glow})`,
        }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="18" fontFamily="'Orbitron', monospace" fontWeight="bold">
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'Space Mono', monospace" letterSpacing="2">
        AVG SCORE
      </text>
    </svg>
  );
}

/* ─── Bar row ──────────────────────────────────────────────────── */
function Bar({ label, value, max, color, glow, icon: Icon, delay }: {
  label: string; value: number; max: number; color: string; glow: string; icon: React.ElementType; delay: number;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <span className="text-[9px] tracking-[0.15em] truncate" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}>
          {label}
        </span>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay: delay + 0.2, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 8px ${glow}` }}
        />
      </div>
      <span
        className="w-8 text-right text-xs font-bold tabular-nums flex-shrink-0"
        style={{ fontFamily: "'Orbitron', monospace", color, textShadow: `0 0 8px ${glow}` }}
      >
        {value}
      </span>
    </motion.div>
  );
}

/* ─── Manipulation bar ─────────────────────────────────────────── */
function ManipBar({ label, value, color, glow, delay }: { label: string; value: number; color: string; glow: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center">
        <span className="text-[9px] tracking-[0.18em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>{label}</span>
        <span className="text-[10px] font-bold" style={{ fontFamily: "'Orbitron', monospace", color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay: delay + 0.15, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)`, boxShadow: `0 0 6px ${glow}` }}
        />
      </div>
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

  const total = stats?.totalAnalyses ?? 0;
  const avg = stats?.avgCredibilityScore ?? 0;
  const low = stats?.riskDistribution?.Low ?? 0;
  const medium = stats?.riskDistribution?.Medium ?? 0;
  const high = stats?.riskDistribution?.High ?? 0;
  const safeRate = total > 0 ? Math.round((low / total) * 100) : 0;

  // avgManipulation may or may not be in the API response yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manip = (stats as any)?.avgManipulation ?? { fear: 0, urgency: 0, emotionalTriggers: 0, fakeAuthority: 0 };

  const headerGradient = "linear-gradient(90deg, rgba(0,229,255,0.4), rgba(168,85,247,0.3), transparent)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
            <BarChart3 className="w-4 h-4" style={{ color: "#00e5ff" }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}>
            GLOBAL THREAT STATS
          </h2>
        </div>
        <p className="text-xs tracking-widest ml-11"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
          AGGREGATE INTELLIGENCE METRICS
        </p>
        <div className="mt-4" style={{ height: "1px", background: headerGradient }} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
              className="h-32 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── Row 1: Donut + Score Ring + Safe Rate ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.12)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Database className="w-3 h-3" style={{ color: "#00e5ff" }} />
              <span className="text-[10px] tracking-[0.22em]" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
                OVERVIEW
              </span>
            </div>
            <div className="p-5 flex flex-wrap items-center gap-6">
              {/* Donut */}
              <div className="flex flex-col items-center gap-2">
                <DonutChart low={low} medium={medium} high={high} total={total} />
                <div className="flex gap-3">
                  {[
                    { label: "SAFE", color: "#00e5ff" },
                    { label: "MED", color: "#f59e0b" },
                    { label: "HIGH", color: "#ef4444" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                      <span className="text-[8px] tracking-widest" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Score ring */}
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={avg} />
                <span className="text-[8px] tracking-[0.18em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                  CREDIBILITY
                </span>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Safe rate card */}
              <div className="flex-1 min-w-[120px] flex flex-col gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.2em] mb-1" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                    ANALYSES RUN
                  </p>
                  <p className="text-4xl font-bold" style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 16px rgba(0,229,255,0.5)" }}>
                    <AnimatedNumber target={total} duration={1000} />
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] mb-1" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                    SAFE RATE
                  </p>
                  <p className="text-4xl font-bold" style={{ fontFamily: "'Orbitron', monospace", color: "#00ff88", textShadow: "0 0 16px rgba(0,255,136,0.4)" }}>
                    <AnimatedNumber target={safeRate} duration={1200} />%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Row 2: Risk breakdown bars ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <ShieldAlert className="w-3 h-3" style={{ color: "#a855f7" }} />
              <span className="text-[10px] tracking-[0.22em]" style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}>
                RISK DISTRIBUTION
              </span>
            </div>
            <div className="p-5 space-y-4">
              <Bar label="SAFE / LOW" value={low} max={total} color="#00e5ff" glow="rgba(0,229,255,0.4)" icon={ShieldCheck} delay={0.15} />
              <Bar label="MEDIUM RISK" value={medium} max={total} color="#f59e0b" glow="rgba(245,158,11,0.4)" icon={AlertTriangle} delay={0.22} />
              <Bar label="HIGH RISK" value={high} max={total} color="#ef4444" glow="rgba(239,68,68,0.4)" icon={ShieldAlert} delay={0.29} />
            </div>

            {/* Visual blocks */}
            {total > 0 && (
              <div className="px-5 pb-5">
                <div className="flex rounded-lg overflow-hidden h-3 gap-0.5">
                  {low > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: low }}
                      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                      style={{ background: "linear-gradient(90deg, #00e5ff, #00b4cc)", boxShadow: "0 0 12px rgba(0,229,255,0.4)" }}
                    />
                  )}
                  {medium > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: medium }}
                      transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                      style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)", boxShadow: "0 0 12px rgba(245,158,11,0.4)" }}
                    />
                  )}
                  {high > 0 && (
                    <motion.div
                      className="h-full"
                      initial={{ flex: 0 }}
                      animate={{ flex: high }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      style={{ background: "linear-gradient(90deg, #ef4444, #dc2626)", boxShadow: "0 0 12px rgba(239,68,68,0.4)" }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>SAFEST</span>
                  <span className="text-[8px]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>MOST DANGEROUS</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Row 3: Manipulation breakdown averages ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.12)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" style={{ color: "#f97316" }} />
                <span className="text-[10px] tracking-[0.22em]" style={{ fontFamily: "'Space Mono', monospace", color: "#f97316" }}>
                  AVG MANIPULATION VECTORS
                </span>
              </div>
              <span className="text-[8px] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
                0–100 INTENSITY
              </span>
            </div>
            <div className="p-5 space-y-4">
              <ManipBar label="FEAR TACTICS" value={manip.fear} color="#ef4444" glow="rgba(239,68,68,0.4)" delay={0.25} />
              <ManipBar label="URGENCY / FOMO" value={manip.urgency} color="#f97316" glow="rgba(249,115,22,0.4)" delay={0.3} />
              <ManipBar label="EMOTIONAL TRIGGERS" value={manip.emotionalTriggers} color="#a855f7" glow="rgba(168,85,247,0.4)" delay={0.35} />
              <ManipBar label="FAKE AUTHORITY" value={manip.fakeAuthority} color="#f59e0b" glow="rgba(245,158,11,0.4)" delay={0.4} />
            </div>
            {total === 0 && (
              <div className="px-5 pb-5">
                <p className="text-[9px] tracking-[0.15em] text-center py-3"
                  style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.18)", borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
                  RUN ANALYSES TO SEE MANIPULATION AVERAGES
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Row 4: Individual stat callouts ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: "SAFE SCANS", value: low, color: "#00e5ff", glow: "rgba(0,229,255,0.3)", bg: "rgba(0,229,255,0.05)", border: "rgba(0,229,255,0.15)" },
              { icon: AlertTriangle, label: "MEDIUM", value: medium, color: "#f59e0b", glow: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.15)" },
              { icon: ShieldAlert, label: "HIGH RISK", value: high, color: "#ef4444", glow: "rgba(239,68,68,0.3)", bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.15)" },
            ].map(({ icon: Icon, label, value, color, glow, bg, border }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 260 }}
                whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl"
                style={{ background: bg, border: `1px solid ${border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${glow}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <Icon className="w-5 h-5" style={{ color, opacity: 0.8 }} />
                <motion.p
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'Orbitron', monospace", color, textShadow: `0 0 16px ${glow}` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, delay: 0.35 + i * 0.08 }}
                >
                  {value}
                </motion.p>
                <span className="text-[8px] tracking-[0.18em] text-center"
                  style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.28)" }}>
                  {label}
                </span>
                {total > 0 && (
                  <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / total) * 100}%` }}
                      transition={{ duration: 1.1, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                      style={{ background: color, boxShadow: `0 0 6px ${glow}` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* ── Activity badge ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 justify-center py-2"
          >
            <Activity className="w-3 h-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <span className="text-[8px] tracking-[0.25em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.15)" }}>
              LIVE · REFRESHES EVERY 10s · {total} SIGNAL{total !== 1 ? "S" : ""} CATALOGUED
            </span>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
}
