import { motion } from "framer-motion";
import {
  Settings, ShieldAlert, Cpu, Database, Globe,
  Zap, Eye, Bell, Lock, Info, CheckCircle,
} from "lucide-react";
import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";

function ToggleSwitch({ enabled, label, sub }: { enabled: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)" }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.22)", marginTop: "2px" }}>
            {sub}
          </p>
        )}
      </div>
      <div
        className="relative flex-shrink-0"
        style={{
          width: 38,
          height: 20,
          borderRadius: 10,
          background: enabled ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.06)",
          border: enabled ? "1px solid rgba(0,229,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: enabled ? "0 0 12px rgba(0,229,255,0.2)" : "none",
          transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
        }}
      >
        <motion.div
          animate={{ x: enabled ? 19 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            position: "absolute",
            top: 2,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: enabled ? "#00e5ff" : "rgba(255,255,255,0.3)",
            boxShadow: enabled ? "0 0 8px rgba(0,229,255,0.6)" : "none",
          }}
        />
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color = "#00e5ff",
  borderColor = "rgba(0,229,255,0.12)",
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
  borderColor?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${borderColor}`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.22em", color }}>{title}</span>
      </div>
      <div className="px-5 py-1">{children}</div>
    </motion.div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "11px",
          fontWeight: 600,
          color: accent ?? "rgba(255,255,255,0.6)",
          textShadow: accent ? `0 0 10px ${accent}55` : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const { data: stats } = useGetAnalysisStats({
    query: { queryKey: getGetAnalysisStatsQueryKey() },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}
          >
            <Settings className="w-4 h-4" style={{ color: "#a855f7" }} />
          </div>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}
          >
            SYSTEM CONFIG
          </h2>
        </div>
        <p className="text-xs tracking-widest ml-11"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.28)" }}>
          CONTROL PANEL · OPERATOR SETTINGS
        </p>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(168,85,247,0.4), rgba(0,229,255,0.3), transparent)" }} />
      </div>

      {/* ── AI Engine ── */}
      <Section icon={Cpu} title="AI ENGINE" color="#00e5ff" borderColor="rgba(0,229,255,0.12)" delay={0.06}>
        <InfoRow label="MODEL" value="GPT-5 MINI" accent="#00e5ff" />
        <InfoRow label="PROVIDER" value="OPENAI" accent="#00e5ff" />
        <InfoRow label="MAX TOKENS" value="1024" />
        <InfoRow label="ANALYSIS MODE" value="DEEP SCAN" accent="#a855f7" />
        <InfoRow label="RESPONSE FORMAT" value="JSON STRICT" />
      </Section>

      {/* ── Display ── */}
      <Section icon={Eye} title="DISPLAY PREFERENCES" color="#a855f7" borderColor="rgba(168,85,247,0.12)" delay={0.1}>
        <ToggleSwitch enabled label="Animated background orbs" sub="PERFORMANCE · GPU RENDERING" />
        <ToggleSwitch enabled label="3D Trust Orb visualizer" sub="WEBGL · REQUIRES GPU CONTEXT" />
        <ToggleSwitch enabled label="Smooth page transitions" sub="FRAMER MOTION · ANIMATION ENGINE" />
        <ToggleSwitch enabled={false} label="High contrast mode" sub="ACCESSIBILITY · WCAG 2.1" />
      </Section>

      {/* ── Notifications ── */}
      <Section icon={Bell} title="ALERTS & NOTIFICATIONS" color="#f59e0b" borderColor="rgba(245,158,11,0.12)" delay={0.14}>
        <ToggleSwitch enabled label="High-risk scan alerts" sub="REAL-TIME THREAT NOTIFICATION" />
        <ToggleSwitch enabled label="Voice TTS readouts" sub="WEB SPEECH API · BROWSER NATIVE" />
        <ToggleSwitch enabled={false} label="Sound effects on analysis" sub="AUDIO FEEDBACK · OPTIONAL" />
      </Section>

      {/* ── Privacy ── */}
      <Section icon={Lock} title="PRIVACY & DATA" color="#ef4444" borderColor="rgba(239,68,68,0.12)" delay={0.18}>
        <ToggleSwitch enabled label="Store scan history" sub="POSTGRESQL · PERSISTENT STORAGE" />
        <ToggleSwitch enabled label="Aggregate to global feed" sub="ANONYMISED · COMMUNITY INTELLIGENCE" />
        <ToggleSwitch enabled={false} label="Share anonymised data" sub="RESEARCH · DISABLED BY DEFAULT" />
      </Section>

      {/* ── System Stats ── */}
      <Section icon={Database} title="SESSION STATISTICS" color="#00ff88" borderColor="rgba(0,255,136,0.1)" delay={0.22}>
        <InfoRow label="TOTAL ANALYSES RUN" value={String(stats?.totalAnalyses ?? 0)} accent="#00e5ff" />
        <InfoRow label="AVG CREDIBILITY SCORE" value={stats ? `${Math.round(stats.avgCredibilityScore)}/100` : "—"} accent="#00e5ff" />
        <InfoRow label="SAFE TRANSMISSIONS" value={String(stats?.riskDistribution?.Low ?? 0)} accent="#00ff88" />
        <InfoRow label="MEDIUM RISK" value={String(stats?.riskDistribution?.Medium ?? 0)} accent="#f59e0b" />
        <InfoRow label="HIGH RISK" value={String(stats?.riskDistribution?.High ?? 0)} accent="#ef4444" />
      </Section>

      {/* ── About ── */}
      <Section icon={Info} title="ABOUT TRUTHLENS" color="#a855f7" borderColor="rgba(168,85,247,0.12)" delay={0.26}>
        <InfoRow label="VERSION" value="0.9.4.2" accent="#a855f7" />
        <InfoRow label="BUILD TYPE" value="PRODUCTION" />
        <InfoRow label="CLEARANCE LEVEL" value="5 — OPERATOR" accent="#00e5ff" />
        <InfoRow label="DETECTION ENGINE" value="GPT-5 MINI + HEURISTICS" />
        <InfoRow label="DATABASE" value="POSTGRESQL" />
        <div className="py-3">
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(0,229,255,0.5)" }} />
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3" style={{ color: "rgba(0,229,255,0.4)" }} />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                TRUTHLENS AI · MISINFORMATION DETECTION SYSTEM
              </span>
              <CheckCircle className="w-3 h-3 ml-auto" style={{ color: "#00e5ff" }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Warning badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{
          background: "rgba(245,158,11,0.04)",
          border: "1px solid rgba(245,158,11,0.12)",
        }}
      >
        <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(245,158,11,0.6)" }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", lineHeight: "1.6" }}>
          TOGGLE STATES ABOVE ARE DISPLAY-ONLY IN THIS BUILD. FULL CONFIG PERSISTENCE AVAILABLE IN ENTERPRISE TIER.
        </p>
      </motion.div>
    </motion.div>
  );
}
