import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Mic, MicOff, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  credibilityScore: number;
  riskLevel: string;
  explanation: string;
  suspiciousPhrases: string[];
  manipulationBreakdown: {
    fear: number;
    urgency: number;
    emotionalTriggers: number;
    fakeAuthority: number;
  };
}

interface VoiceControlsProps {
  result: AnalysisResult | null;
}

const SpeechRecognitionAPI =
  (typeof window !== "undefined" &&
    ((window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition)) as
  | (new () => SpeechRecognition)
  | null;

/* ─── Pick best MALE voice — bold, deep, clear ────────────────── */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  // Explicit known male voices by name (cross-platform)
  const maleNames = ["david", "mark", "alex", "daniel", "fred", "rishi", "aaron", "noel", "thomas", "oliver", "james", "guy"];

  return (
    // 1. Known male voices by name
    voices.find(v => v.lang.startsWith("en") && maleNames.some(m => v.name.toLowerCase().includes(m))) ||
    // 2. Google UK/US English Male explicit
    voices.find(v => v.name === "Google UK English Male") ||
    voices.find(v => v.name === "Google US English") ||
    // 3. Microsoft David or Mark (Windows)
    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("microsoft") && maleNames.some(m => v.name.toLowerCase().includes(m))) ||
    // 4. en-IN male (Rishi on Apple)
    voices.find(v => v.lang === "en-IN") ||
    // 5. Any Google English
    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ||
    // 6. Any English
    voices.find(v => v.lang.startsWith("en-US")) ||
    voices.find(v => v.lang.startsWith("en")) ||
    null
  );
}

/* ─── Ultra-short 2-sentence verdict ─────────────────────────── */
function buildSpeechText(result: AnalysisResult): string {
  const { riskLevel: risk, credibilityScore: score, manipulationBreakdown: mb } = result;

  const topSignal =
    mb.fear >= 60            ? "fear tactics" :
    mb.urgency >= 60         ? "urgency pressure" :
    mb.emotionalTriggers >= 60 ? "emotional manipulation" :
    mb.fakeAuthority >= 60   ? "fake authority" :
    null;

  if (risk === "Low") {
    return `This content scores ${score} out of 100 — it looks credible. ` +
           (topSignal ? `Mild ${topSignal} detected, but nothing serious.` : `No manipulation signals found. Safe to read.`);
  }

  if (risk === "Medium") {
    return `This content scores ${score} out of 100 — proceed with caution. ` +
           (topSignal ? `Watch out for ${topSignal}.` : `Some suspicious patterns were detected. Verify before sharing.`);
  }

  return `Warning. This content scores only ${score} out of 100 — it is high risk. ` +
         (topSignal ? `Heavy ${topSignal} detected. Do not trust or share this.` : `Multiple manipulation signals found. Do not trust this content.`);
}

/* ─── Natural Q&A answers ─────────────────────────────────────── */
function buildAnswer(question: string, res: AnalysisResult): string {
  const q = question.toLowerCase();
  const { credibilityScore: score, riskLevel: risk, explanation, manipulationBreakdown: mb, suspiciousPhrases } = res;

  if (q.includes("fake") || q.includes("misinformation") || q.includes("why")) {
    return `Okay so basically, this is ${risk.toLowerCase()} risk because — ${explanation} That is the main reason.`;
  }
  if (q.includes("score") || q.includes("trust") || q.includes("credib")) {
    return `The credibility score is ${score} out of 100. That means it is ${risk.toLowerCase()} risk. ${score >= 70 ? "Pretty credible, actually." : score >= 40 ? "In the medium range — so read carefully." : "Quite low, to be honest. Do not trust this easily."}`;
  }
  if (q.includes("fear")) {
    return mb.fear >= 55
      ? `Fear tactics scored ${mb.fear} out of 100 — that is quite high. This content is using threatening or alarming language to scare you into acting.`
      : `Fear tactics scored ${mb.fear} out of 100. That is fairly low, so fear is not a major concern here.`;
  }
  if (q.includes("urgent") || q.includes("urgency")) {
    return mb.urgency >= 55
      ? `Urgency language scored ${mb.urgency} out of 100 — pretty high. The content is pushing you to act fast, which is a classic manipulation technique.`
      : `Urgency language scored ${mb.urgency} out of 100. Not too bad — limited pressure tactics detected.`;
  }
  if (q.includes("emotion") || q.includes("trigger")) {
    return `Emotional triggers scored ${mb.emotionalTriggers} out of 100. ${mb.emotionalTriggers >= 55 ? "This content is trying to provoke strong feelings — outrage, sympathy, or tribalism." : "Emotional manipulation is relatively low in this content."}`;
  }
  if (q.includes("author") || q.includes("expert") || q.includes("source")) {
    return mb.fakeAuthority >= 55
      ? `Fake authority scored ${mb.fakeAuthority} out of 100 — that is a concern. This content is referencing unverified experts or misleading credentials.`
      : `Fake authority scored ${mb.fakeAuthority} out of 100. No major issues with sources here.`;
  }
  if (q.includes("suspicious") || q.includes("phrase") || q.includes("flagged")) {
    return suspiciousPhrases.length === 0
      ? `Actually, no suspicious phrases were flagged in this content. That is good.`
      : `${suspiciousPhrases.length} suspicious phrase${suspiciousPhrases.length > 1 ? "s were" : " was"} flagged, including — ${suspiciousPhrases.slice(0, 2).join("; ")}. Watch out for those.`;
  }
  return `So here is the full picture — ${explanation} Overall, this is ${risk.toLowerCase()} risk with a score of ${score} out of 100.`;
}

