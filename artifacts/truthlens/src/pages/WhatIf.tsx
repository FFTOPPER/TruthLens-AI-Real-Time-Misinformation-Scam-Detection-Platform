import { useState, useRef, useCallback, Component, type ReactNode, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, RefreshCw, ChevronRight, Zap, Monitor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── WebGL support detection ────────────────────────────────── */
function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      setOk(!!gl);
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/* ── WebGL error boundary (second safety net) ───────────────── */
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <WebGLUnavailable />;
    return this.props.children;
  }
}

function WebGLUnavailable() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: "rgba(4,6,14,0.97)" }}>
      <Monitor className="w-8 h-8" style={{ color: "rgba(255,255,255,0.18)" }} />
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.28)", textAlign: "center", lineHeight: "1.8" }}>
        3D REQUIRES WEBGL<br />
        <span style={{ color: "rgba(255,255,255,0.16)" }}>ENABLE GPU ACCELERATION IN YOUR BROWSER</span>
      </p>
    </div>
  );
}

/* ── Types ──────────────────────────────────────────────────── */
type Severity = "safe" | "risky" | "dangerous";
type CharState = "thinking" | "bad" | "good";

interface Choice {
  id: string;
  label: string;
  sublabel: string;
  severity: Severity;
  emoji: string;
}
interface Scenario {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  context: string;
  choices: Choice[];
}
interface Outcome {
  title: string;
  severity: Severity;
  immediateEffect: string;
  whatHappens: string[];
  statistic: string;
  recovery: string[];
  lesson: string;
}

/* ── Bubble arc positions (lowered so they sit just above the head) */
const BUBBLE_POS: [number, number, number][] = [
  [-1.6, 2.0, 0.4],
  [-0.52, 2.42, 0.5],
  [0.52, 2.42, 0.5],
  [1.6, 2.0, 0.4],
];
const BUBBLE_SPEEDS = [1.55, 2.05, 1.85, 2.25];

