import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Mic, Square } from "lucide-react";
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

/* ── Pick best MALE voice ──────────────────────────────────── */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const maleNames = ["david", "mark", "alex", "daniel", "fred", "rishi", "aaron", "thomas", "oliver", "james", "guy"];
  return (
    voices.find(v => v.lang.startsWith("en") && maleNames.some(m => v.name.toLowerCase().includes(m))) ||
    voices.find(v => v.name === "Google UK English Male") ||
    voices.find(v => v.name === "Google US English") ||
    voices.find(v => v.lang.startsWith("en-US")) ||
    voices.find(v => v.lang.startsWith("en")) ||
    null
  );
}

/* ── Short verdict for SPEAK button ───────────────────────── */
function buildSpeechText(result: AnalysisResult): string {
  const { riskLevel: risk, credibilityScore: score, manipulationBreakdown: mb } = result;
  const topSignal =
    mb.fear >= 60 ? "fear tactics" :
    mb.urgency >= 60 ? "urgency pressure" :
    mb.emotionalTriggers >= 60 ? "emotional manipulation" :
    mb.fakeAuthority >= 60 ? "fake authority" : null;
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

/* ── Browser TTS fallback ─────────────────────────────────── */
function speakFallback(text: string, onStart: () => void, onEnd: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const go = () => {
    const utt = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utt.voice = voice;
    utt.rate = 0.97; utt.pitch = 0.78; utt.volume = 1;
    utt.onstart = onStart;
    utt.onend = onEnd;
    utt.onerror = onEnd;
    window.speechSynthesis.speak(utt);
  };
  if (window.speechSynthesis.getVoices().length > 0) go();
  else window.speechSynthesis.onvoiceschanged = go;
}

/* ── Component ────────────────────────────────────────────── */
export function VoiceControls({ result }: VoiceControlsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript]     = useState<string | null>(null);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const mediaRecRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const streamRef       = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  /* Play mp3 base64 from backend */
  const playBase64Mp3 = useCallback((base64: string) => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "audio/mp3" });
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
    audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
    audio.play().catch(() => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
    });
  }, []);

  /* SPEAK: full readout via TTS API */
  const speakResult = useCallback(async () => {
    if (!result || isLoading) return;
    const text = buildSpeechText(result);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsLoading(true);
    try {
      const res = await fetch("/api/analysis/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsLoading(false);
      setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      setIsLoading(false);
      speakFallback(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  }, [result, isLoading]);

  const stopAll = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  /* ASK ME: record mic, send to backend, play AI answer */
  const startRecording = useCallback(async () => {
    if (!result) return;

    // stop any current audio first
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setTranscript(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Please allow microphone access in your browser, then try again.",
        variant: "destructive",
      });
      return;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/ogg";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecRef.current = recorder;
    chunksRef.current   = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, { type: mimeType });

      /* base64 via FileReader — safe for any size */
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1] ?? "");
        };
        reader.readAsDataURL(blob);
      });

      setIsProcessing(true);
      try {
        const res = await fetch("/api/analysis/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64,
            analysisContext: {
              credibilityScore:     result.credibilityScore,
              riskLevel:            result.riskLevel,
              explanation:          result.explanation,
              suspiciousPhrases:    result.suspiciousPhrases,
              manipulationBreakdown: result.manipulationBreakdown,
            },
          }),
        });

        if (!res.ok) throw new Error("ask failed");

        const data = await res.json() as { transcript: string; audioBase64: string };
        if (data.transcript) setTranscript(data.transcript);
        if (data.audioBase64) playBase64Mp3(data.audioBase64);
      } catch {
        toast({
          title: "Couldn't process question",
          description: "The AI couldn't hear you clearly. Try again in a quieter spot.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    recorder.start();
    setIsRecording(true);
  }, [result, toast, playBase64Mp3]);

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop();
    setIsRecording(false);
  }, []);

  if (!result) return null;

  const micBusy = isRecording || isProcessing;

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
          {isRecording && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="ml-auto text-[9px] tracking-widest"
              style={{ fontFamily: "'Space Mono', monospace", color: "#f472b6" }}
            >
              ● REC
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">

        {/* SPEAK / STOP readout */}
        <motion.button
          onClick={isSpeaking ? stopAll : speakResult}
          disabled={isLoading || micBusy}
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
            opacity: micBusy ? 0.4 : 1,
            cursor: isLoading || micBusy ? "default" : "pointer",
          }}
          whileHover={isLoading || micBusy ? {} : { scale: 1.03 }}
          whileTap={isLoading || micBusy ? {} : { scale: 0.97 }}
        >
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

        {/* ASK ME / RECORDING / PROCESSING */}
        <motion.button
          onClick={isRecording ? stopRecording : isProcessing ? undefined : startRecording}
          disabled={isProcessing || isSpeaking || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold relative overflow-hidden"
          style={{
            fontFamily: "'Orbitron', monospace",
            background: isRecording
              ? "rgba(244,114,182,0.14)"
              : isProcessing
              ? "rgba(168,85,247,0.12)"
              : "rgba(168,85,247,0.06)",
            border: isRecording
              ? "1px solid rgba(244,114,182,0.5)"
              : isProcessing
              ? "1px solid rgba(168,85,247,0.4)"
              : "1px solid rgba(168,85,247,0.2)",
            color: isRecording ? "#f472b6" : isProcessing ? "#a855f7" : "rgba(168,85,247,0.75)",
            opacity: (isSpeaking || isLoading) ? 0.4 : 1,
            cursor: isProcessing || isSpeaking || isLoading ? "default" : "pointer",
          }}
          whileHover={(isSpeaking || isLoading || isProcessing) ? {} : { scale: 1.03 }}
          whileTap={(isSpeaking || isLoading || isProcessing) ? {} : { scale: 0.97 }}
        >
          {/* Recording pulse ring */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{ opacity: [0.08, 0.25, 0.08] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ background: "rgba(244,114,182,0.25)" }}
            />
          )}
          {/* Processing shimmer */}
          {isProcessing && (
            <motion.div
              className="absolute inset-0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)" }}
            />
          )}

          {isRecording ? (
            <>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                <Square className="w-3 h-3" style={{ fill: "#f472b6" }} />
              </motion.div>
              STOP RECORDING
            </>
          ) : isProcessing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}>
                <Mic className="w-3 h-3" />
              </motion.div>
              AI THINKING…
            </>
          ) : (
            <><Mic className="w-3 h-3" /> ASK ME</>
          )}
        </motion.button>

        {/* Waveform while speaking */}
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
          {/* Mic input waveform while recording */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-0.5 ml-auto overflow-hidden"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: "#f472b6", boxShadow: "0 0 4px #f472b6" }}
                  animate={{ height: [2, 4 + (i % 5) * 4, 2] }}
                  transition={{ duration: 0.3 + (i % 4) * 0.09, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <div className="px-4 pb-2">
        <p className="text-[8px] tracking-[0.14em]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.18)" }}>
          {isRecording
            ? "SPEAK YOUR QUESTION → PRESS STOP RECORDING WHEN DONE"
            : "PRESS ASK ME → SPEAK → AI ANSWERS IN VOICE"}
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
              <Mic className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "rgba(244,114,182,0.6)" }} />
              <p className="text-[10px] italic" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.42)" }}>
                "{transcript}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
