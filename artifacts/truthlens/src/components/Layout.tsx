import { Link, useLocation } from "wouter";
import { Search, History, BarChart3, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });

  const navItems = [
    { href: "/", label: "Analysis Terminal", icon: Search },
    { href: "/history", label: "Intelligence Logs", icon: History },
    { href: "/stats", label: "Global Threat Stats", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Sidebar */}
      <div
        className="w-72 flex flex-col z-20 relative flex-shrink-0"
        style={{
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(0, 229, 255, 0.1)",
          boxShadow: "4px 0 30px rgba(0, 229, 255, 0.05)",
        }}
      >
        {/* Logo area */}
        <div className="p-6 relative" style={{ borderBottom: "1px solid rgba(0, 229, 255, 0.08)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, rgba(0, 229, 255, 0.04) 0%, transparent 60%)" }}
          />
          <div className="flex items-center gap-3 relative z-10 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(0, 229, 255, 0.1)",
                border: "1px solid rgba(0, 229, 255, 0.3)",
                boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)",
              }}
            >
              <ShieldAlert className="w-5 h-5" style={{ color: "#00e5ff" }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-widest leading-none"
                style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0, 229, 255, 0.6)" }}
              >
                TRUTHLENS
              </h1>
              <p className="text-[10px] tracking-[0.2em] mt-0.5" style={{ color: "rgba(168, 85, 247, 0.8)", fontFamily: "'Space Mono', monospace" }}>
                AI ANALYSIS SYSTEM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ backgroundColor: health?.status === "ok" ? "#00e5ff" : "#ef4444", boxShadow: health?.status === "ok" ? "0 0 6px #00e5ff" : "0 0 6px #ef4444" }}
            />
            <span className="text-[10px] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}>
              SYS {health?.status === "ok" ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item, i) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer relative overflow-hidden"
                  style={{
                    background: isActive ? "rgba(0, 229, 255, 0.08)" : "transparent",
                    border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
                    boxShadow: isActive ? "0 0 20px rgba(0, 229, 255, 0.08), inset 0 0 20px rgba(0, 229, 255, 0.04)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                      layoutId="activeIndicator"
                      style={{ background: "linear-gradient(180deg, #00e5ff, #a855f7)", boxShadow: "0 0 8px #00e5ff" }}
                    />
                  )}
                  <item.icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? "#00e5ff" : "rgba(255,255,255,0.4)" }}
                  />
                  <span
                    className="text-xs tracking-[0.1em] font-semibold"
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      color: isActive ? "#00e5ff" : "rgba(255,255,255,0.5)",
                      textShadow: isActive ? "0 0 10px rgba(0, 229, 255, 0.5)" : "none",
                    }}
                  >
                    {item.label.toUpperCase()}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
            CLASSIFIED · CLEARANCE LVL 5
          </p>
          <p className="text-[9px] tracking-[0.1em] mt-1" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.15)" }}>
            BUILD v0.9.4.2
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
