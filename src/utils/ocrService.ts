import Anthropic from "@anthropic-ai/sdk";
import { Round, VerificationFlag, Hole, PlayerScore, Player } from "@/types/golf";
import { OCR_CONFIDENCE_THRESHOLD } from "@/utils/golfScoring";

const API_KEY_STORAGE = "golf-anthropic-api-key";

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? "";
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface OCRScore {
  hole: number;
  score: number | null;
  confidence: number;
}

interface OCRPlayer {
  name: string;
  scores: OCRScore[];
}

interface OCRHole {
  number: number;
  par: number;
  handicap?: number;
}

interface OCRResult {
  course: {
    name: string;
    rating?: number;
    slope?: number;
  };
  holes: OCRHole[];
  players: OCRPlayer[];
}

const SYSTEM_PROMPT = `You are an expert golf scorecard OCR system. Extract all data from golf scorecard images with high accuracy.

Return ONLY valid JSON matching this exact structure:
{
  "course": {
    "name": "string (course name, empty string if unclear)",
    "rating": number or null,
    "slope": number or null
  },
  "holes": [
    { "number": 1-18, "par": number, "handicap": number or null }
  ],
  "players": [
    {
      "name": "string (player name or 'Player 1' etc if unclear)",
      "scores": [
        { "hole": 1-18, "score": number or null, "confidence": 0.0-1.0 }
      ]
    }
  ]
}

Confidence scoring rules:
- 0.9-1.0: clearly legible digit
- 0.75-0.89: probably correct but slight uncertainty
- 0.5-0.74: ambiguous — could be multiple digits
- 0.0-0.49: very low confidence — smudged, crossed out, or unreadable

Include ALL 18 holes for each player. Use null for score/handicap if completely unreadable.
Do not include any explanation — only the JSON object.`;

export async function runOCR(
  file: File,
  apiKey: string
): Promise<{ round: Round; flags: VerificationFlag[] }> {
  const base64 = await fileToBase64(file);
  const mediaType = (file.type || "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Extract all scorecard data from this image and return JSON only.",
          },
        ],
      },
    ],
  });

  // Extract the text block (thinking blocks come first, then text)
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let ocr: OCRResult;
  try {
    // Strip any accidental markdown fences
    const raw = textBlock.text.replace(/^```[a-z]*\n?/i, "").replace(/```$/m, "").trim();
    ocr = JSON.parse(raw);
  } catch {
    throw new Error("Claude returned invalid JSON");
  }

  return buildRound(ocr, file);
}

function buildRound(
  ocr: OCRResult,
  file: File
): { round: Round; flags: VerificationFlag[] } {
  const id = `round-${Date.now()}`;

  const holes: Hole[] = (ocr.holes ?? []).map((h) => ({
    number: h.number,
    par: h.par ?? 4,
    handicap: h.handicap ?? undefined,
  }));

  // Fill in any missing holes with par 4
  const holeNumbers = new Set(holes.map((h) => h.number));
  for (let i = 1; i <= 18; i++) {
    if (!holeNumbers.has(i)) holes.push({ number: i, par: 4 });
  }
  holes.sort((a, b) => a.number - b.number);

  const players: Player[] = (ocr.players ?? []).map((p, idx) => ({
    id: `p${idx + 1}`,
    name: p.name || `Player ${idx + 1}`,
  }));

  const scores: PlayerScore[] = [];
  const flags: VerificationFlag[] = [];

  (ocr.players ?? []).forEach((ocrPlayer, pIdx) => {
    const player = players[pIdx];
    const scoreMap = new Map<number, OCRScore>();
    (ocrPlayer.scores ?? []).forEach((s) => scoreMap.set(s.hole, s));

    for (let hole = 1; hole <= 18; hole++) {
      const s = scoreMap.get(hole);
      const confidence = s?.confidence ?? 0;
      const score = s?.score ?? null;

      scores.push({
        playerId: player.id,
        holeNumber: hole,
        score,
        confidence,
        isVerified: confidence >= 0.9,
      });

      if (confidence < OCR_CONFIDENCE_THRESHOLD) {
        flags.push({
          id: `flag-${player.id}-h${hole}`,
          ocrFieldId: `ocr-${player.id}-h${hole}`,
          playerId: player.id,
          holeNumber: hole,
          field: "score",
          currentValue: score,
          reason: confidenceReason(confidence),
          confidence,
        });
      }
    }
  });

  const round: Round = {
    id,
    date: new Date().toISOString().split("T")[0],
    course: {
      name: ocr.course?.name || "Unknown Course",
      rating: ocr.course?.rating ?? 72.0,
      slope: ocr.course?.slope ?? 113,
    },
    holes,
    players,
    scores,
  };

  return { round, flags };
}

function confidenceReason(confidence: number): string {
  if (confidence < 0.5) return "Very low confidence — digit heavily unclear or unreadable";
  if (confidence < 0.65) return "Ambiguous digit — could be multiple values";
  return "Unclear handwriting — please verify";
}
