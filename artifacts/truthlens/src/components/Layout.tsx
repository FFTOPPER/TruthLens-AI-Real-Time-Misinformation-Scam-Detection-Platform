import { Link, useLocation } from "wouter";
import { Search, History, BarChart3, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* CRT Overlay Effect */}
      <div className="crt-overlay" />
      
      {/* Sidebar */}
      <div className="w-72 border-r border-border/50 bg-card/80 backdrop-blur flex flex-col z-10 relative">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 text-primary mb-2">
            <ShieldAlert className="w-8 h-8" />
            <h1 className="text-2xl font-bold font-display uppercase tracking-widest glitch-text">TruthLens AI</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-4">
            <div className={cn("w-2 h-2 rounded-full", health?.status === "ok" ? "bg-green-500 animate-pulse" : "bg-destructive")}></div>
            SYSTEM STATUS: {health?.status === "ok" ? "ONLINE" : "OFFLINE"}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-sm font-mono text-sm uppercase tracking-wider transition-all duration-200 border border-transparent",
                  isActive 
                    ? "bg-primary/10 text-primary border-primary/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50 text-xs font-mono text-muted-foreground/50">
          <p>CLASSIFIED - CLEARANCE LEVEL 5</p>
          <p className="mt-1">V. 0.9.4.2</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
