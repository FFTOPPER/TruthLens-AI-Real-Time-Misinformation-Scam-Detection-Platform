import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, History, Globe, Settings,
  ShieldAlert, ChevronLeft, Menu, X, Activity,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/",         label: "Dashboard",           icon: LayoutDashboard, sub: "ANALYSIS TERMINAL" },
  { href: "/history",  label: "Scan History",         icon: History,         sub: "INTELLIGENCE FEED" },
  { href: "/stats",    label: "Global Intelligence",  icon: Globe,           sub: "THREAT METRICS" },
  { href: "/settings", label: "Settings",             icon: Settings,        sub: "SYSTEM CONFIG" },
];

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

/* ─── Sidebar nav item ─────────────────────────────────────────── */
function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 3 }}
        whileTap={{ scale: 0.96 }}
        className="relative flex items-center rounded-xl cursor-pointer overflow-hidden group"
        style={{
          padding: collapsed ? "10px 0" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "12px",
          background: isActive ? "rgba(0,229,255,0.07)" : "transparent",
          border: isActive
            ? "1px solid rgba(0,229,255,0.18)"
            : "1px solid transparent",
          boxShadow: isActive ? "0 0 18px rgba(0,229,255,0.06)" : "none",
          transition: "background 0.2s, border-color 0.2s, padding 0.3s, justify-content 0.3s",
        }}
      >
        {/* hover bg */}
        {!isActive && (
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "opacity 0.2s",
            }}
          />
        )}

        {/* active left bar */}
        {isActive && (
          <motion.div
            layoutId="activeBar"
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{
              background: "linear-gradient(180deg, #00e5ff, #a855f7)",
              boxShadow: "0 0 10px #00e5ff",
            }}
          />
        )}

        {/* Icon */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <Icon
            className="w-[18px] h-[18px] transition-colors duration-200"
            style={{ color: isActive ? "#00e5ff" : "rgba(255,255,255,0.3)" }}
          />
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(0,229,255,0.15)", filter: "blur(6px)" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="flex flex-col leading-none">
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: isActive ? "#00e5ff" : "rgba(255,255,255,0.55)",
                    textShadow: isActive ? "0 0 10px rgba(0,229,255,0.4)" : "none",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    color: isActive ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.2)",
                    whiteSpace: "nowrap",
                    marginTop: "2px",
                  }}
                >
                  {item.sub}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed tooltip */}
        {collapsed && (
          <div
            className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 z-50 whitespace-nowrap"
            style={{
              background: "rgba(8,8,8,0.96)",
              border: "1px solid rgba(0,229,255,0.2)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", fontWeight: 600, color: "#00e5ff", letterSpacing: "0.06em" }}>
              {item.label}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

/* ─── Sidebar content ──────────────────────────────────────────── */
function SidebarContent({
  location,
  collapsed,
  onToggle,
  onNavClick,
  showToggle = true,
}: {
  location: string;
  collapsed: boolean;
  onToggle?: () => void;
  onNavClick?: () => void;
  showToggle?: boolean;
}) {
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const isOnline = health?.status === "ok";

  return (
    <div className="flex flex-col h-full select-none">
      {/* ── Logo header ── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          padding: collapsed ? "20px 0 16px" : "20px 16px 16px",
          borderBottom: "1px solid rgba(0,229,255,0.07)",
          background: "linear-gradient(135deg, rgba(0,229,255,0.04) 0%, transparent 60%)",
          transition: "padding 0.3s",
        }}
      >
        <div
          className="flex items-center"
          style={{
            gap: collapsed ? 0 : "12px",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "justify-content 0.3s",
          }}
        >
          {/* Logo icon */}
          <motion.div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(0,229,255,0.1)",
              border: "1px solid rgba(0,229,255,0.28)",
              boxShadow: "0 0 18px rgba(0,229,255,0.18)",
            }}
            whileHover={{ scale: 1.08, boxShadow: "0 0 28px rgba(0,229,255,0.35)" }}
          >
            <ShieldAlert className="w-4.5 h-4.5" style={{ color: "#00e5ff", width: 18, height: 18 }} />
          </motion.div>

          {/* Brand text */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div>
                  <h1
                    className="text-base font-bold tracking-widest leading-none"
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      color: "#00e5ff",
                      textShadow: "0 0 16px rgba(0,229,255,0.55)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    TRUTHLENS
                  </h1>
                  <p
                    className="text-[9px] tracking-[0.18em] mt-1"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(168,85,247,0.75)", whiteSpace: "nowrap" }}
                  >
                    AI ANALYSIS SYSTEM
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System status pill */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 mt-3"
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: isOnline ? "#00e5ff" : "#ef4444",
                  boxShadow: isOnline ? "0 0 6px #00e5ff" : "0 0 6px #ef4444",
                }}
              />
              <span
                className="text-[9px] tracking-[0.15em]"
                style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
              >
                SYS {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed status dot */}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: isOnline ? "#00e5ff" : "#ef4444",
                boxShadow: isOnline ? "0 0 6px #00e5ff" : "0 0 6px #ef4444",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Collapse toggle (desktop) ── */}
      {showToggle && onToggle && (
        <div
          className="flex-shrink-0 px-3 py-2.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <motion.button
            onClick={onToggle}
            className="w-full flex items-center rounded-lg px-2 py-2 group"
            style={{
              justifyContent: collapsed ? "center" : "space-between",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "justify-content 0.3s",
            }}
            whileHover={{ background: "rgba(0,229,255,0.06)", borderColor: "rgba(0,229,255,0.2)" }}
            whileTap={{ scale: 0.96 }}
          >
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}
                >
                  COLLAPSE PANEL
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            </motion.div>
          </motion.button>
        </div>
      )}

      {/* ── Nav label ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-4 pt-4 pb-1 flex-shrink-0"
          >
            <span
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.18)" }}
            >
              NAVIGATION
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1">
        {NAV_ITEMS.map((item, i) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.28 }}
          >
            <NavItem
              item={item}
              isActive={location === item.href}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          </motion.div>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", flexShrink: 0 }} />

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 flex items-center"
        style={{
          padding: collapsed ? "12px 0" : "12px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "8px",
          transition: "padding 0.3s",
        }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          <Activity className="w-3 h-3" style={{ color: "rgba(168,85,247,0.5)" }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-shrink-0"
            >
              <p className="text-[8px] tracking-[0.14em] whitespace-nowrap" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.18)" }}>
                CLEARANCE LVL 5 · v0.9.4.2
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Layout ───────────────────────────────────────────────────── */
export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // Lock body scroll on mobile drawer
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  // Page heading for mobile bar
  const activeItem = NAV_ITEMS.find(n => n.href === location);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: "#080a0f" }}>
      {/* Animated background */}
      <div className="app-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ══ DESKTOP SIDEBAR ══════════════════════════════════════ */}
      <motion.aside
        className="hidden lg:flex flex-col flex-shrink-0 z-20 relative"
        animate={{ width: sidebarW }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: "rgba(6,8,14,0.94)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0,229,255,0.08)",
          boxShadow: "2px 0 40px rgba(0,0,0,0.55)",
          overflow: "hidden",
          minWidth: sidebarW,
        }}
      >
        {/* Subtle top-left glow accent */}
        <div
          className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 100%, rgba(168,85,247,0.05) 0%, transparent 70%)" }}
        />

        <SidebarContent
          location={location}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          showToggle
        />
      </motion.aside>

      {/* Sidebar resize handle (desktop) */}
      <div
        className="hidden lg:block w-px flex-shrink-0 z-20"
        style={{ background: "rgba(0,229,255,0.06)" }}
      />

      {/* ══ MOBILE TOP BAR ════════════════════════════════════════ */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(6,8,14,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,229,255,0.08)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.24)" }}
          >
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
          </div>
          <span
            className="text-sm font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 12px rgba(0,229,255,0.45)" }}
          >
            TRUTHLENS
          </span>
        </div>

        {activeItem && (
          <span
            className="text-[9px] tracking-[0.2em] hidden sm:block"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.28)" }}
          >
            {activeItem.sub}
          </span>
        )}

        <motion.button
          onClick={() => setMobileOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          whileHover={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.24)" }}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle navigation"
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}>
                <X className="w-4 h-4" style={{ color: "#00e5ff" }} />
              </motion.div>
            ) : (
              <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}>
                <Menu className="w-4 h-4" style={{ color: "rgba(255,255,255,0.55)" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ══ MOBILE DRAWER ════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="nav-backdrop lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 z-50 lg:hidden flex flex-col overflow-hidden"
              style={{
                width: SIDEBAR_EXPANDED,
                background: "rgba(6,8,14,0.99)",
                backdropFilter: "blur(24px)",
                borderRight: "1px solid rgba(0,229,255,0.12)",
                boxShadow: "6px 0 40px rgba(0,0,0,0.7)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 310, damping: 34 }}
            >
              <SidebarContent
                location={location}
                collapsed={false}
                onNavClick={() => setMobileOpen(false)}
                showToggle={false}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-14 lg:pt-0">
        {/* Top bar strip — desktop only */}
        <div
          className="hidden lg:flex items-center justify-between px-8 h-12 flex-shrink-0 sticky top-0 z-10"
          style={{
            background: "rgba(6,8,14,0.8)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>
              TRUTHLENS
            </span>
            <span style={{ color: "rgba(0,229,255,0.3)", fontSize: "10px" }}>›</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(0,229,255,0.5)" }}>
              {activeItem?.sub ?? ""}
            </span>
          </div>

          {/* Right: live indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
            />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)" }}>
              LIVE FEED ACTIVE
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