/* ── Scenarios ──────────────────────────────────────────────── */
const SCENARIOS: Scenario[] = [
  {
    id: "phishing",
    title: "Phishing Email",
    emoji: "📧",
    color: "#ef4444",
    description: "Urgent email from 'your bank'",
    context:
      "Subject: URGENT — Account Suspended\n\nYour account has been temporarily suspended due to suspicious activity. Click the link IMMEDIATELY to verify or your account will be permanently closed.\n\nVerify Now: www.secure-bankconfirm.ru/verify\n\nWarning: Failure to act within 2 hours will result in permanent closure.",
    choices: [
      { id: "click", label: "Click the Link", sublabel: "Verify account", severity: "dangerous", emoji: "🔗" },
      { id: "call", label: "Call Number in Email", sublabel: "Talk to support", severity: "risky", emoji: "📞" },
      { id: "delete", label: "Just Delete It", sublabel: "Ignore and move on", severity: "risky", emoji: "🗑️" },
      { id: "report", label: "Report & Block", sublabel: "Best action", severity: "safe", emoji: "🛡️" },
    ],
  },
  {
    id: "health_misinfo",
    title: "Viral Health Claim",
    emoji: "🦠",
    color: "#f97316",
    description: "A shocking miracle cure post",
    context:
      "⚠️ MUST SHARE BEFORE DELETED ⚠️\n\nSCIENTISTS CONFIRM: Drinking bleach + apple cider vinegar KILLS cancer in 3 days!\n\nA fired pharma scientist revealed this. BIG PHARMA is SUPPRESSING it!\n\nShare with everyone you love 💛 before they delete this!",
    choices: [
      { id: "share", label: "Share It Widely", sublabel: "Warn my family!", severity: "dangerous", emoji: "🔄" },
      { id: "try", label: "Try the Remedy", sublabel: "What's the harm?", severity: "dangerous", emoji: "⚗️" },
      { id: "scroll", label: "Just Scroll Past", sublabel: "Not my problem", severity: "risky", emoji: "📱" },
      { id: "factcheck", label: "Fact Check & Report", sublabel: "Verify first", severity: "safe", emoji: "🔍" },
    ],
  },
  {
    id: "scam_text",
    title: "Delivery Scam Text",
    emoji: "📦",
    color: "#a855f7",
    description: "Package held — pay a fee",
    context:
      "FedEx: Your parcel #7743-KL is on hold.\nA customs fee of £2.99 is required for release.\nPay now to avoid return: fedex-delivery-uk.live/pay\n\nIf not paid within 24hrs, your package will be returned to sender.",
    choices: [
      { id: "pay", label: "Pay the £2.99", sublabel: "Enter card details", severity: "dangerous", emoji: "💳" },
      { id: "click_check", label: "Click to Check", sublabel: "See what it says", severity: "dangerous", emoji: "🔗" },
      { id: "delete", label: "Delete the Text", sublabel: "Probably spam", severity: "risky", emoji: "🗑️" },
      { id: "report", label: "Report as Scam", sublabel: "Forward to carrier", severity: "safe", emoji: "🛡️" },
    ],
  },
  {
    id: "investment",
    title: "Crypto Investment DM",
    emoji: "💰",
    color: "#eab308",
    description: "Stranger promises 300% returns",
    context:
      "Hey! I know this is random but I made £47,000 last month with a secret AI crypto bot 🤖💰\n\nMy mentor is only taking 3 more students. Guaranteed 300% returns.\n\nAll you need is £500 to start. But this offer ends TONIGHT! Interested? 🚀",
    choices: [
      { id: "invest", label: "Send the £500", sublabel: "This sounds real!", severity: "dangerous", emoji: "💸" },
      { id: "info", label: "Ask for More Info", sublabel: "Keep chatting", severity: "risky", emoji: "💬" },
      { id: "ignore", label: "Leave on Read", sublabel: "Just don't reply", severity: "risky", emoji: "🔕" },
      { id: "report", label: "Report & Block", sublabel: "Platform report", severity: "safe", emoji: "🚫" },
    ],
  },
  {
    id: "romance_scam",
    title: "Romance Scam",
    emoji: "💔",
    color: "#ec4899",
    description: "Online lover needs emergency cash",
    context:
      "Hey 💕 I know we've only talked 3 weeks but I feel so connected to you.\n\nI'm stuck at Dubai airport — my wallet was stolen and I can't board my flight home. I'm so embarrassed asking but I just need £800 to cover the ticket.\n\nI'll pay you back the moment I land. You're the only one I trust 🙏",
    choices: [
      { id: "send", label: "Send the £800", sublabel: "Help them out", severity: "dangerous", emoji: "💸" },
      { id: "partial", label: "Send £100 First", sublabel: "Test with small amount", severity: "dangerous", emoji: "💳" },
      { id: "videocall", label: "Demand a Video Call", sublabel: "Verify identity", severity: "risky", emoji: "📹" },
      { id: "report", label: "Report & Block", sublabel: "Classic romance scam", severity: "safe", emoji: "🛡️" },
    ],
  },
  {
    id: "deepfake_video",
    title: "Viral Deepfake Clip",
    emoji: "🎭",
    color: "#8b5cf6",
    description: "PM announces bank freeze at midnight",
    context:
      "🔴 BREAKING — 14M views and rising!\n\n\"The Prime Minister just announced ALL bank accounts will be frozen at midnight. Transfer savings to crypto NOW before it's too late.\"\n\n⚠️ They're trying to delete this — SHARE BEFORE IT'S GONE!\n\nPosted by: @RealNewsAlert247  (account created 2 days ago)",
    choices: [
      { id: "share", label: "Share Immediately", sublabel: "Warn everyone!", severity: "dangerous", emoji: "🔄" },
      { id: "transfer", label: "Move Your Savings", sublabel: "Better safe than sorry", severity: "dangerous", emoji: "🏦" },
      { id: "search", label: "Search Official News", sublabel: "Check BBC / Reuters", severity: "risky", emoji: "🔍" },
      { id: "report", label: "Flag as Deepfake", sublabel: "Report the content", severity: "safe", emoji: "🛡️" },
    ],
  },
  {
    id: "job_scam",
    title: "Fake Job Offer",
    emoji: "💼",
    color: "#06b6d4",
    description: "Dream remote job — pay £150 deposit",
    context:
      "CONGRATULATIONS! 🎉\n\nYou have been selected for a REMOTE POSITION at Amazon!\nSalary: £85,000/yr | Work from home | Start immediately\n\nTo secure your role, pay a one-time equipment & training deposit of £150 via bank transfer.\n\nThis position will be re-assigned if not confirmed within 12 hours. Reply YES to proceed.",
    choices: [
      { id: "pay", label: "Pay the £150", sublabel: "Don't lose the role!", severity: "dangerous", emoji: "💸" },
      { id: "contract", label: "Ask for a Contract", sublabel: "Then maybe pay", severity: "risky", emoji: "📄" },
      { id: "google", label: "Google the Recruiter", sublabel: "Verify before acting", severity: "risky", emoji: "🔍" },
      { id: "report", label: "Report Scam", sublabel: "Real jobs don't charge", severity: "safe", emoji: "🛡️" },
    ],
  },
  {
    id: "ai_voice",
    title: "AI Voice Clone Call",
    emoji: "📞",
    color: "#10b981",
    description: "Your 'grandson' needs £2,000 bail",
    context:
      "You answer the phone. The voice sounds exactly like your grandson:\n\n\"Gran, it's me… I'm in trouble. Car accident abroad — I need £2,000 bail money. Please don't tell Mum and Dad, they'll be so upset. A lawyer will come to your door to collect it. Please hurry, I'm scared.\"\n\n[The voice is an AI clone — your grandson is safely at home]",
    choices: [
      { id: "cash", label: "Hand Cash to Lawyer", sublabel: "Help right away", severity: "dangerous", emoji: "💵" },
      { id: "wire", label: "Wire Transfer Instead", sublabel: "More secure than cash?", severity: "dangerous", emoji: "🏦" },
      { id: "their_number", label: "Call the Number They Give", sublabel: "Confirm with 'lawyer'", severity: "risky", emoji: "☎️" },
      { id: "verify", label: "Call Grandson Directly", sublabel: "Use his real number", severity: "safe", emoji: "📱" },
    ],
  },
];

