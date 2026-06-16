import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Detecting scorecard layout…",
  "Reading hole numbers and pars…",
  "Extracting player scores…",
  "Checking handwriting confidence…",
  "Building digital scorecard…",
];

const AnalysisScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        const next = Math.min(prev + 1, STEPS.length - 1);
        return next;
      });
      setProgress((prev) => Math.min(prev + 20, 95));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-8">
      <div className="text-5xl mb-8 animate-bounce">⛳</div>

      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Analyzing Scorecard
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        This usually takes a few seconds
      </p>

      <div className="w-full max-w-xs mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      <p className="text-sm text-primary font-medium text-center min-h-[1.5rem] transition-all">
        {STEPS[step]}
      </p>
    </div>
  );
};

export default AnalysisScreen;
