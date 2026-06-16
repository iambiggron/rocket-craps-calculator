import React, { useState, useEffect, useCallback } from "react";
import { AppScreen, Round, PlayerScore, VerificationFlag } from "@/types/golf";
import { MOCK_ROUND, MOCK_FLAGS } from "@/data/mockScorecardData";
import { useToast } from "@/hooks/use-toast";

import HomeScreen from "@/components/golf/HomeScreen";
import ScanScreen from "@/components/golf/ScanScreen";
import AnalysisScreen from "@/components/golf/AnalysisScreen";
import ScorecardReview from "@/components/golf/ScorecardReview";
import SavedRoundsScreen from "@/components/golf/SavedRoundsScreen";

const STORAGE_KEY = "golf-saved-rounds";

function loadSavedRounds(): Round[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRoundsToStorage(rounds: Round[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  } catch {
    // ignore quota errors
  }
}

const GolfApp: React.FC = () => {
  const { toast } = useToast();
  const [screen, setScreen] = useState<AppScreen>("home");
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentFlags, setCurrentFlags] = useState<VerificationFlag[]>([]);
  const [savedRounds, setSavedRounds] = useState<Round[]>(loadSavedRounds);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persist saved rounds
  useEffect(() => {
    saveRoundsToStorage(savedRounds);
  }, [savedRounds]);

  const startAnalysis = useCallback((round: Round, flags: VerificationFlag[]) => {
    setIsAnalyzing(true);
    setScreen("analysis");
    // Simulate OCR processing delay
    setTimeout(() => {
      setCurrentRound(round);
      setCurrentFlags(flags);
      setIsAnalyzing(false);
      setScreen("scorecard");
    }, 2800);
  }, []);

  const handleUseSample = useCallback(() => {
    startAnalysis(
      { ...MOCK_ROUND, id: `round-${Date.now()}` },
      MOCK_FLAGS
    );
  }, [startAnalysis]);

  const handleImageSelected = useCallback((file: File | null) => {
    if (!file) return;
    // In a real app this would call an OCR API.
    // We simulate it with the mock data.
    startAnalysis(
      { ...MOCK_ROUND, id: `round-${Date.now()}` },
      MOCK_FLAGS
    );
  }, [startAnalysis]);

  const handleUpdateScore = useCallback(
    (playerId: string, holeNumber: number, newScore: number) => {
      setCurrentRound((prev) => {
        if (!prev) return prev;
        const updatedScores = prev.scores.map((s): PlayerScore =>
          s.playerId === playerId && s.holeNumber === holeNumber
            ? { ...s, score: newScore, confidence: 1, isVerified: true }
            : s
        );
        return { ...prev, scores: updatedScores };
      });
    },
    []
  );

  const handleVerifyScore = useCallback(
    (playerId: string, holeNumber: number) => {
      setCurrentRound((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: prev.scores.map((s) =>
            s.playerId === playerId && s.holeNumber === holeNumber
              ? { ...s, isVerified: true, confidence: 1 }
              : s
          ),
        };
      });
    },
    []
  );

  const handleSave = useCallback(
    (round: Round) => {
      setSavedRounds((prev) => {
        const exists = prev.some((r) => r.id === round.id);
        if (exists) {
          return prev.map((r) => (r.id === round.id ? round : r));
        }
        return [round, ...prev];
      });
      toast({
        title: "Round saved!",
        description: `${round.course.name} has been saved to your rounds.`,
      });
      setScreen("home");
    },
    [toast]
  );

  const handleViewRound = useCallback((round: Round) => {
    setCurrentRound(round);
    setCurrentFlags([]);
    setScreen("scorecard");
  }, []);

  switch (screen) {
    case "home":
      return (
        <HomeScreen
          savedRounds={savedRounds}
          onScan={() => setScreen("scan")}
          onViewSaved={() => setScreen("saved")}
          onViewRound={handleViewRound}
        />
      );

    case "scan":
      return (
        <ScanScreen
          onBack={() => setScreen("home")}
          onImageSelected={handleImageSelected}
          onUseSample={handleUseSample}
        />
      );

    case "analysis":
      return <AnalysisScreen />;

    case "scorecard":
      return currentRound ? (
        <ScorecardReview
          round={currentRound}
          flags={currentFlags}
          onBack={() => setScreen("home")}
          onSave={handleSave}
          onUpdateScore={handleUpdateScore}
          onVerifyScore={handleVerifyScore}
        />
      ) : null;

    case "saved":
      return (
        <SavedRoundsScreen
          rounds={savedRounds}
          onBack={() => setScreen("home")}
          onViewRound={handleViewRound}
        />
      );

    default:
      return null;
  }
};

export default GolfApp;
