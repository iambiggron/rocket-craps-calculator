export interface Course {
  name: string;
  rating: number;
  slope: number;
}

export interface Hole {
  number: number;
  par: number;
  handicap?: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface PlayerScore {
  playerId: string;
  holeNumber: number;
  score: number | null;
  confidence: number;
  isVerified: boolean;
}

export interface OCRFieldResult {
  id: string;
  field: string;
  rawValue: string;
  parsedValue: string | number | null;
  confidence: number;
  playerId?: string;
  holeNumber?: number;
}

export interface VerificationFlag {
  id: string;
  ocrFieldId: string;
  playerId?: string;
  holeNumber?: number;
  field: string;
  currentValue: string | number | null;
  reason: string;
  confidence: number;
}

export interface Round {
  id: string;
  date: string;
  course: Course;
  holes: Hole[];
  players: Player[];
  scores: PlayerScore[];
  imageSrc?: string;
}

export type ScoreCategory =
  | "eagle-or-better"
  | "birdie"
  | "par"
  | "bogey"
  | "double-bogey"
  | "triple-bogey"
  | "worse-than-triple";

export type AppScreen = "home" | "scan" | "analysis" | "scorecard" | "saved";