/* ─── Fallback: browser Web Speech (male pitch) ──────────────── */
function speakFallback(text: string, onStart: () => void, onEnd: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const go = () => {
    const utt = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utt.voice = voice;
    utt.rate = 0.97; utt.pitch = 0.78; utt.volume = 1;
    utt.onstart = onStart;
    utt.onend   = onEnd;
    utt.onerror = onEnd;
    window.speechSynthesis.speak(utt);
  };
  if (window.speechSynthesis.getVoices().length > 0) go();
  else window.speechSynthesis.onvoiceschanged = go;
}

/* ─── Component ───────────────────────────────────────────────── */
export function VoiceControls({ result }: VoiceControlsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isLoading,  setIsLoading]    = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);

  const hasMic = !!SpeechRecognitionAPI;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  /* Primary: OpenAI fable via API → fallback to browser TTS */
  const speakResult = useCallback(async () => {
    if (!result || isLoading) return;
    const text = buildSpeechText(result);

    audioRef.current?.pause();
    window.speechSynthesis?.cancel();

    // Instant visual feedback — button reacts immediately
    setIsLoading(true);

    try {
      const res = await fetch("/api/analysis/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS API error");

      // Stream audio — start playing as soon as first bytes arrive
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.oncanplaythrough = () => {
        setIsLoading(false);
        setIsSpeaking(true);
      };
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsLoading(false); setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.load();
      await audio.play();
      setIsLoading(false);
      setIsSpeaking(true);
    } catch {
      setIsLoading(false);
      speakFallback(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  }, [result, isLoading]);

  /* Q&A mic answers still use browser TTS (fast, no round-trip needed) */
  const speak = useCallback((text: string) => {
    audioRef.current?.pause();
    speakFallback(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, []);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!hasMic || !result) return;
    const recognition = new SpeechRecognitionAPI!();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Mic Error", description: "Could not access microphone.", variant: "destructive" });
    };
    recognition.onresult = (event) => {
      const q = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(q);
      speak(buildAnswer(q, result));
    };
    recognition.start();
  }, [hasMic, result, toast, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(0,229,255,0.12)", background: "rgba(0,229,255,0.02)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,229,255,0.03)" }}
      >
        <Volume2 className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
        <span className="text-[10px] tracking-[0.2em] font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}>
          VOICE READOUT
        </span>
        <AnimatePresence>
          {isSpeaking && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-auto text-[9px] tracking-widest"
              style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}
            >
              ◉ SPEAKING
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Speak / Loading / Stop */}
        <motion.button
          onClick={isSpeaking ? stopSpeaking : speakResult}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold relative overflow-hidden"
          style={{
            fontFamily: "'Orbitron', monospace",
            background: isSpeaking
              ? "rgba(239,68,68,0.1)"
              : isLoading
              ? "rgba(255,165,0,0.08)"
              : "rgba(0,229,255,0.08)",
            border: isSpeaking
              ? "1px solid rgba(239,68,68,0.35)"
              : isLoading
              ? "1px solid rgba(255,165,0,0.35)"
              : "1px solid rgba(0,229,255,0.25)",
            color: isSpeaking ? "#ef4444" : isLoading ? "#ffa500" : "#00e5ff",
            cursor: isLoading ? "default" : "pointer",
          }}
          whileHover={isLoading ? {} : { scale: 1.03 }}
          whileTap={isLoading ? {} : { scale: 0.97 }}
        >
          {/* Loading shimmer sweep */}
          {isLoading && (
            <motion.div
              className="absolute inset-0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,165,0,0.15), transparent)" }}
            />
          )}
          {isSpeaking ? (
            <><Square className="w-3 h-3" /> STOP</>
          ) : isLoading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Volume2 className="w-3 h-3" />
              </motion.div>
              PREPARING…
            </>
          ) : (
            <><Volume2 className="w-3 h-3" /> SPEAK</>
          )}
        </motion.button>

        {/* Mic */}
        {hasMic && (
          <motion.button
            onClick={isListening ? stopListening : startListening}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold relative overflow-hidden"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: isListening ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.06)",
              border: isListening ? "1px solid rgba(168,85,247,0.45)" : "1px solid rgba(168,85,247,0.2)",
              color: isListening ? "#a855f7" : "rgba(168,85,247,0.7)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{ opacity: [0.1, 0.28, 0.1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                style={{ background: "rgba(168,85,247,0.18)" }}
              />
            )}
            {isListening ? (
              <>
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  <MicOff className="w-3 h-3" />
                </motion.div>
                LISTENING…
              </>
            ) : (
              <><Mic className="w-3 h-3" /> ASK ME</>
            )}
          </motion.button>
        )}

        {/* Waveform */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-0.5 ml-auto overflow-hidden"
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: "#00e5ff", boxShadow: "0 0 4px #00e5ff" }}
                  animate={{ height: [3, 6 + (i % 4) * 5, 3] }}
                  transition={{ duration: 0.45 + (i % 3) * 0.12, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice hint */}
      <div className="px-4 pb-2">
        <p className="text-[8px] tracking-[0.14em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.18)" }}>
          EN-IN VOICE · NATURAL RATE · ASK ANYTHING ABOUT THE SCAN
        </p>
      </div>

      {/* Transcript bubble */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}
            >
              <Mic className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "rgba(168,85,247,0.55)" }} />
              <p className="text-[10px] italic" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.38)" }}>
                "{transcript}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
