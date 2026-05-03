import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, History, Globe, Settings,
  ShieldAlert, ChevronLeft, Menu, X, Activity, FileImage, BrainCircuit, Film,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const F = "Inter, system-ui, sans-serif";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/",            label: "Dashboard",           icon: LayoutDashboard, sub: "Analysis Terminal" },
  { href: "/history",     label: "Scan History",        icon: History,         sub: "Intelligence Feed" },
  { href: "/stats",       label: "Global Intelligence", icon: Globe,           sub: "Threat Metrics" },
  { href: "/image-scan",  label: "Image Scan",          icon: FileImage,       sub: "OCR · AI Analysis" },
  { href: "/video-scan",  label: "Video Scan",          icon: Film,            sub: "Deepfake · Misinfo" },
  { href: "/what-if",     label: "What If?",            icon: BrainCircuit,    sub: "Interactive Simulator" },
  { href: "/settings",    label: "Settings",            icon: Settings,        sub: "System Config" },
];

const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 64;

/* ─── Sidebar nav item ─────────────────────────────────────────── */
function NavItem({
  item, isActive, collapsed, onClick,
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
        whileHover={{ x: collapsed ? 0 : 2 }}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center rounded-lg cursor-pointer overflow-hidden group"
        style={{
          padding: collapsed ? "10px 0" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "10px",
          background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
          borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
          transition: "background 0.15s, border-color 0.15s, padding 0.3s",
        }}
      >
        {/* Hover bg */}
        {!isActive && (
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{ background: "rgba(255,255,255,0.04)", transition: "opacity 0.15s" }}
          />
        )}

        {/* Icon */}
        <Icon
          className="w-[17px] h-[17px] flex-shrink-0 transition-colors duration-200"
          style={{ color: isActive ? "#3b82f6" : "rgba(255,255,255,0.28)" }}
        />

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
                <span style={{
                  fontFamily: F,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: isActive ? "#e2e8f0" : "rgba(255,255,255,0.5)",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: F,
                  fontSize: "10px",
                  fontWeight: 400,
                  color: isActive ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.18)",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                }}>
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
              background: "#161b27",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontFamily: F, fontSize: "12px", fontWeight: 500, color: "#e2e8f0" }}>
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
  location, collapsed, onToggle, onNavClick, showToggle = true,
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
        className="flex-shrink-0"
        style={{
          padding: collapsed ? "18px 0 14px" : "18px 16px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          transition: "padding 0.3s",
        }}
      >
        <div
          className="flex items-center"
          style={{
            gap: collapsed ? 0 : "10px",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "justify-content 0.3s",
          }}
        >
          {/* Logo icon */}
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
            whileHover={{ scale: 1.06 }}
          >
            <ShieldAlert className="w-4 h-4" style={{ color: "#3b82f6" }} />
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
                  <h1 style={{
                    fontFamily: F,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#e2e8f0",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}>
                    TruthLens AI
                  </h1>
                  <p style={{
                    fontFamily: F,
                    fontSize: "10px",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.3)",
                    whiteSpace: "nowrap",
                    marginTop: "1px",
                  }}>
                    Misinformation Detection
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
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ background: isOnline ? "#22c55e" : "#ef4444" }}
              />
              <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.28)" }}>
                System {isOnline ? "Online" : "Offline"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed status dot */}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ background: isOnline ? "#22c55e" : "#ef4444" }}
            />
          </div>
        )}
      </div>

      {/* ── Collapse toggle (desktop) ── */}
      {showToggle && onToggle && (
        <div className="flex-shrink-0 px-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <motion.button
            onClick={onToggle}
            className="w-full flex items-center rounded-lg px-2 py-1.5 group"
            style={{
              justifyContent: collapsed ? "center" : "space-between",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "justify-content 0.3s",
            }}
            whileHover={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.2)" }}
            whileTap={{ scale: 0.97 }}
          >
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  style={{ fontFamily: F, fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}
                >
                  Collapse sidebar
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.28)" }} />
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
            <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, letterSpacing: "0.05em", color: "rgba(255,255,255,0.16)", textTransform: "uppercase" as const }}>
              Navigation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
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
      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 flex items-center"
        style={{
          padding: collapsed ? "10px 0" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "8px",
          transition: "padding 0.3s",
        }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
        >
          <Activity className="w-2.5 h-2.5" style={{ color: "rgba(59,130,246,0.4)" }} />
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
              <p style={{ fontFamily: F, fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                v0.9.4 · AI Analysis System
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

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const activeItem = NAV_ITEMS.find(n => n.href === location);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: "#0f1117" }}>
      {/* Background */}
      <div className="app-bg" />

      {/* ══ DESKTOP SIDEBAR ══════════════════════════════════════ */}
      <motion.aside
        className="hidden lg:flex flex-col flex-shrink-0 z-20 relative"
        animate={{ width: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: "#0b0e14",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "2px 0 24px rgba(0,0,0,0.4)",
          overflow: "hidden",
          minWidth: sidebarW,
        }}
      >
        <SidebarContent
          location={location}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          showToggle
        />
      </motion.aside>

      {/* Sidebar divider */}
      <div className="hidden lg:block w-px flex-shrink-0 z-20" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* ══ MOBILE TOP BAR ════════════════════════════════════════ */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(11,14,20,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)" }}
          >
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
          </div>
          <span style={{ fontFamily: F, fontSize: "14px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
            TruthLens AI
          </span>
        </div>

        {activeItem && (
          <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.25)" }}
            className="hidden sm:block">
            {activeItem.sub}
          </span>
        )}

        <motion.button
          onClick={() => setMobileOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          whileHover={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.2)" }}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle navigation"
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
                <X className="w-4 h-4" style={{ color: "#3b82f6" }} />
              </motion.div>
            ) : (
              <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
                <Menu className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
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
                background: "#0b0e14",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "6px 0 32px rgba(0,0,0,0.6)",
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
          className="hidden lg:flex items-center justify-between px-8 h-11 flex-shrink-0 sticky top-0 z-10"
          style={{
            background: "rgba(15,17,23,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.2)" }}>
              TruthLens
            </span>
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "12px" }}>›</span>
            <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>
              {activeItem?.label ?? ""}
            </span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ background: "#22c55e" }}
            />
            <span style={{ fontFamily: F, fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.2)" }}>
              Live feed active
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
