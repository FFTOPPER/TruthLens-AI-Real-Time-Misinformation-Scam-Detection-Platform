import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GaugeProps {
  score: number;
  className?: string;
}

export function Gauge({ score, className }: GaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);
  const [animatedDashOffset, setAnimatedDashOffset] = useState(0);

  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  const getColor = (s: number) => {
    if (s < 40) return { primary: "#ef4444", glow: "rgba(239, 68, 68, 0.6)", label: "HIGH RISK" };
    if (s < 70) return { primary: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", label: "MEDIUM RISK" };
    return { primary: "#00e5ff", glow: "rgba(0, 229, 255, 0.6)", label: "LOW RISK" };
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentScore(score);
      const offset = circumference - (score / 100) * circumference;
      setAnimatedDashOffset(offset);
    }, 200);
    return () => clearTimeout(timeout);
  }, [score, circumference]);

  const colorInfo = getColor(currentScore);

  return (
    <div className={`relative flex flex-col items-center justify-center gap-4 ${className ?? ""}`} data-testid="score-gauge">
      <div className="relative">
        <svg className="w-52 h-52 -rotate-90" viewBox="0 0 160 160">
          {/* Outer decorative ring */}
          <circle
            cx="80" cy="80" r="76"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Track */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={colorInfo.primary}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedDashOffset}
            style={{
              transition: "stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.8s ease",
              filter: `drop-shadow(0 0 8px ${colorInfo.primary}) drop-shadow(0 0 20px ${colorInfo.glow})`,
            }}
          />
          {/* Glow arc (blurred duplicate) */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={colorInfo.primary}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedDashOffset}
            opacity="0.15"
            style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.8s ease" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <span
              className="text-5xl font-bold tabular-nums"
              style={{
                fontFamily: "'Orbitron', monospace",
                color: colorInfo.primary,
                textShadow: `0 0 20px ${colorInfo.glow}, 0 0 40px ${colorInfo.glow}`,
              }}
            >
              {Math.round(currentScore)}
            </span>
          </motion.div>
          <span
            className="text-[10px] tracking-[0.2em] mt-1"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Risk label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 py-1.5 rounded-full text-xs tracking-[0.2em] font-semibold"
        style={{
          fontFamily: "'Orbitron', monospace",
          color: colorInfo.primary,
          background: `${colorInfo.primary}18`,
          border: `1px solid ${colorInfo.primary}40`,
          boxShadow: `0 0 12px ${colorInfo.glow}`,
        }}
      >
        {colorInfo.label}
      </motion.div>
    </div>
  );
}
