import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GaugeProps {
  score: number;
  className?: string;
}

export function Gauge({ score, className }: GaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Determine color based on score (0-100, where 100 is fully credible)
  // Low score = High Risk (Red)
  // Medium score = Medium Risk (Yellow/Orange)
  // High score = Low Risk (Green/Cyan)
  const getColor = (s: number) => {
    if (s < 40) return "hsl(var(--destructive))";
    if (s < 70) return "hsl(45 93% 47%)"; // Amber
    return "hsl(var(--primary))"; // Cyan/Green
  };

  const color = getColor(currentScore);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} data-testid="score-gauge">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          className="text-muted/30"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
        />
        <circle
          strokeWidth="8"
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 1.5s ease-out, stroke 1.5s ease",
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span 
          className="text-5xl font-bold" 
          style={{ color, textShadow: `0 0 10px ${color}80` }}
        >
          {Math.round(currentScore)}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Score</span>
      </div>
    </div>
  );
}
