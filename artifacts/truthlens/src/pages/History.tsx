import { useGetAnalysisHistory, getGetAnalysisHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History as HistoryIcon, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function History() {
  const { data: history, isLoading } = useGetAnalysisHistory({
    query: { queryKey: getGetAnalysisHistoryQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b border-primary/20 pb-4">
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3 uppercase tracking-wider">
          <HistoryIcon className="w-8 h-8 text-primary" />
          Intelligence Logs
        </h2>
        <p className="text-muted-foreground font-mono mt-2 text-sm">Historical record of evaluated transmissions.</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card/40 animate-pulse rounded-lg border border-primary/10"></div>
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-primary/20 rounded-lg bg-black/20">
           <HistoryIcon className="w-16 h-16 text-primary/20 mb-4" />
           <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">No records found. Initiate a scan first.</p>
        </div>
      ) : (
        <div className="space-y-4 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-primary/20 z-0"></div>

          {history.map((record, i) => (
            <Card 
              key={record.id} 
              className="border-primary/20 bg-card/60 backdrop-blur hover:border-primary/50 transition-colors relative z-10 overflow-hidden group"
              data-testid={`card-history-record-${record.id}`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent"></div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-6 gap-6">
                
                {/* Score Circle */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center font-mono text-xl font-bold border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                    record.riskLevel === "High" ? "border-destructive text-destructive shadow-destructive/20" :
                    record.riskLevel === "Medium" ? "border-amber-500 text-amber-500 shadow-amber-500/20" :
                    "border-primary text-primary shadow-primary/20"
                  )}>
                    {Math.round(record.credibilityScore)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(record.analyzedAt), "yyyy-MM-dd HH:mm:ss 'UTC'")}
                    </span>
                    <Badge variant={record.riskLevel === "High" ? "destructive" : record.riskLevel === "Medium" ? "outline" : "default"} className={cn("font-mono text-[10px] uppercase tracking-wider", record.riskLevel === "Medium" && "bg-amber-500/20 text-amber-500 border-amber-500/50", record.riskLevel === "Low" && "bg-primary/20 text-primary border-primary/50")}>
                      {record.riskLevel} RISK
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80 italic border-l-2 border-white/10 pl-3 py-1 truncate">
                    "{record.textSnippet}..."
                  </p>
                </div>
                
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                  <ChevronRight />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
