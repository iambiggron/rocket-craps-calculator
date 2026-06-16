import React, { useState, useEffect, useCallback } from "react";
import { AppScreen, Round, PlayerScore, VerificationFlag } from "@/types/golf";
import { MOCK_ROUND, MOCK_FLAGS } from "@/data/mockScorecardData";
import { useToast } from "@/hooks/use-toast";
import { runOCR, getStoredApiKey } from "@/utils/ocrService";

import HomeScreen from "@/components/golf/HomeScreen";
import ScanScreen from "@/components/golf/ScanScreen";
import AnalysisScreen from "@/components/golf/AnalysisScreen";
import ScorecardReview from "@/components/golf/ScorecardReview";
import SavedRoundsScreen from "@/components/golf/SavedRoundsScreen";
import ApiKeyDialog from "@/components/golf/ApiKeyDialog";

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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

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

  const handleImageSelected = useCallback(async (file: File | null) => {
    if (!file) return;
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }
    setIsAnalyzing(true);
    setScreen("analysis");
    try {
      const { round, flags } = await runOCR(file, apiKey);
      setCurrentRound(round);
      setCurrentFlags(flags);
      setScreen("scorecard");
    } catch (err) {
      toast({
        title: "OCR failed",
        description: err instanceof Error ? err.message : "Could not read scorecard.",
        variant: "destructive",
      });
      setScreen("scan");
    } finally {
      setIsAnalyzing(false);
    }
  }, [startAnalysis, toast]);

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

  let content: React.ReactNode;
  switch (screen) {
    case "home":
      content = (
        <HomeScreen
          savedRounds={savedRounds}
          onScan={() => setScreen("scan")}
          onViewSaved={() => setScreen("saved")}
          onViewRound={handleViewRound}
        />
      );
      break;
    case "scan":
      content = (
        <ScanScreen
          onBack={() => setScreen("home")}
          onImageSelected={handleImageSelected}
          onUseSample={handleUseSample}
          onSetApiKey={() => setShowApiKeyDialog(true)}
          hasApiKey={!!getStoredApiKey()}
        />
      );
      break;
    case "analysis":
      content = <AnalysisScreen />;
      break;
    case "scorecard":
      content = currentRound ? (
        <ScorecardReview
          round={currentRound}
          flags={currentFlags}
          onBack={() => setScreen("home")}
          onSave={handleSave}
          onUpdateScore={handleUpdateScore}
          onVerifyScore={handleVerifyScore}
        />
      ) : null;
      break;
    case "saved":
      content = (
        <SavedRoundsScreen
          rounds={savedRounds}
          onBack={() => setScreen("home")}
          onViewRound={handleViewRound}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <>
      {content}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSaved={() => {}}
      />
    </>
  );
};

export default GolfApp;
