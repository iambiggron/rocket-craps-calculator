import React from "react";
import { Round, PlayerScore } from "@/types/golf";
import {
  playerFront9,
  playerBack9,
  playerTotal,
  parTotal,
  formatRelativeToPar,
} from "@/utils/golfScoring";
import ScoreCell from "./ScoreCell";

interface ScoreCardProps {
  round: Round;
  onCellClick?: (score: PlayerScore) => void;
}

const LABEL_W = "min-w-[90px] max-w-[90px]";
const CELL_W = "min-w-[44px] max-w-[44px]";
const TOTAL_W = "min-w-[52px] max-w-[52px]";

const headerCell = "flex items-center justify-center h-9 text-xs font-bold text-muted-foreground";
const labelCell = `${LABEL_W} flex items-center h-9 px-2 text-xs font-semibold text-foreground bg-card sticky left-0 z-20 border-r border-border`;
const dataCell = `${CELL_W} flex items-center justify-center h-9 text-xs`;
const totalCell = `${TOTAL_W} flex items-center justify-center h-9 text-xs font-bold bg-card/80`;

function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center border-b border-border/50 ${className}`}>{children}</div>;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ round, onCellClick }) => {
  const { holes, players, scores } = round;
  const front = holes.filter((h) => h.number <= 9);
  const back = holes.filter((h) => h.number >= 10);

  const frontPar = parTotal(holes, 1, 9);
  const backPar = parTotal(holes, 10, 18);
  const totalPar = frontPar + backPar;

  const getScore = (playerId: string, holeNumber: number) =>
    scores.find((s) => s.playerId === playerId && s.holeNumber === holeNumber);

  const getHolePar = (holeNumber: number) =>
    holes.find((h) => h.number === holeNumber)?.par ?? 4;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-lg">
      <div className="min-w-max">
        {/* ── Header row ── */}
        <Row className="bg-muted/50">
          <div className={`${labelCell} text-xs font-bold text-muted-foreground bg-muted/50`}>Hole</div>
          {front.map((h) => (
            <div key={h.number} className={`${dataCell} ${headerCell}`}>{h.number}</div>
          ))}
          <div className={`${totalCell} ${headerCell} border-l border-r border-border`}>OUT</div>
          {back.map((h) => (
            <div key={h.number} className={`${dataCell} ${headerCell}`}>{h.number}</div>
          ))}
          <div className={`${totalCell} ${headerCell} border-l border-r border-border`}>IN</div>
          <div className={`${totalCell} ${headerCell} border-l border-border`}>TOT</div>
          <div className={`${totalCell} ${headerCell} border-l border-border`}>+/-</div>
        </Row>

        {/* ── Par row ── */}
        <Row className="bg-muted/20">
          <div className={`${labelCell} bg-muted/20`}>Par</div>
          {front.map((h) => (
            <div key={h.number} className={`${dataCell} text-muted-foreground`}>{h.par}</div>
          ))}
          <div className={`${totalCell} border-l border-r border-border text-muted-foreground`}>{frontPar}</div>
          {back.map((h) => (
            <div key={h.number} className={`${dataCell} text-muted-foreground`}>{h.par}</div>
          ))}
          <div className={`${totalCell} border-l border-r border-border text-muted-foreground`}>{backPar}</div>
          <div className={`${totalCell} border-l border-border text-muted-foreground`}>{totalPar}</div>
          <div className={`${totalCell} border-l border-border`}></div>
        </Row>

        {/* ── Handicap row ── */}
        {holes.some((h) => h.handicap !== undefined) && (
          <Row className="bg-muted/10">
            <div className={`${labelCell} bg-muted/10 text-muted-foreground`}>HCP</div>
            {front.map((h) => (
              <div key={h.number} className={`${dataCell} text-muted-foreground/70 text-[11px]`}>
                {h.handicap ?? "—"}
              </div>
            ))}
            <div className={`${totalCell} border-l border-r border-border`}></div>
            {back.map((h) => (
              <div key={h.number} className={`${dataCell} text-muted-foreground/70 text-[11px]`}>
                {h.handicap ?? "—"}
              </div>
            ))}
            <div className={`${totalCell} border-l border-r border-border`}></div>
            <div className={`${totalCell} border-l border-border`}></div>
            <div className={`${totalCell} border-l border-border`}></div>
          </Row>
        )}

        {/* ── Player rows ── */}
        {players.map((player, playerIdx) => {
          const f9 = playerFront9(scores, player.id);
          const b9 = playerBack9(scores, player.id);
          const tot = playerTotal(scores, player.id);
          const rel = tot - totalPar;

          return (
            <Row
              key={player.id}
              className={playerIdx % 2 === 0 ? "bg-card" : "bg-muted/10"}
            >
              <div className={`${labelCell} ${playerIdx % 2 === 0 ? "bg-card" : "bg-muted/10"} font-semibold truncate`}>
                {player.name}
              </div>

              {front.map((h) => {
                const s = getScore(player.id, h.number);
                return (
                  <div key={h.number} className={dataCell}>
                    {s ? (
                      <ScoreCell
                        score={s.score}
                        par={h.par}
                        confidence={s.confidence}
                        isVerified={s.isVerified}
                        onClick={onCellClick ? () => onCellClick(s) : undefined}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                );
              })}

              <div className={`${totalCell} border-l border-r border-border font-bold text-foreground`}>
                {f9 || "—"}
              </div>

              {back.map((h) => {
                const s = getScore(player.id, h.number);
                return (
                  <div key={h.number} className={dataCell}>
                    {s ? (
                      <ScoreCell
                        score={s.score}
                        par={h.par}
                        confidence={s.confidence}
                        isVerified={s.isVerified}
                        onClick={onCellClick ? () => onCellClick(s) : undefined}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                );
              })}

              <div className={`${totalCell} border-l border-r border-border font-bold text-foreground`}>
                {b9 || "—"}
              </div>

              <div className={`${totalCell} border-l border-border font-bold text-foreground`}>
                {tot || "—"}
              </div>

              <div className={`${totalCell} border-l border-border font-bold ${
                rel < 0 ? "text-red-400" : rel === 0 ? "text-green-400" : "text-foreground"
              }`}>
                {tot ? formatRelativeToPar(rel) : "—"}
              </div>
            </Row>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreCard;
