import React from "react";
import { ScoreCategory } from "@/types/golf";
import { scoreCategoryLabel } from "@/utils/golfScoring";

const LEGEND_ITEMS: { cat: ScoreCategory; color: string; shape: string; example: string }[] = [
  {
    cat: "eagle-or-better",
    color: "bg-yellow-400 text-yellow-950",
    shape: "rounded-full ring-2 ring-yellow-400 ring-offset-1 ring-offset-background",
    example: "2",
  },
  {
    cat: "birdie",
    color: "bg-red-500 text-white",
    shape: "rounded-full",
    example: "3",
  },
  {
    cat: "par",
    color: "bg-white/10 text-foreground",
    shape: "rounded-sm",
    example: "4",
  },
  {
    cat: "bogey",
    color: "bg-transparent text-foreground border border-border",
    shape: "rounded-sm",
    example: "5",
  },
  {
    cat: "double-bogey",
    color: "bg-sky-600 text-white",
    shape: "rounded-sm ring-2 ring-sky-400 ring-offset-1 ring-offset-background",
    example: "6",
  },
  {
    cat: "triple-bogey",
    color: "bg-orange-500 text-white",
    shape: "rounded-sm ring-2 ring-orange-600 ring-offset-1 ring-offset-background",
    example: "7",
  },
  {
    cat: "worse-than-triple",
    color: "bg-red-900 text-white",
    shape: "rounded-sm ring-2 ring-red-700 ring-offset-1 ring-offset-background",
    example: "8",
  },
];

const ColorLegend: React.FC = () => (
  <div className="bg-card rounded-xl border border-border p-4">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
      Score Legend
    </h3>
    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
      {LEGEND_ITEMS.map(({ cat, color, shape, example }) => (
        <div key={cat} className="flex items-center gap-2">
          <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold ${color} ${shape}`}>
            {example}
          </div>
          <span className="text-xs text-muted-foreground">{scoreCategoryLabel(cat)}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ColorLegend;
