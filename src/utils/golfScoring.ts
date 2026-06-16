import { Hole, PlayerScore, ScoreCategory } from "@/types/golf";

export const OCR_CONFIDENCE_THRESHOLD = 0.75;

export function getScoreCategory(score: number, par: number): ScoreCategory {
  const diff = score - par;
  if (diff <= -2) return "eagle-or-better";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double-bogey";
  if (diff === 3) return "triple-bogey";
  return "worse-than-triple";
}

export function scoreCategoryLabel(category: ScoreCategory): string {
  switch (category) {
    case "eagle-or-better": return "Eagle or better";
    case "birdie": return "Birdie";
    case "par": return "Par";
    case "bogey": return "Bogey";
    case "double-bogey": return "Double Bogey";
    case "triple-bogey": return "Triple Bogey";
    case "worse-than-triple": return "Quadruple Bogey+";
  }
}

export function playerFront9(scores: PlayerScore[], playerId: string): number {
  return scores
    .filter((s) => s.playerId === playerId && s.holeNumber <= 9 && s.score !== null)
    .reduce((sum, s) => sum + (s.score ?? 0), 0);
}

export function playerBack9(scores: PlayerScore[], playerId: string): number {
  return scores
    .filter((s) => s.playerId === playerId && s.holeNumber >= 10 && s.score !== null)
    .reduce((sum, s) => sum + (s.score ?? 0), 0);
}

export function playerTotal(scores: PlayerScore[], playerId: string): number {
  return playerFront9(scores, playerId) + playerBack9(scores, playerId);
}

export function parTotal(holes: Hole[], from: number, to: number): number {
  return holes
    .filter((h) => h.number >= from && h.number <= to)
    .reduce((sum, h) => sum + h.par, 0);
}

export function playerRelativeToPar(
  scores: PlayerScore[],
  playerId: string,
  holes: Hole[]
): number {
  const total = playerTotal(scores, playerId);
  const par = parTotal(holes, 1, 18);
  return total - par;
}

export function formatRelativeToPar(diff: number): string {
  if (diff === 0) return "E";
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function isFlagged(score: PlayerScore): boolean {
  return !score.isVerified && score.confidence < OCR_CONFIDENCE_THRESHOLD;
}
