import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

type RiskLevel = "Low" | "Medium" | "High" | null;

/** Detect WebGL support before mounting Canvas */
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/* ── 3D orb mesh ─────────────────────────────────────────────── */
interface OrbMeshProps {
  risk: RiskLevel;
  score: number | null;
}

function OrbMesh({ risk, score }: OrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const { color, emissive, glowColor } = useMemo(() => {
    if (!risk) return { color: "#1a2a3a", emissive: "#001122", glowColor: "#00e5ff" };
    if (risk === "Low") return { color: "#0d4a2d", emissive: "#00ff88", glowColor: "#00ff88" };
    if (risk === "Medium") return { color: "#4a3600", emissive: "#f59e0b", glowColor: "#f59e0b" };
    return { color: "#4a0d0d", emissive: "#ef4444", glowColor: "#ef4444" };
  }, [risk]);

  const distort = useMemo(() => {
    if (!score) return 0.15;
    if (score < 30) return 0.55;
    if (score < 60) return 0.35;
    return 0.18;
  }, [score]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.35;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
      meshRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5 + 0.5) * 0.06);
    }
  });

  return (
    <group>
      <Sphere ref={glowRef} args={[1.22, 32, 32]}>
        <meshBasicMaterial color={glowColor} transparent opacity={risk ? 0.06 : 0.03} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[1.12, 32, 32]}>
        <meshBasicMaterial color={glowColor} transparent opacity={risk ? 0.04 : 0.015} side={THREE.BackSide} />
      </Sphere>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={risk ? 0.6 : 0.15}
          distort={distort}
          speed={risk ? 2.5 : 1.2}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.95}
        />
      </Sphere>
    </group>
  );
}

/* ── CSS fallback orb (no WebGL needed) ──────────────────────── */
interface CssOrbProps {
  risk: RiskLevel;
}

function CssOrb({ risk }: CssOrbProps) {
  const { core, glow, ring } = useMemo(() => {
    if (!risk) return {
      core: "radial-gradient(circle at 35% 35%, #1a4a5a, #081520)",
      glow: "rgba(0, 229, 255, 0.25)",
      ring: "rgba(0, 229, 255, 0.3)",
    };
    if (risk === "Low") return {
      core: "radial-gradient(circle at 35% 35%, #1a5a3a, #081a0e)",
      glow: "rgba(0, 255, 136, 0.3)",
      ring: "rgba(0, 255, 136, 0.4)",
    };
    if (risk === "Medium") return {
      core: "radial-gradient(circle at 35% 35%, #5a3d00, #1a1000)",
      glow: "rgba(245, 158, 11, 0.3)",
      ring: "rgba(245, 158, 11, 0.4)",
    };
    return {
      core: "radial-gradient(circle at 35% 35%, #5a1a1a, #1a0808)",
      glow: "rgba(239, 68, 68, 0.35)",
      ring: "rgba(239, 68, 68, 0.45)",
    };
  }, [risk]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Outer pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 160, height: 160, border: `1px solid ${ring}`, background: "transparent" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Mid pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 136, height: 136, border: `1px solid ${ring}`, background: "transparent" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      {/* Main sphere */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: 120,
          height: 120,
          background: core,
          boxShadow: `0 0 40px ${glow}, 0 0 80px ${glow}, inset 0 0 30px rgba(0,0,0,0.5)`,
          transition: "background 0.8s ease, box-shadow 0.8s ease",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Specular highlight */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: "22%",
            width: "30%",
            height: "20%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.25), transparent)",
            filter: "blur(4px)",
          }}
        />
        {/* Slow rotation shimmer */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}

/* ── Main exported component ─────────────────────────────────── */
interface TrustOrbProps {
  risk: RiskLevel;
  score: number | null;
  className?: string;
}

export function TrustOrb({ risk, score, className }: TrustOrbProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  const { labelText, labelSub, labelColor } = useMemo(() => {
    if (!risk) return { labelText: "STANDBY", labelSub: "AWAITING DATA", labelColor: "#00e5ff" };
    if (risk === "Low") return { labelText: "TRUSTED", labelSub: "LOW THREAT", labelColor: "#00ff88" };
    if (risk === "Medium") return { labelText: "CAUTION", labelSub: "MEDIUM THREAT", labelColor: "#f59e0b" };
    return { labelText: "DANGER", labelSub: "HIGH THREAT", labelColor: "#ef4444" };
  }, [risk]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      {/* Orb — WebGL or CSS */}
      {webglOk === null ? (
        /* SSR / detection pending — show placeholder */
        <div style={{ width: 160, height: 160 }} />
      ) : webglOk ? (
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            overflow: "hidden",
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${labelColor}22`,
            boxShadow: `0 0 30px ${labelColor}18`,
            transition: "box-shadow 0.8s ease, border-color 0.8s ease",
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[3, 3, 3]} intensity={2.5} color={labelColor} />
            <pointLight position={[-3, -2, -2]} intensity={0.8} color="#6366f1" />
            <OrbMesh risk={risk} score={score} />
          </Canvas>
        </div>
      ) : (
        <CssOrb risk={risk} />
      )}

      {/* Label */}
      <div className="text-center">
        <p
          className="text-[11px] font-bold tracking-[0.25em] leading-none"
          style={{
            fontFamily: "'Orbitron', monospace",
            color: labelColor,
            textShadow: `0 0 8px ${labelColor}`,
            transition: "color 0.8s ease, text-shadow 0.8s ease",
          }}
        >
          {labelText}
        </p>
        <p
          className="text-[8px] tracking-[0.2em] mt-1"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}
        >
          {labelSub}
        </p>
      </div>
    </div>
  );
}
