import React, { useState } from "react";
import { AlertTriangle, Check, SkipForward, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VerificationFlag, Round } from "@/types/golf";

interface VerificationFlowProps {
  flags: VerificationFlag[];
  round: Round;
  onResolve: (flagId: string, newValue: number) => void;
  onSkip: (flagId: string) => void;
  onClose: () => void;
  open: boolean;
}

const VerificationFlow: React.FC<VerificationFlowProps> = ({
  flags,
  round,
  onResolve,
  onSkip,
  onClose,
  open,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const remaining = flags.filter((f) => !f.resolved);
  const current = remaining[currentIdx] ?? remaining[0];

  React.useEffect(() => {
    if (current) {
      setInputValue(String(current.currentValue ?? ""));
    }
  }, [current?.id]);

  if (!current) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-center pb-4">
            <SheetTitle>All items verified!</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              All flagged scores have been reviewed. Your scorecard is ready to save.
            </p>
            <Button className="w-full rounded-xl" onClick={onClose}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const player = round.players.find((p) => p.id === current.playerId);
  const hole = round.holes.find((h) => h.number === current.holeNumber);
  const confidencePct = Math.round(current.confidence * 100);

  const handleConfirm = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val > 0) {
      onResolve(current.id, val);
      const nextIdx = currentIdx < remaining.length - 2 ? currentIdx : Math.max(0, currentIdx - 1);
      setCurrentIdx(nextIdx);
    }
  };

  const handleSkip = () => {
    onSkip(current.id);
    const nextIdx = currentIdx < remaining.length - 2 ? currentIdx : Math.max(0, currentIdx - 1);
    setCurrentIdx(nextIdx);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe-area">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Review Flagged Scores</SheetTitle>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentIdx + 1} of {remaining.length} remaining
          </p>
        </SheetHeader>

        {/* Progress dots */}
        <div className="flex gap-1.5 py-3">
          {remaining.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-colors ${
                i === currentIdx ? "bg-primary" : i < currentIdx ? "bg-green-500" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Flag details */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm text-foreground">
                  {player?.name ?? "Unknown"} — Hole {current.holeNumber}
                </span>
                {hole && (
                  <Badge variant="outline" className="text-xs">Par {hole.par}</Badge>
                )}
                <Badge
                  className={`text-xs ${
                    confidencePct < 60
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                  variant="outline"
                >
                  {confidencePct}% confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{current.reason}</p>
            </div>
          </div>
        </div>

        {/* Score input */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-foreground block mb-2">
            Score (currently reads: <span className="text-primary">{current.currentValue}</span>)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => setInputValue(String(n))}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors border ${
                  inputValue === String(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground border-border hover:bg-muted/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            max={20}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-2 text-center text-lg font-bold h-12 rounded-xl"
            placeholder="Enter score"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl gap-2"
            onClick={handleSkip}
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
          <Button
            className="flex-2 h-12 rounded-xl gap-2 flex-[2]"
            onClick={handleConfirm}
            disabled={!inputValue || isNaN(parseInt(inputValue, 10))}
          >
            <Check className="w-4 h-4" />
            Confirm Score
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VerificationFlow;
