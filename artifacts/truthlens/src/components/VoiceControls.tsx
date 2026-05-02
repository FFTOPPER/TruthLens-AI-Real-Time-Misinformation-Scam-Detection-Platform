import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Mic, MicOff, Square } from "lucide-react";
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

function buildSpeechText(result: AnalysisResult): string {
  const risk = result.riskLevel;
  const score = result.credibilityScore;
  const { fear, urgency, emotionalTriggers, fakeAuthority } = result.manipulationBreakdown;

  const topTechniques: string[] = [];
  if (fear >= 60) topTechniques.push("fear tactics");
  if (urgency >= 60) topTechniques.push("urgency language");
  if (emotionalTriggers >= 60) topTechniques.push("emotional manipulation");
  if (fakeAuthority >= 60) topTechniques.push("fake authority signals");

  let speech = `Analysis complete. `;

  if (risk === "Low") {
    speech += `This content appears credible with a trust score of ${score} out of 100. `;
  } else if (risk === "Medium") {
    speech += `This content shows a medium risk level with a trust score of ${score} out of 100. `;
  } else {
    speech += `Warning. This content is high risk with a trust score of only ${score} out of 100. `;
  }

  speech += result.explanation + " ";

  if (topTechniques.length > 0) {
    speech += `Key manipulation techniques detected include: ${topTechniques.join(", ")}. `;
  }

  if (result.suspiciousPhrases.length > 0) {
    speech += `${result.suspiciousPhrases.length} suspicious phrase${result.suspiciousPhrases.length > 1 ? "s" : ""} were flagged in this content.`;
  }

  return speech;
}

export function VoiceControls({ result }: VoiceControlsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const hasSpeechSynth = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasMic = !!SpeechRecognitionAPI;

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  const speakResult = useCallback(() => {
    if (!result || !hasSpeechSynth) return;

    window.speechSynthesis.cancel();
    const text = buildSpeechText(result);
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Samantha") || v.name.includes("Google"))
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.rate = 0.92;
    utterance.pitch = 0.9;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [result, hasSpeechSynth]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!hasMic || !result) return;

    const recognition = new SpeechRecognitionAPI!();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Mic Error", description: "Could not access microphone.", variant: "destructive" });
    };

    recognition.onresult = (event) => {
      const q = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(q);
      answerQuestion(q, result);
    };

    recognition.start();
  }, [hasMic, result, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const answerQuestion = useCallback((question: string, res: AnalysisResult) => {
    if (!hasSpeechSynth) return;
    window.speechSynthesis.cancel();

    const q = question.toLowerCase();
    let answer = "";

    if (q.includes("fake") || q.includes("misinformation") || q.includes("why")) {
      answer = `This content is considered ${res.riskLevel.toLowerCase()} risk because: ${res.explanation}`;
    } else if (q.includes("score") || q.includes("trust") || q.includes("credib")) {
      answer = `The credibility score is ${res.credibilityScore} out of 100, indicating a ${res.riskLevel.toLowerCase()} risk level.`;
    } else if (q.includes("fear")) {
      answer = `Fear tactics scored ${res.manipulationBreakdown.fear} out of 100. ${res.manipulationBreakdown.fear >= 60 ? "This is notably high — the content uses threatening or alarming language to provoke fear." : "This is relatively low."}`;
    } else if (q.includes("urgent") || q.includes("urgency")) {
      answer = `Urgency language scored ${res.manipulationBreakdown.urgency} out of 100. ${res.manipulationBreakdown.urgency >= 60 ? "The content pressures the reader to act quickly." : "Limited urgency tactics were detected."}`;
    } else if (q.includes("emotion") || q.includes("trigger")) {
      answer = `Emotional triggers scored ${res.manipulationBreakdown.emotionalTriggers} out of 100.`;
    } else if (q.includes("author") || q.includes("expert") || q.includes("source")) {
      answer = `Fake authority signals scored ${res.manipulationBreakdown.fakeAuthority} out of 100. ${res.manipulationBreakdown.fakeAuthority >= 60 ? "The content references unverified experts or misleading credentials." : "No major fake authority issues detected."}`;
    } else if (q.includes("suspicious") || q.includes("phrase")) {
      if (res.suspiciousPhrases.length === 0) {
        answer = "No suspicious phrases were flagged in this content.";
      } else {
        answer = `${res.suspiciousPhrases.length} suspicious phrases were detected, including: ${res.suspiciousPhrases.slice(0, 2).join("; ")}.`;
      }
    } else {
      answer = `Here is the full analysis: ${res.explanation}`;
    }

    const utterance = new SpeechSynthesisUtterance(answer);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Google"))) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.rate = 0.92;
    utterance.pitch = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [hasSpeechSynth]);

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(0, 229, 255, 0.12)", background: "rgba(0, 229, 255, 0.02)" }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(0, 229, 255, 0.08)", background: "rgba(0, 229, 255, 0.03)" }}
      >
        <Volume2 className="w-3.5 h-3.5" style={{ color: "#00e5ff" }} />
        <span
          className="text-[10px] tracking-[0.2em] font-semibold"
          style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}
        >
          VOICE INTERFACE
        </span>
        {isSpeaking && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-auto text-[9px] tracking-widest"
            style={{ fontFamily: "'Space Mono', monospace", color: "#00e5ff" }}
          >
            ◉ TRANSMITTING
          </motion.span>
        )}
      </div>

      <div className="px-4 py-3 flex items-center gap-3">
        {/* Speak button */}
        {hasSpeechSynth && (
          <motion.button
            onClick={isSpeaking ? stopSpeaking : speakResult}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: isSpeaking ? "rgba(239, 68, 68, 0.12)" : "rgba(0, 229, 255, 0.08)",
              border: isSpeaking ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(0, 229, 255, 0.25)",
              color: isSpeaking ? "#ef4444" : "#00e5ff",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3 h-3" />
                STOP
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3" />
                SPEAK RESULT
              </>
            )}
          </motion.button>
        )}

        {/* Mic button */}
        {hasMic && (
          <motion.button
            onClick={isListening ? stopListening : startListening}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] font-semibold relative overflow-hidden"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: isListening ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.06)",
              border: isListening ? "1px solid rgba(168, 85, 247, 0.5)" : "1px solid rgba(168, 85, 247, 0.2)",
              color: isListening ? "#a855f7" : "rgba(168, 85, 247, 0.7)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ background: "rgba(168, 85, 247, 0.2)" }}
              />
            )}
            {isListening ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <MicOff className="w-3 h-3" />
                </motion.div>
                LISTENING...
              </>
            ) : (
              <>
                <Mic className="w-3 h-3" />
                ASK A QUESTION
              </>
            )}
          </motion.button>
        )}

        {/* Waveform visualizer when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-0.5 ml-auto overflow-hidden"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: "#00e5ff", boxShadow: "0 0 4px #00e5ff" }}
                  animate={{ height: [4, 8 + Math.random() * 14, 4] }}
                  transition={{
                    duration: 0.5 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.06,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transcript */}
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
              style={{ background: "rgba(168, 85, 247, 0.06)", border: "1px solid rgba(168, 85, 247, 0.15)" }}
            >
              <Mic className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "rgba(168, 85, 247, 0.6)" }} />
              <p
                className="text-[10px] italic"
                style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}
              >
                "{transcript}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasSpeechSynth && (
        <p className="px-4 pb-3 text-[10px]" style={{ fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
          Speech synthesis not supported in this browser.
        </p>
      )}
    </motion.div>
  );
}
