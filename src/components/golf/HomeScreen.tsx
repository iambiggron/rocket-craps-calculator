import React from "react";
import { Camera, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Round } from "@/types/golf";
import { playerTotal, formatRelativeToPar, parTotal } from "@/utils/golfScoring";

interface HomeScreenProps {
  savedRounds: Round[];
  onScan: () => void;
  onViewSaved: () => void;
  onViewRound: (round: Round) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  savedRounds,
  onScan,
  onViewSaved,
  onViewRound,
}) => {
  const recentRounds = savedRounds.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-background px-4 pb-8">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <div className="text-4xl mb-2">⛳</div>
        <h1 className="text-2xl font-bold text-foreground">Golf Scorecard</h1>
        <p className="text-muted-foreground text-sm mt-1">Scan and track your rounds</p>
      </div>

      {/* Primary CTA */}
      <Button
        size="lg"
        className="w-full h-16 text-lg font-semibold gap-3 mb-4 rounded-2xl"
        onClick={onScan}
      >
        <Camera className="w-6 h-6" />
        Scan Scorecard
      </Button>

      {/* Recent rounds */}
      {recentRounds.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Rounds
            </h2>
            {savedRounds.length > 3 && (
              <button
                onClick={onViewSaved}
                className="text-xs text-primary flex items-center gap-0.5"
              >
                See all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {recentRounds.map((round) => {
              const totalPar = parTotal(round.holes, 1, 18);
              const playerResults = round.players.map((p) => ({
                player: p,
                total: playerTotal(round.scores, p.id),
                rel: playerTotal(round.scores, p.id) - totalPar,
              }));

              return (
                <Card
                  key={round.id}
                  className="cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => onViewRound(round)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{round.course.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(round.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {" · "}
                          {round.players.length} player{round.players.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        {playerResults.slice(0, 1).map(({ player, total, rel }) => (
                          <div key={player.id}>
                            <span className="text-sm font-bold text-foreground">{total}</span>
                            <span className={`text-xs ml-1 font-semibold ${
                              rel < 0 ? "text-red-400" : rel === 0 ? "text-green-400" : "text-muted-foreground"
                            }`}>
                              ({formatRelativeToPar(rel)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {savedRounds.length === 0 && (
        <div className="mt-8 text-center py-8">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No saved rounds yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Scan a scorecard to get started.</p>
        </div>
      )}

      {/* View all saved */}
      {savedRounds.length > 0 && (
        <Button
          variant="outline"
          className="mt-6 w-full rounded-xl"
          onClick={onViewSaved}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          All Saved Rounds ({savedRounds.length})
        </Button>
      )}
    </div>
  );
};

export default HomeScreen;
