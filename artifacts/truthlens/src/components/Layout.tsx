import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Globe, BarChart3, ShieldAlert, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Analysis Terminal", icon: Search },
  { href: "/history", label: "Global Intelligence Feed", icon: Globe },
  { href: "/stats", label: "Global Threat Stats", icon: BarChart3 },
];

function SidebarContent({ location, onNavClick }: { location: string; onNavClick?: () => void }) {
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const isOnline = health?.status === "ok";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 sm:p-6 relative" style={{ borderBottom: "1px solid rgba(0, 229, 255, 0.08)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, transparent 60%)" }}
        />
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(0, 229, 255, 0.1)",
              border: "1px solid rgba(0, 229, 255, 0.3)",
              boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)",
            }}
            whileHover={{ scale: 1.06, boxShadow: "0 0 30px rgba(0,229,255,0.4)" }}
          >
            <ShieldAlert className="w-5 h-5" style={{ color: "#00e5ff" }} />
          </motion.div>
          <div>
            <h1
              className="text-lg font-bold tracking-widest leading-none"
              style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0, 229, 255, 0.6)" }}
            >
              TRUTHLENS
            </h1>
            <p className="text-[10px] tracking-[0.2em] mt-1" style={{ color: "rgba(168, 85, 247, 0.8)", fontFamily: "'Space Mono', monospace" }}>
              AI ANALYSIS SYSTEM
            </p>
          </div>
        </div>

        {/* System status */}
        <div className="flex items-center gap-2 relative z-10">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              backgroundColor: isOnline ? "#00e5ff" : "#ef4444",
              boxShadow: isOnline ? "0 0 8px #00e5ff" : "0 0 8px #ef4444",
            }}
          />
          <span className="text-[10px] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}>
            SYS {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {NAV_ITEMS.map((item, i) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onNavClick} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer relative overflow-hidden group"
                style={{
                  background: isActive ? "rgba(0, 229, 255, 0.08)" : "transparent",
                  border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
                  boxShadow: isActive ? "0 0 20px rgba(0, 229, 255, 0.08), inset 0 0 20px rgba(0, 229, 255, 0.04)" : "none",
                }}
              >
                {/* Hover bg */}
                {!isActive && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "opacity 0.2s ease",
                    }}
                  />
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    layoutId="activeBar"
                    style={{ background: "linear-gradient(180deg, #00e5ff, #a855f7)", boxShadow: "0 0 10px #00e5ff" }}
                  />
                )}

                <item.icon
                  className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
                  style={{ color: isActive ? "#00e5ff" : "rgba(255,255,255,0.35)" }}
                />
                <span
                  className={cn("text-xs tracking-[0.08em] font-semibold transition-colors duration-200", isActive ? "" : "group-hover:text-white/60")}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    color: isActive ? "#00e5ff" : "rgba(255,255,255,0.4)",
                    textShadow: isActive ? "0 0 10px rgba(0, 229, 255, 0.5)" : "none",
                    letterSpacing: "0.08em",
                    fontSize: "11px",
                  }}
                >
                  {item.label.toUpperCase()}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[9px] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.18)" }}>
          CLASSIFIED · CLEARANCE LVL 5
        </p>
        <p className="text-[9px] tracking-[0.1em] mt-1" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.12)" }}>
          BUILD v0.9.4.2
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Animated background */}
      <div className="app-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <div
        className="hidden lg:flex w-72 flex-col z-20 relative flex-shrink-0"
        style={{
          background: "rgba(8, 8, 8, 0.92)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0, 229, 255, 0.09)",
          boxShadow: "4px 0 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <SidebarContent location={location} />
      </div>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(8,8,8,0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 229, 255, 0.09)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)" }}
          >
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
          </div>
          <span
            className="text-sm font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 12px rgba(0,229,255,0.5)" }}
          >
            TRUTHLENS
          </span>
        </div>

        {/* Current page label */}
        <span
          className="text-[9px] tracking-[0.2em] hidden sm:block"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
        >
          {NAV_ITEMS.find(n => n.href === location)?.label.toUpperCase() ?? ""}
        </span>

        {/* Hamburger */}
        <motion.button
          onClick={() => setDrawerOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          whileHover={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.25)" }}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle navigation"
        >
          <AnimatePresence mode="wait">
            {drawerOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X className="w-4 h-4" style={{ color: "#00e5ff" }} />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Menu className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="nav-backdrop lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
              style={{
                background: "rgba(8,8,8,0.98)",
                backdropFilter: "blur(24px)",
                borderRight: "1px solid rgba(0,229,255,0.12)",
                boxShadow: "8px 0 40px rgba(0,0,0,0.7)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <SidebarContent location={location} onNavClick={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-10 lg:pt-0 pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
