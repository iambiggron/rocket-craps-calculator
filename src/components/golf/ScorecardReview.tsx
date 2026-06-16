import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Round, PlayerScore, VerificationFlag } from "@/types/golf";
import {
  playerTotal,
  playerFront9,
  playerBack9,
  parTotal,
  formatRelativeToPar,
  isFlagged,
} from "@/utils/golfScoring";
import ScoreCard from "./ScoreCard";
import VerificationFlow from "./VerificationFlow";
import ColorLegend from "./ColorLegend";

interface ScorecardReviewProps {
  round: Round;
  flags: VerificationFlag[];
  onBack: () => void;
  onSave: (round: Round) => void;
  onUpdateScore: (playerId: string, holeNumber: number, newScore: number) => void;
  onVerifyScore: (playerId: string, holeNumber: number) => void;
}

const ScorecardReview: React.FC<ScorecardReviewProps> = ({
  round,
  flags,
  onBack,
  onSave,
  onUpdateScore,
  onVerifyScore,
}) => {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [activeFlags, setActiveFlags] = useState<VerificationFlag[]>(flags);
  const [showLegend, setShowLegend] = useState(false);

  const unresolvedCount = activeFlags.filter((f) => !(f as any).resolved).length;
  const totalPar = parTotal(round.holes, 1, 18);

  const handleCellClick = (score: PlayerScore) => {
    if (isFlagged(score)) {
      setVerifyOpen(true);
      const flagIdx = activeFlags.findIndex(
        (f) => f.playerId === score.playerId && f.holeNumber === score.holeNumber
      );
      if (flagIdx >= 0) {
        // bring that flag to front by re-ordering
        const reordered = [
          activeFlags[flagIdx],
          ...activeFlags.slice(0, flagIdx),
          ...activeFlags.slice(flagIdx + 1),
        ];
        setActiveFlags(reordered);
      } else {
        setVerifyOpen(true);
      }
    }
  };

  const handleResolve = (flagId: string, newValue: number) => {
    const flag = activeFlags.find((f) => f.id === flagId);
    if (!flag || !flag.playerId || !flag.holeNumber) return;
    onUpdateScore(flag.playerId, flag.holeNumber, newValue);
    onVerifyScore(flag.playerId, flag.holeNumber);
    setActiveFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, resolved: true } as any : f))
    );
  };

  const handleSkip = (flagId: string) => {
    setActiveFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, resolved: true } as any : f))
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">{round.course.name}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(round.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}Rating {round.course.rating} · Slope {round.course.slope}
            </p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-lg" onClick={() => onSave(round)}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Flags banner */}
      {unresolvedCount > 0 && (
        <button
          onClick={() => setVerifyOpen(true)}
          className="flex items-center gap-3 bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 text-left w-full"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">
              {unresolvedCount} score{unresolvedCount > 1 ? "s" : ""} need verification
            </p>
            <p className="text-xs text-amber-400/70">Tap to review flagged readings</p>
          </div>
          <Badge className="bg-amber-500 text-amber-950 text-xs font-bold px-2">
            {unresolvedCount}
          </Badge>
        </button>
      )}

      {unresolvedCount === 0 && (
        <div className="flex items-center gap-2 bg-green-500/10 border-b border-green-500/20 px-4 py-2">
          <span className="text-green-400 text-sm font-medium">All scores verified</span>
        </div>
      )}

      {/* Score summary strip */}
      <div className="flex gap-px border-b border-border overflow-x-auto">
        {round.players.map((player) => {
          const total = playerTotal(round.scores, player.id);
          const rel = total - totalPar;
          const f9 = playerFront9(round.scores, player.id);
          const b9 = playerBack9(round.scores, player.id);
          return (
            <div key={player.id} className="flex-1 min-w-[100px] px-3 py-2 bg-card text-center">
              <p className="text-xs font-semibold text-muted-foreground truncate">{player.name}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{total || "—"}</p>
              <p className={`text-xs font-semibold ${
                rel < 0 ? "text-red-400" : rel === 0 ? "text-green-400" : "text-muted-foreground"
              }`}>
                {total ? formatRelativeToPar(rel) : "—"}
              </p>
              {total > 0 && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {f9} / {b9}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Scorecard */}
      <div className="px-2 py-4">
        <ScoreCard round={round} onCellClick={handleCellClick} />
      </div>

      {/* Legend toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showLegend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Score color guide
        </button>
        {showLegend && (
          <div className="mt-2">
            <ColorLegend />
          </div>
        )}
      </div>

      {/* Bottom save button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 mt-auto">
        <Button className="w-full h-12 rounded-xl font-semibold text-base gap-2" onClick={() => onSave(round)}>
          <Save className="w-5 h-5" />
          Save Round
        </Button>
      </div>

      {/* Verification flow */}
      <VerificationFlow
        flags={activeFlags}
        round={round}
        onResolve={handleResolve}
        onSkip={handleSkip}
        onClose={() => setVerifyOpen(false)}
        open={verifyOpen}
      />
    </div>
  );
};

export default ScorecardReview;
