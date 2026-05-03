import { motion } from "framer-motion";
import {
  Settings, ShieldAlert, Cpu, Database, Globe,
  Zap, Eye, Bell, Lock, Info, CheckCircle,
} from "lucide-react";
import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";

const F = "Inter, system-ui, sans-serif";

function ToggleSwitch({ enabled, label, sub }: { enabled: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--c-card-md)" }}>
      <div>
        <p style={{ fontFamily: F, fontSize: "13px", fontWeight: 500, color: enabled ? "#c9d1d9" : "#6b7280" }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontFamily: F, fontSize: "11px", color: "#374151", marginTop: "2px" }}>
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
          background: enabled ? "rgba(59,130,246,0.25)" : "var(--c-border-sub)",
          border: enabled ? "1px solid rgba(59,130,246,0.4)" : "1px solid var(--c-border)",
          transition: "background 0.2s, border-color 0.2s",
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
            background: enabled ? "#3b82f6" : "var(--c-txt3)",
          }}
        />
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color = "#3b82f6",
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay }}
      className="rounded-xl overflow-hidden"
      style={{ background: "#161b27", border: "1px solid var(--c-border)" }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--c-border-sub)", background: "var(--c-card)" }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color, opacity: 0.8 }} />
        <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", color: "#6b7280", textTransform: "uppercase" as const }}>
          {title}
        </span>
      </div>
      <div className="px-5 py-1">{children}</div>
    </motion.div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--c-card-md)" }}>
      <span style={{ fontFamily: F, fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>
        {label}
      </span>
      <span style={{ fontFamily: F, fontSize: "12px", fontWeight: 600, color: accent ?? "#94a3b8" }}>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <Settings className="w-4 h-4" style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: F, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              Settings
            </h2>
            <p style={{ fontFamily: F, fontSize: "12px", color: "#475569", marginTop: "1px" }}>
              System configuration &amp; operator settings
            </p>
          </div>
        </div>
        <div className="mt-4" style={{ height: "1px", background: "var(--c-border-sub)" }} />
      </div>

      {/* AI Engine */}
      <Section icon={Cpu} title="AI Engine" color="#3b82f6" delay={0.05}>
        <InfoRow label="Model"           value="GPT-5 Mini"        accent="#3b82f6" />
        <InfoRow label="Provider"        value="OpenAI"            accent="#3b82f6" />
        <InfoRow label="Max Tokens"      value="1,200+"            />
        <InfoRow label="Analysis Mode"   value="Deep Scan"         accent="#a855f7" />
        <InfoRow label="Response Format" value="JSON Strict"       />
      </Section>

      {/* Display */}
      <Section icon={Eye} title="Display Preferences" color="#a855f7" delay={0.09}>
        <ToggleSwitch enabled label="3D Trust Orb visualizer"   sub="WebGL · requires GPU context" />
        <ToggleSwitch enabled label="Smooth page transitions"   sub="Framer Motion · animation engine" />
        <ToggleSwitch enabled={false} label="High contrast mode" sub="Accessibility · WCAG 2.1" />
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Alerts & Notifications" color="#f59e0b" delay={0.13}>
        <ToggleSwitch enabled label="High-risk scan alerts"  sub="Real-time threat notification" />
        <ToggleSwitch enabled label="Voice TTS readouts"     sub="Web Speech API · browser native" />
        <ToggleSwitch enabled={false} label="Sound effects on analysis" sub="Audio feedback · optional" />
      </Section>

      {/* Privacy */}
      <Section icon={Lock} title="Privacy & Data" color="#ef4444" delay={0.17}>
        <ToggleSwitch enabled label="Store scan history"         sub="PostgreSQL · persistent storage" />
        <ToggleSwitch enabled label="Aggregate to global feed"   sub="Anonymised · community intelligence" />
        <ToggleSwitch enabled={false} label="Share anonymised data" sub="Research · disabled by default" />
      </Section>

      {/* Session Stats */}
      <Section icon={Database} title="Session Statistics" color="#22c55e" delay={0.21}>
        <InfoRow label="Total Analyses Run"    value={String(stats?.totalAnalyses ?? 0)}                                        accent="#3b82f6" />
        <InfoRow label="Avg Credibility Score" value={stats ? `${Math.round(stats.avgCredibilityScore)}/100` : "—"}             accent="#3b82f6" />
        <InfoRow label="Safe Transmissions"    value={String(stats?.riskDistribution?.Low ?? 0)}                                accent="#22c55e" />
        <InfoRow label="Medium Risk"           value={String(stats?.riskDistribution?.Medium ?? 0)}                             accent="#f59e0b" />
        <InfoRow label="High Risk"             value={String(stats?.riskDistribution?.High ?? 0)}                               accent="#ef4444" />
      </Section>

      {/* About */}
      <Section icon={Info} title="About TruthLens" color="#6b7280" delay={0.25}>
        <InfoRow label="Version"           value="0.9.4"                    accent="#6b7280" />
        <InfoRow label="Build Type"        value="Production"               />
        <InfoRow label="Detection Engine"  value="GPT-5 Mini + Heuristics"  />
        <InfoRow label="Database"          value="PostgreSQL"               />
        <div className="py-3">
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(59,130,246,0.5)" }} />
            <div className="flex items-center gap-1.5 flex-1">
              <Globe className="w-3 h-3" style={{ color: "rgba(59,130,246,0.4)" }} />
              <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "#374151" }}>
                TruthLens AI · Misinformation Detection System
              </span>
              <CheckCircle className="w-3 h-3 ml-auto" style={{ color: "#3b82f6" }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}
      >
        <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(245,158,11,0.5)" }} />
        <p style={{ fontFamily: F, fontSize: "11px", fontWeight: 400, color: "#374151", lineHeight: "1.55" }}>
          Toggle states above are display-only in this build. Full config persistence available in Enterprise tier.
        </p>
      </motion.div>
    </motion.div>
  );
}
