import { useGetAnalysisStats, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ShieldAlert, Activity, Database, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stats() {
  const { data: stats, isLoading } = useGetAnalysisStats({
    query: { queryKey: getGetAnalysisStatsQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b border-primary/20 pb-4">
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3 uppercase tracking-wider">
          <BarChart3 className="w-8 h-8 text-primary" />
          Global Threat Stats
        </h2>
        <p className="text-muted-foreground font-mono mt-2 text-sm">Aggregate intelligence metrics.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card/40 animate-pulse rounded-lg border border-primary/10"></div>
          ))}
        </div>
      ) : !stats || stats.totalAnalyses === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-primary/20 rounded-lg bg-black/20">
           <Database className="w-16 h-16 text-primary/20 mb-4" />
           <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">Insufficient data for statistical analysis.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="border-primary/30 bg-card/60 backdrop-blur relative overflow-hidden group hover:border-primary transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Total Transmissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-display font-bold text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" data-testid="text-total-analyses">
                  {stats.totalAnalyses}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-card/60 backdrop-blur relative overflow-hidden group hover:border-primary transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Avg Credibility Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-5xl font-display font-bold",
                  stats.avgCredibilityScore < 40 ? "text-destructive drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                  stats.avgCredibilityScore < 70 ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                  "text-primary drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                )} data-testid="text-avg-score">
                  {Math.round(stats.avgCredibilityScore)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-card/60 backdrop-blur">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-primary">
                <ShieldAlert className="w-4 h-4" />
                Risk Distribution Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Low Risk */}
                <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded border border-primary/20">
                  <ShieldCheck className="w-10 h-10 text-primary mb-3 opacity-80" />
                  <div className="text-3xl font-bold font-mono text-primary">{stats.riskDistribution.Low}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-2 font-mono">Low Risk</div>
                </div>

                {/* Medium Risk */}
                <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded border border-amber-500/20">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-3 opacity-80" />
                  <div className="text-3xl font-bold font-mono text-amber-500">{stats.riskDistribution.Medium}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-2 font-mono">Medium Risk</div>
                </div>

                {/* High Risk */}
                <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded border border-destructive/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-destructive/5 animate-pulse"></div>
                  <ShieldAlert className="w-10 h-10 text-destructive mb-3 opacity-80 relative z-10" />
                  <div className="text-3xl font-bold font-mono text-destructive relative z-10">{stats.riskDistribution.High}</div>
                  <div className="text-xs text-destructive/80 uppercase tracking-widest mt-2 font-mono relative z-10">High Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