/* ── Severity config ─────────────────────────────────────────── */
const SEV = {
  dangerous: { color: "#ef4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.22)", label: "DANGEROUS", icon: "⚠️" },
  risky:     { color: "#f97316", bg: "rgba(249,115,22,0.07)", border: "rgba(249,115,22,0.22)", label: "RISKY",     icon: "⚡" },
  safe:      { color: "#00ff88", bg: "rgba(0,255,136,0.06)",  border: "rgba(0,255,136,0.20)",  label: "SAFE",      icon: "✅" },
};

/* ── 3D Character ───────────────────────────────────────────── */
function Character3D({ charState }: { charState: CharState }) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const clock   = useRef(0);
  const reactT  = useRef(0);
  const prevState = useRef<CharState>("thinking");

  useFrame((_, dt) => {
    clock.current += dt;
    if (!rootRef.current || !headRef.current) return;

    if (prevState.current !== charState) {
      reactT.current = 0;
      prevState.current = charState;
      rootRef.current.position.set(0, 0, 0);
      rootRef.current.rotation.set(0, 0, 0);
      headRef.current.rotation.set(0, 0, 0);
      if (armLRef.current) armLRef.current.rotation.set(0, 0, 0);
      if (armRRef.current) armRRef.current.rotation.set(0, 0, 0);
    }
    reactT.current += dt;
    const t  = clock.current;
    const rt = reactT.current;

    if (charState === "thinking") {
      rootRef.current.position.y = Math.sin(t * 1.0) * 0.04;
      headRef.current.rotation.z = -0.18 + Math.sin(t * 0.5) * 0.04;
      headRef.current.rotation.y = 0.12;
      if (armRRef.current) { armRRef.current.rotation.z = -1.1; armRRef.current.rotation.x = -0.2; }
      if (armLRef.current) armLRef.current.rotation.z = -0.18;
    }

    if (charState === "bad") {
      if (rt < 0.45) {
        const p = rt / 0.45;
        rootRef.current.position.y = Math.sin(p * Math.PI) * 0.28;
        rootRef.current.rotation.x = p * 0.42;
        if (armLRef.current) armLRef.current.rotation.z =  p * 1.65;
        if (armRRef.current) armRRef.current.rotation.z = -p * 1.65;
      } else if (rt < 2.2) {
        const shake = Math.sin(rt * 22) * 0.07 * Math.max(0, 1 - (rt - 0.45) / 1.7);
        rootRef.current.position.x = shake;
        rootRef.current.rotation.z = shake * 0.45;
        rootRef.current.position.y = -0.09 + Math.sin(t * 2) * 0.015;
        rootRef.current.rotation.x = 0.38;
      } else {
        rootRef.current.rotation.x = 0.38;
        rootRef.current.position.y = -0.13 + Math.sin(t * 0.5) * 0.01;
        if (armLRef.current) armLRef.current.rotation.z = 0.5;
        if (armRRef.current) armRRef.current.rotation.z = -0.5;
        headRef.current.rotation.x = 0.3;
      }
    }

    if (charState === "good") {
      if (rt < 0.28) {
        rootRef.current.position.y = -rt * 0.22;
      } else if (rt < 0.88) {
        const p = (rt - 0.28) / 0.6;
        rootRef.current.position.y = Math.sin(p * Math.PI) * 0.8 - 0.06;
        if (armLRef.current) armLRef.current.rotation.z =  p * 2.2;
        if (armRRef.current) armRRef.current.rotation.z = -p * 2.2;
        headRef.current.rotation.x = -p * 0.25;
      } else {
        rootRef.current.position.y = Math.abs(Math.sin(t * 3.5)) * 0.13;
        if (armLRef.current) armLRef.current.rotation.z =  2.0 + Math.sin(t * 2.5) * 0.2;
        if (armRRef.current) armRRef.current.rotation.z = -2.0 - Math.sin(t * 2.5) * 0.2;
        rootRef.current.rotation.z = Math.sin(t * 3) * 0.055;
        headRef.current.rotation.y = Math.sin(t * 2) * 0.18;
      }
    }
  });

  const bodyColor   = charState === "bad" ? "#ef4444" : charState === "good" ? "#00cc66" : "#06b6d4";
  const emissiveInt = charState !== "thinking" ? 0.22 : 0.06;
  const pantsColor  = charState === "bad" ? "#7f1d1d" : charState === "good" ? "#064e3b" : "#1e3a5f";

  return (
    <group ref={rootRef} position={[0, -0.5, 0]}>
      {/* Ground circle glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 32]} />
        <meshBasicMaterial color={bodyColor} transparent opacity={0.1} />
      </mesh>

      {/* Reaction point light */}
      {charState !== "thinking" && (
        <pointLight
          color={charState === "bad" ? "#ff2222" : "#00ff88"}
          intensity={charState === "bad" ? 4 : 5}
          distance={3.5}
          position={[0, 1.2, 0.6]}
        />
      )}

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color="#f4c5a0" roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 2.03, 0]}>
        <sphereGeometry args={[0.305, 16, 8, 0, Math.PI * 2, 0, 1.1]} />
        <meshStandardMaterial color="#3b2314" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[ 0.1, 1.86, 0.27]}><sphereGeometry args={[0.043, 8, 8]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[-0.1, 1.86, 0.27]}><sphereGeometry args={[0.043, 8, 8]} /><meshStandardMaterial color="#111" /></mesh>
      {/* Neck */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 8]} />
        <meshStandardMaterial color="#e8b89a" roughness={0.8} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[0.54, 0.68, 0.29]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={emissiveInt} roughness={0.6} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.27]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} />
      </mesh>

      {/* Left arm (pivot at shoulder) */}
      <group ref={armLRef} position={[0.37, 1.3, 0]}>
        <mesh position={[0, -0.27, 0]}>
          <capsuleGeometry args={[0.09, 0.38, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#f0c0a0" roughness={0.7} />
        </mesh>
      </group>

      {/* Right arm (pivot at shoulder) */}
      <group ref={armRRef} position={[-0.37, 1.3, 0]}>
        <mesh position={[0, -0.27, 0]}>
          <capsuleGeometry args={[0.09, 0.38, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#f0c0a0" roughness={0.7} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[ 0.15, 0.22, 0]}><capsuleGeometry args={[0.1, 0.52, 4, 8]} /><meshStandardMaterial color={pantsColor} roughness={0.7} /></mesh>
      <mesh position={[-0.15, 0.22, 0]}><capsuleGeometry args={[0.1, 0.52, 4, 8]} /><meshStandardMaterial color={pantsColor} roughness={0.7} /></mesh>
      {/* Feet */}
      <mesh position={[ 0.15, -0.08, 0.07]}><boxGeometry args={[0.22, 0.1, 0.36]} /><meshStandardMaterial color="#0f1525" roughness={0.8} /></mesh>
      <mesh position={[-0.15, -0.08, 0.07]}><boxGeometry args={[0.22, 0.1, 0.36]} /><meshStandardMaterial color="#0f1525" roughness={0.8} /></mesh>
    </group>
  );
}

/* ── Thought bubble ──────────────────────────────────────────── */
function ThoughtBubble({
  choice, position, speed, onClick, isSelected, isDisabled,
}: {
  choice: Choice;
  position: [number, number, number];
  speed: number;
  onClick: () => void;
  isSelected: boolean;
  isDisabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const sevColor =
    choice.severity === "dangerous" ? "#ef4444" :
    choice.severity === "risky"     ? "#f97316" : "#00ff88";

  return (
    <Float speed={speed} rotationIntensity={0} floatIntensity={0.55} floatingRange={[-0.07, 0.07]}>
      <group position={position}>
        <pointLight
          color={sevColor}
          intensity={isSelected ? 2.5 : hovered ? 1.4 : 0.55}
          distance={1.3}
        />

        <mesh
          scale={isSelected ? 1.2 : hovered ? 1.08 : 1}
          onClick={isDisabled ? undefined : onClick}
          onPointerEnter={() => {
            if (!isDisabled) { setHovered(true); document.body.style.cursor = "pointer"; }
          }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <sphereGeometry args={[0.48, 20, 20]} />
          <meshStandardMaterial
            color={isSelected ? sevColor : hovered ? "#16205a" : "#090d25"}
            emissive={sevColor}
            emissiveIntensity={isSelected ? 0.6 : hovered ? 0.32 : 0.15}
            transparent
            opacity={isSelected ? 0.55 : isDisabled && !isSelected ? 0.18 : 0.9}
            roughness={0.22}
            metalness={0.12}
          />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.53, 0.028, 8, 32]} />
            <meshBasicMaterial color={sevColor} transparent opacity={0.75} />
          </mesh>
        )}

        {/* Label */}
        <Html center distanceFactor={4.6} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ textAlign: "center", width: "76px" }}>
            <div style={{ fontSize: "22px", lineHeight: "1" }}>{choice.emoji}</div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "6.5px", fontWeight: 700,
              letterSpacing: "0.07em", lineHeight: "1.4",
              marginTop: "4px", textTransform: "uppercase",
              color: isSelected ? "white" : hovered ? sevColor : "rgba(255,255,255,0.78)",
              textShadow: "0 1px 5px rgba(0,0,0,0.98)",
            }}>
              {choice.label}
            </div>
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ── Scene (inside Canvas) ───────────────────────────────────── */
function Scene({
  charState, scenario, selectedChoice, onChoiceClick,
}: {
  charState: CharState;
  scenario: Scenario;
  selectedChoice: string | null;
  onChoiceClick: (c: Choice) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.3} color="#141830" />
      <directionalLight position={[3, 5, 3]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#4444cc" />
      <pointLight position={[0, 5, 2]} intensity={1.0} color="#a855f7" distance={10} />

      <Stars radius={20} depth={50} count={900} factor={4} saturation={0} fade speed={0.5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.98, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#050810" roughness={1} />
      </mesh>
      <gridHelper args={[12, 22, "#0b1a3a", "#0b1a3a"]} position={[0, -0.97, 0]} />

      <Character3D charState={charState} />

      {scenario.choices.map((choice, i) => (
        <ThoughtBubble
          key={choice.id}
          choice={choice}
          position={BUBBLE_POS[i]}
          speed={BUBBLE_SPEEDS[i]}
          onClick={() => onChoiceClick(choice)}
          isSelected={selectedChoice === choice.id}
          isDisabled={selectedChoice !== null && selectedChoice !== choice.id}
        />
      ))}
    </>
  );
}

/* ── Outcome panel ───────────────────────────────────────────── */
function OutcomePanel({ outcome, onReset }: { outcome: Outcome; onReset: () => void }) {
  const sev = SEV[outcome.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${sev.border}`, background: sev.bg }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between flex-wrap gap-3"
        style={{ borderBottom: `1px solid ${sev.border}`, background: `${sev.color}10` }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "22px" }}>{sev.icon}</span>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: 700, color: sev.color, letterSpacing: "0.1em" }}>
              {(outcome.title ?? "OUTCOME GENERATED").toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "7.5px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", marginTop: "2px" }}>
              {sev.label} OUTCOME
            </div>
          </div>
        </div>
        <motion.button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] tracking-widest"
          style={{ fontFamily: "'Space Mono', monospace", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          whileHover={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
          whileTap={{ scale: 0.96 }}
        >
          <RefreshCw className="w-2.5 h-2.5" />
          TRY AGAIN
        </motion.button>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Immediate effect */}
          <div className="flex gap-3 p-3.5 rounded-xl"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>{outcome.severity === "safe" ? "🎯" : "💥"}</span>
            <p style={{ color: "rgba(255,255,255,0.88)", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", lineHeight: "1.68", fontWeight: 500 }}>
              {outcome.immediateEffect}
            </p>
          </div>

          {/* Chain of events */}
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", marginBottom: "10px" }}>
              CHAIN OF EVENTS
            </p>
            <div className="space-y-2">
              {outcome.whatHappens.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-start gap-2.5"
                >
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[8.5px] font-bold mt-0.5"
                    style={{ background: `${sev.color}20`, color: sev.color, border: `1px solid ${sev.color}40` }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Rajdhani', sans-serif", fontSize: "12.5px", lineHeight: "1.58" }}>
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Statistic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="flex gap-3 p-3 rounded-lg"
            style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span style={{ fontSize: "14px", flexShrink: 0 }}>📊</span>
            <p style={{ color: "rgba(255,255,255,0.48)", fontFamily: "'Space Mono', monospace", fontSize: "9px", lineHeight: "1.65", letterSpacing: "0.03em" }}>
              {outcome.statistic}
            </p>
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Recovery or reinforcement */}
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", marginBottom: "10px" }}>
              {outcome.severity === "safe" ? "✅ WHY THIS WORKS" : "🔧 HOW TO RECOVER"}
            </p>
            <div className="space-y-2">
              {outcome.recovery.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{
                    background: outcome.severity === "safe" ? "rgba(0,255,136,0.04)" : "rgba(168,85,247,0.05)",
                    border: `1px solid ${outcome.severity === "safe" ? "rgba(0,255,136,0.12)" : "rgba(168,85,247,0.12)"}`,
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: outcome.severity === "safe" ? "#00ff88" : "#a855f7" }} />
                  <p style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Rajdhani', sans-serif", fontSize: "12.5px", lineHeight: "1.52" }}>
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Key lesson */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.72, type: "spring", stiffness: 200 }}
            className="p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${sev.color}14, ${sev.color}06)`,
              border: `1px solid ${sev.color}38`,
              boxShadow: `0 4px 28px ${sev.color}14`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" style={{ color: sev.color }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: sev.color }}>
                KEY LESSON
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", fontWeight: 600, lineHeight: "1.58" }}>
              {outcome.lesson}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function WhatIf() {
  const { toast } = useToast();
  const webgl = useWebGL();
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [charState, setCharState]           = useState<CharState>("thinking");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [outcome, setOutcome]               = useState<Outcome | null>(null);

  const handleScenarioChange = (s: Scenario) => {
    setActiveScenario(s);
    setSelectedChoice(null);
    setOutcome(null);
    setCharState("thinking");
  };

  const handleChoiceClick = useCallback(async (choice: Choice) => {
    if (selectedChoice) return;
    setSelectedChoice(choice.id);
    setCharState(choice.severity === "safe" ? "good" : "bad");
    setIsLoading(true);
    try {
      const res = await fetch("/api/analysis/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle:   activeScenario.title,
          scenarioContext: activeScenario.context,
          choiceLabel:     choice.label,
          choiceSublabel:  choice.sublabel,
          severity:        choice.severity,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setOutcome(await res.json() as Outcome);
    } catch {
      toast({ title: "AI Unavailable", description: "Could not generate outcome. Try again.", variant: "destructive" });
      setSelectedChoice(null);
      setCharState("thinking");
    } finally {
      setIsLoading(false);
    }
  }, [selectedChoice, activeScenario, toast]);

  const handleReset = () => {
    setSelectedChoice(null);
    setOutcome(null);
    setCharState("thinking");
  };

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8 lg:py-10 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <BrainCircuit className="w-4 h-4" style={{ color: "#fbbf24" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-wider"
            style={{ fontFamily: "'Orbitron', monospace", color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.4)" }}>
            WHAT IF?
          </h1>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.2em",
            color: "rgba(251,191,36,0.6)", background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)", borderRadius: "9999px", padding: "1px 8px",
          }}>
            INTERACTIVE SIMULATOR
          </span>
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em" }}>
          CHOOSE YOUR RESPONSE · WATCH WHAT HAPPENS · LEARN FROM OUTCOMES
        </p>
      </motion.div>

      {/* Scenario selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SCENARIOS.map((s) => (
          <motion.button
            key={s.id}
            onClick={() => handleScenarioChange(s)}
            className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left"
            style={{
              background: activeScenario.id === s.id ? `${s.color}12` : "rgba(255,255,255,0.02)",
              border: activeScenario.id === s.id ? `1px solid ${s.color}48` : "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              boxShadow: activeScenario.id === s.id ? `0 0 20px ${s.color}1a` : "none",
              transition: "all 0.2s",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: "20px" }}>{s.emoji}</span>
            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: "8.5px", fontWeight: 700,
                letterSpacing: "0.08em",
                color: activeScenario.id === s.id ? s.color : "rgba(255,255,255,0.55)",
              }}>
                {s.title.toUpperCase()}
              </div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: "7px",
                color: "rgba(255,255,255,0.26)", letterSpacing: "0.1em", marginTop: "2px",
              }}>
                {s.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main interaction area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: context + status — shown BELOW canvas on mobile */}
        <div className="lg:col-span-2 space-y-3 order-2 lg:order-1">
          {/* Context card */}
          <div className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${activeScenario.color}2e`, background: `${activeScenario.color}07` }}>
            <div className="px-4 py-2.5 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${activeScenario.color}20` }}>
              <span style={{ fontSize: "14px" }}>{activeScenario.emoji}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: activeScenario.color }}>
                YOU RECEIVED
              </span>
            </div>
            <div className="p-4">
              <pre style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: "12.5px", lineHeight: "1.72",
                color: "rgba(255,255,255,0.72)", whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {activeScenario.context}
              </pre>
            </div>
          </div>

          {/* Status / instruction box */}
          <div className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <AnimatePresence mode="wait">
              {!selectedChoice && (
                <motion.p key="hint"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.13em", lineHeight: "1.65" }}>
                  👆 CLICK A THOUGHT BUBBLE ABOVE THE PERSON TO CHOOSE YOUR RESPONSE
                </motion.p>
              )}
              {selectedChoice && isLoading && (
                <motion.div key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <BrainCircuit className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                  </motion.div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#fbbf24", letterSpacing: "0.14em" }}>
                    SIMULATING OUTCOME…
                  </span>
                </motion.div>
              )}
              {outcome && (
                <motion.p key="done"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.32)", letterSpacing: "0.13em" }}>
                  ↓ SCROLL DOWN TO SEE THE FULL OUTCOME
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Choice severity legend */}
          <div className="grid grid-cols-3 gap-1.5">
            {(["dangerous", "risky", "safe"] as const).map(s => (
              <div key={s} className="flex items-center gap-1.5 p-2 rounded-lg"
                style={{ background: SEV[s].bg, border: `1px solid ${SEV[s].border}` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEV[s].color }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "6.5px", color: SEV[s].color, letterSpacing: "0.1em" }}>
                  {s.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Canvas — shown FIRST on mobile */}
        <div
          className="lg:col-span-3 rounded-xl overflow-hidden order-1 lg:order-2"
          style={{ height: "500px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(4,6,14,0.97)" }}
        >
          {webgl === null && (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <BrainCircuit className="w-7 h-7" style={{ color: "rgba(251,191,36,0.4)" }} />
              </motion.div>
            </div>
          )}
          {webgl === false && <WebGLUnavailable />}
          {webgl === true && (
            <CanvasErrorBoundary>
              <Canvas
                camera={{ position: [0, 1.1, 5.5], fov: 55 }}
                onCreated={({ camera, gl }) => {
                  camera.lookAt(0, 1.0, 0);
                  gl.domElement.addEventListener("webglcontextlost", (e) => {
                    e.preventDefault();
                  }, false);
                }}
                gl={{ antialias: true, failIfMajorPerformanceCaveat: false }}
              >
                <Scene
                  charState={charState}
                  scenario={activeScenario}
                  selectedChoice={selectedChoice}
                  onChoiceClick={handleChoiceClick}
                />
              </Canvas>
            </CanvasErrorBoundary>
          )}
        </div>
      </div>

      {/* Outcome panel */}
      <AnimatePresence>
        {outcome && <OutcomePanel key={outcome.title} outcome={outcome} onReset={handleReset} />}
      </AnimatePresence>
    </div>
  );
}
