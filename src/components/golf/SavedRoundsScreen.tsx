import React from "react";
import { ArrowLeft, Calendar, ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Round } from "@/types/golf";
import {
  playerTotal,
  playerFront9,
  playerBack9,
  parTotal,
  formatRelativeToPar,
} from "@/utils/golfScoring";

interface SavedRoundsScreenProps {
  rounds: Round[];
  onBack: () => void;
  onViewRound: (round: Round) => void;
}

const SavedRoundsScreen: React.FC<SavedRoundsScreenProps> = ({
  rounds,
  onBack,
  onViewRound,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Saved Rounds</h1>
            <p className="text-xs text-muted-foreground">{rounds.length} round{rounds.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        {rounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No saved rounds</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Scan a scorecard and save it to see it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rounds.map((round) => {
              const totalPar = parTotal(round.holes, 1, 18);

              return (
                <Card
                  key={round.id}
                  className="cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => onViewRound(round)}
                >
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{round.course.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(round.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · Rating {round.course.rating} / {round.course.slope}
                          </span>
                        </div>

                        {/* Player results */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {round.players.map((player) => {
                            const total = playerTotal(round.scores, player.id);
                            const rel = total - totalPar;
                            const f9 = playerFront9(round.scores, player.id);
                            const b9 = playerBack9(round.scores, player.id);
                            return (
                              <div key={player.id} className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">{player.name}</span>
                                <span className="text-xs font-bold text-foreground">{total}</span>
                                <span className={`text-xs font-semibold ${
                                  rel < 0 ? "text-red-400" : rel === 0 ? "text-green-400" : "text-muted-foreground"
                                }`}>
                                  ({formatRelativeToPar(rel)})
                                </span>
                                <span className="text-[10px] text-muted-foreground/50">
                                  {f9}/{b9}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRoundsScreen;
