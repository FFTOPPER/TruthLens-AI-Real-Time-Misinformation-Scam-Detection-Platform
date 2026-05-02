import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnalyzeText, getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Fingerprint, ShieldCheck, Search, Activity, ScanLine } from "lucide-react";
import { Gauge } from "@/components/Gauge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useAnalyzeText({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        toast({
          title: "Analysis Complete",
          description: "Intelligence report generated successfully.",
          className: "border-primary bg-background font-mono text-primary",
        });
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: "System error during text processing.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = () => {
    if (!text.trim() || text.length < 10) {
      toast({
        title: "Input Error",
        description: "Please provide a sufficient text snippet for analysis.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate({ data: { text } });
  };

  const result = analyzeMutation.data;
  const isPending = analyzeMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b border-primary/20 pb-4">
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3 uppercase tracking-wider">
          <ScanLine className="w-8 h-8 text-primary" />
          Threat Analysis Terminal
        </h2>
        <p className="text-muted-foreground font-mono mt-2 text-sm">Enter raw data snippet for deep-state credibility evaluation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/20 bg-card/50 backdrop-blur shadow-xl overflow-hidden relative">
          {/* Decorative corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50"></div>

          <CardHeader className="border-b border-primary/10 pb-4 bg-white/5">
            <CardTitle className="text-sm font-mono flex items-center gap-2 text-primary uppercase tracking-widest">
              <Activity className="w-4 h-4" />
              Input Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <Textarea
                placeholder="Paste transmission data here..."
                className="min-h-[300px] font-mono text-sm bg-black/40 border-primary/20 focus-visible:ring-primary/50 resize-none text-primary-foreground placeholder:text-muted-foreground/50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                data-testid="input-text-analysis"
              />
              
              {isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center border border-primary/30 rounded-md overflow-hidden">
                  <div className="w-full h-1 bg-primary/50 absolute top-0 animate-[scan_2s_linear_infinite]" style={{ boxShadow: "0 0 15px 2px hsl(var(--primary))" }}></div>
                  <Search className="w-12 h-12 text-primary animate-pulse mb-4" />
                  <p className="font-mono text-primary animate-pulse tracking-widest text-sm">ANALYZING SIGNAL...</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={isPending || !text.trim()}
                className="font-mono tracking-widest uppercase bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                data-testid="button-submit-analysis"
              >
                {isPending ? "Processing..." : "Initiate Scan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result ? (
          <Card className="border-primary/30 bg-card/50 backdrop-blur shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden animate-in fade-in zoom-in duration-500">
             {/* Decorative grid background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

            <CardHeader className="border-b border-primary/20 pb-4 bg-primary/5 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-mono flex items-center gap-2 text-primary uppercase tracking-widest">
                  <Fingerprint className="w-4 h-4" />
                  Intelligence Report
                </CardTitle>
                <Badge variant={result.riskLevel === "High" ? "destructive" : result.riskLevel === "Medium" ? "outline" : "default"} className={cn("font-mono font-bold uppercase tracking-wider", result.riskLevel === "Medium" && "bg-amber-500/20 text-amber-500 border-amber-500/50", result.riskLevel === "Low" && "bg-primary/20 text-primary border-primary/50")} data-testid={`status-risk-${result.riskLevel}`}>
                  {result.riskLevel === "High" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {result.riskLevel === "Low" && <ShieldCheck className="w-3 h-3 mr-1" />}
                  Risk: {result.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-8 relative z-10">
              <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-lg border border-white/5">
                <Gauge score={result.credibilityScore} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Analysis Summary</h4>
                <p className="text-sm leading-relaxed text-foreground/90 font-sans" data-testid="text-explanation">
                  {result.explanation}
                </p>
              </div>

              {result.suspiciousPhrases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-destructive uppercase tracking-widest border-b border-destructive/20 pb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Detected Anomalies
                  </h4>
                  <ul className="space-y-2">
                    {result.suspiciousPhrases.map((phrase, i) => (
                      <li key={i} className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm font-mono text-destructive-foreground animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}>
                        <span className="text-destructive font-bold mr-2 opacity-50">&gt;</span> 
                        <span className="bg-destructive/20 text-destructive px-1 leading-loose">{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-primary/20 rounded-lg bg-black/20">
             <ShieldCheck className="w-16 h-16 text-primary/20 mb-4" />
             <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">Awaiting transmission...</p>
          </div>
        )}
      </div>
    </div>
  );
}
