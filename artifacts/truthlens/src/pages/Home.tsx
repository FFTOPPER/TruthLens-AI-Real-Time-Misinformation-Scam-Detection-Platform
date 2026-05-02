import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyzeText, getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ShieldCheck, ScanLine, Zap, Eye } from "lucide-react";
import { Gauge } from "@/components/Gauge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function ScanningDots() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <motion.div
          className="w-20 h-20 rounded-full"
          style={{ border: "2px solid rgba(0, 229, 255, 0.2)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ border: "2px solid rgba(0, 229, 255, 0.4)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0, 229, 255, 0.08)", border: "1px solid rgba(0, 229, 255, 0.5)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <ScanLine className="w-6 h-6" style={{ color: "#00e5ff" }} />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="text-sm tracking-[0.3em] font-semibold"
            style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 10px rgba(0, 229, 255, 0.8)" }}
          >
            SCANNING
          </span>
          <div className="flex items-end gap-1 h-4">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
        >
          PROCESSING TRANSMISSION DATA
        </span>
      </div>
    </div>
  );
}

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
          description: "Intelligence report generated.",
        });
      },
      onError: () => {
        toast({
          title: "Analysis Failed",
          description: "System error during processing.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = () => {
    if (!text.trim() || text.length < 10) {
      toast({ title: "Input Error", description: "Provide at least 10 characters.", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate({ data: { text } });
  };

  const result = analyzeMutation.data;
  const isPending = analyzeMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.3)" }}
            >
              <Eye className="w-4 h-4" style={{ color: "#00e5ff" }} />
            </div>
            <h2
              className="text-2xl font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0, 229, 255, 0.5)" }}
            >
              THREAT ANALYSIS
            </h2>
          </div>
          <p
            className="text-xs tracking-widest ml-11"
            style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}
          >
            DEEP-STATE CREDIBILITY EVALUATION TERMINAL
          </p>
        </motion.div>
        <div className="mt-4" style={{ height: "1px", background: "linear-gradient(90deg, rgba(0, 229, 255, 0.4), rgba(168, 85, 247, 0.4), transparent)" }} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl relative overflow-hidden corner-brackets"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 229, 255, 0.12)",
            boxShadow: "0 0 40px rgba(0, 229, 255, 0.04), inset 0 0 40px rgba(0, 229, 255, 0.02)",
          }}
        >
          <span />
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(0, 229, 255, 0.08)", background: "rgba(0, 229, 255, 0.03)" }}
          >
            <ScanLine className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
            <span
              className="text-[11px] tracking-[0.25em] font-semibold"
              style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}
            >
              INPUT STREAM
            </span>
          </div>

          <div className="p-6">
            <div className="relative">
              <textarea
                placeholder="Paste transmission data here — news article, message, URL content..."
                className="w-full min-h-[280px] resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-all duration-300"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  lineHeight: "1.7",
                }}
                onFocus={e => {
                  e.currentTarget.style.border = "1px solid rgba(0, 229, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 229, 255, 0.08)";
                }}
                onBlur={e => {
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={text}
                onChange={e => setText(e.target.value)}
                data-testid="input-text-analysis"
              />
              {/* Char count */}
              <span
                className="absolute bottom-3 right-3 text-[10px]"
                style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}
              >
                {text.length} chars
              </span>
            </div>

            {/* Animated Submit Button */}
            <div className="mt-5 flex justify-end">
              <motion.button
                onClick={handleSubmit}
                disabled={isPending || !text.trim()}
                className="relative overflow-hidden px-8 py-3 rounded-lg text-xs tracking-[0.25em] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  background: isPending
                    ? "rgba(0, 229, 255, 0.1)"
                    : "linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(168, 85, 247, 0.15))",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  color: "#00e5ff",
                  boxShadow: isPending ? "none" : "0 0 20px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0, 229, 255, 0.05)",
                }}
                whileHover={!isPending && text.trim() ? {
                  scale: 1.02,
                  boxShadow: "0 0 40px rgba(0, 229, 255, 0.4), 0 0 80px rgba(0, 229, 255, 0.15), inset 0 0 20px rgba(0, 229, 255, 0.1)",
                } : {}}
                whileTap={!isPending && text.trim() ? { scale: 0.97 } : {}}
                data-testid="button-submit-analysis"
              >
                {/* Animated shimmer */}
                {!isPending && text.trim() && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.15), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {isPending ? "PROCESSING..." : "INITIATE SCAN"}
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Result card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(168, 85, 247, 0.12)",
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.04), inset 0 0 40px rgba(168, 85, 247, 0.02)",
            minHeight: "420px",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.08)", background: "rgba(168, 85, 247, 0.03)" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
            <span
              className="text-[11px] tracking-[0.25em] font-semibold"
              style={{ fontFamily: "'Space Mono', monospace", color: "#a855f7" }}
            >
              INTELLIGENCE REPORT
            </span>
          </div>

          <div className="p-6 h-full">
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full min-h-[320px] scan-overlay rounded-lg"
                  style={{ background: "rgba(0, 229, 255, 0.02)", border: "1px solid rgba(0, 229, 255, 0.08)" }}
                >
                  <ScanningDots />
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Gauge */}
                  <div
                    className="flex items-center justify-center py-4 rounded-xl"
                    style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <Gauge score={result.credibilityScore} />
                  </div>

                  {/* Explanation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-lg p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p
                      className="text-[10px] tracking-[0.2em] mb-2"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}
                    >
                      ANALYSIS SUMMARY
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.7" }}
                      data-testid="text-explanation"
                    >
                      {result.explanation}
                    </p>
                  </motion.div>

                  {/* Suspicious phrases */}
                  {result.suspiciousPhrases.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
                        <span
                          className="text-[10px] tracking-[0.2em]"
                          style={{ fontFamily: "'Space Mono', monospace", color: "#ef4444" }}
                        >
                          DETECTED ANOMALIES
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.suspiciousPhrases.map((phrase, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{
                              background: "rgba(239, 68, 68, 0.06)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                          >
                            <span
                              className="text-[10px] mt-0.5 flex-shrink-0 font-bold"
                              style={{ color: "rgba(239, 68, 68, 0.5)", fontFamily: "'Space Mono', monospace" }}
                            >
                              [{String(i + 1).padStart(2, "0")}]
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: "#fca5a5",
                                fontFamily: "'Space Mono', monospace",
                                textDecoration: "underline",
                                textDecorationColor: "rgba(239, 68, 68, 0.4)",
                                textUnderlineOffset: "3px",
                              }}
                            >
                              {phrase}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4"
                >
                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ border: "1px solid rgba(168, 85, 247, 0.2)", background: "rgba(168, 85, 247, 0.04)" }}
                  >
                    <ShieldCheck className="w-8 h-8" style={{ color: "rgba(168, 85, 247, 0.4)" }} />
                  </motion.div>
                  <div className="text-center">
                    <p
                      className="text-xs tracking-[0.2em]"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}
                    >
                      AWAITING TRANSMISSION
                    </p>
                    <p
                      className="text-[10px] tracking-widest mt-1"
                      style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.1)" }}
                    >
                      SUBMIT TEXT TO BEGIN ANALYSIS
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
