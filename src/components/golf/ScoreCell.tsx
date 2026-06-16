import React from "react";
import { AlertTriangle } from "lucide-react";
import { ScoreCategory } from "@/types/golf";
import { getScoreCategory, isFlagged } from "@/utils/golfScoring";

interface ScoreCellProps {
  score: number | null;
  par: number;
  confidence: number;
  isVerified: boolean;
  onClick?: () => void;
  isTotals?: boolean;
}

function categoryStyles(cat: ScoreCategory): string {
  switch (cat) {
    case "eagle-or-better":
      return "bg-yellow-400 text-yellow-950 before:absolute before:inset-[-3px] before:rounded-full before:border-2 before:border-yellow-400";
    case "birdie":
      return "bg-red-500 text-white";
    case "par":
      return "bg-white/10 text-foreground";
    case "bogey":
      return "bg-transparent text-foreground";
    case "double-bogey":
      return "bg-sky-600 text-white";
    case "triple-bogey":
      return "bg-orange-500 text-white";
    case "worse-than-triple":
      return "bg-red-900 text-white";
  }
}

function categoryShape(cat: ScoreCategory): string {
  switch (cat) {
    case "eagle-or-better":
      return "rounded-full ring-2 ring-yellow-400 ring-offset-1 ring-offset-background";
    case "birdie":
      return "rounded-full";
    case "par":
      return "rounded-sm";
    case "bogey":
      return "rounded-sm";
    case "double-bogey":
      return "rounded-sm ring-2 ring-sky-400 ring-offset-1 ring-offset-background";
    case "triple-bogey":
      return "rounded-sm ring-2 ring-orange-600 ring-offset-1 ring-offset-background";
    case "worse-than-triple":
      return "rounded-sm ring-2 ring-red-700 ring-offset-1 ring-offset-background";
  }
}

const ScoreCell: React.FC<ScoreCellProps> = ({
  score,
  par,
  confidence,
  isVerified,
  onClick,
  isTotals = false,
}) => {
  const flagged = !isVerified && confidence < 0.75;

  if (score === null) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10 text-sm text-muted-foreground">
        —
      </div>
    );
  }

  const cat = isTotals ? undefined : getScoreCategory(score, par);
  const baseStyles = cat ? `${categoryStyles(cat)} ${categoryShape(cat)}` : "";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative flex items-center justify-center w-10 h-10 text-sm font-semibold transition-opacity select-none
        ${baseStyles}
        ${flagged ? "opacity-80" : ""}
        ${onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : "cursor-default"}
      `}
    >
      {score}
      {flagged && (
        <span className="absolute -top-1 -right-1 z-10">
          <AlertTriangle className="w-3 h-3 text-amber-400 drop-shadow-sm" />
        </span>
      )}
      {cat === "worse-than-triple" && (
        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold leading-none bg-red-700 text-white px-0.5 rounded">
          +{score - par}
        </span>
      )}
    </button>
  );
};

export default ScoreCell;
