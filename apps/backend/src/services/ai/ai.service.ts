import {
  followUpWithFallback,
  summarizeWithFallback,
  triageWithFallback,
} from "./fallback.provider";
import {
  followUpWithGemini,
  hasGeminiKey,
  intakeAudioWithGemini,
  intakeWithGemini,
  triageWithGemini,
} from "./gemini.provider";
import { anonymizeText } from "./anonymizer";

export type AiProvider = "gemini" | "fallback" | "regex" | "regex+gemini" | "sample";

export type CaseIntakeInput = {
  banglaText?: string;
  audioBase64?: string;
  audioMimeType?: string;
  includeTriage?: boolean;
  sampleId?: string;
};

export type TriageFields = {
  category: string;
  urgency: string;
  nextContact: string;
};

// Stable demo fixtures so the demo works with no GEMINI_API_KEY configured.
const SAMPLE_FIXTURES: Record<string, { banglaText: string; englishSummary: string } & TriageFields> = {
  "sample-1": {
    banglaText: "আমার পরিবারের ঘরের ছাউনি ভেঙে গেছে। বৃষ্টিতে সব ভিজে যাচ্ছে, ছোট বাচ্চাদের সাথে ছিলাম।",
    englishSummary: "Family's shelter roof has collapsed and belongings are getting wet in the rain; children are in the household.",
    category: "shelter",
    urgency: "high",
    nextContact: "Shelter Focal Point",
  },
  "sample-2": {
    banglaText: "আমার মায়ের তিনদিন ধরে জ্বর, ওষুধ নেই। হাসপাতালে যেতে পারছি না।",
    englishSummary: "Mother has had a fever for three days with no medicine and cannot reach the hospital.",
    category: "health",
    urgency: "medium",
    nextContact: "Health Post",
  },
  "sample-3": {
    banglaText: "এই সপ্তাহে আমাদের পরিবার রেশন পায়নি। চাল-ডাল প্রায় শেষ।",
    englishSummary: "Household did not receive this week's ration; rice and lentils are nearly finished.",
    category: "food",
    urgency: "medium",
    nextContact: "Food Distribution Point",
  },
};

export function listSampleFixtureIds(): string[] {
  return Object.keys(SAMPLE_FIXTURES);
}

export function isAudioOnly(input: CaseIntakeInput): boolean {
  return Boolean(input.audioBase64) && !input.banglaText && !input.sampleId;
}

export async function caseIntake(input: CaseIntakeInput) {
  if (input.sampleId) {
    const fixture = SAMPLE_FIXTURES[input.sampleId];
    if (!fixture) throw new Error("SAMPLE_NOT_FOUND");
    return {
      englishSummary: fixture.englishSummary,
      category: fixture.category,
      urgency: fixture.urgency,
      nextContact: fixture.nextContact,
      originalText: fixture.banglaText,
      provider: "sample" as const,
    };
  }

  if (input.audioBase64 && !input.banglaText) {
    if (!hasGeminiKey()) throw new Error("AUDIO_REQUIRES_GEMINI");
    try {
      const result = await intakeAudioWithGemini(input.audioBase64, input.audioMimeType ?? "audio/webm");
      return {
        englishSummary: result.englishSummary,
        category: result.category,
        urgency: result.urgency,
        nextContact: result.nextContact,
        originalText: result.transcript,
        provider: "gemini" as const,
      };
    } catch {
      return {
        englishSummary: "Audio received but could not be transcribed; please capture a text note.",
        category: "other",
        urgency: "medium",
        nextContact: "Camp CFM Desk",
        originalText: "",
        provider: "fallback" as const,
      };
    }
  }

  const text = (input.banglaText ?? "").trim();
  if (!text) throw new Error("TEXT_REQUIRED");

  if (hasGeminiKey()) {
    try {
      const result = await intakeWithGemini(text);
      return { ...result, originalText: text, provider: "gemini" as const };
    } catch {
      // fall through to deterministic fallback
    }
  }
  const triage = triageWithFallback(text);
  return {
    englishSummary: summarizeWithFallback(text, triage.category),
    ...triage,
    originalText: text,
    provider: "fallback" as const,
  };
}

export async function triage(text: string) {
  if (hasGeminiKey()) {
    try {
      const result = await triageWithGemini(text);
      return { ...result, provider: "gemini" as const };
    } catch {
      // fall through to deterministic fallback
    }
  }
  return { ...triageWithFallback(text), provider: "fallback" as const };
}

export async function anonymize(text: string, useGemini?: boolean) {
  return anonymizeText(text, useGemini ?? true);
}

export async function followUp(summary?: string, category?: string) {
  const basis = summary ?? (category ? `Case category: ${category}` : "");
  if (basis) {
    if (hasGeminiKey()) {
      try {
        const suggestion = await followUpWithGemini(basis);
        if (suggestion) return { suggestion, provider: "gemini" as const };
      } catch {
        // fall through to deterministic fallback
      }
    }
    return { suggestion: followUpWithFallback(basis), provider: "fallback" as const };
  }
  return {
    suggestion: "Check in with the household within 48 hours and confirm the referral was received.",
    provider: "fallback" as const,
  };
}
