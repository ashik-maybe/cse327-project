import { anonymizeCleanupWithGemini, hasGeminiKey } from "./gemini.provider";

export type AnonymizeResult = {
  anonymizedText: string;
  redactionCount: number;
  provider: "regex" | "regex+gemini";
};

const REDACTION_PATTERNS: RegExp[] = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // emails
  /(?:\+?880[-\s]?1[3-9]\d{2}[-\s]?\d{6}|\b01[3-9]\d{2}[-\s]?\d{6}\b)/g, // BD mobile numbers
  /\b\d{10}\b|\b\d{13}\b|\b\d{17}\b/g, // NID-like digit runs
  /(?:নাম|name)\s*:\s*[^\n,.;]{2,60}/gi, // labeled names (Bangla "naam" / English)
  /\b(?:https?:\/\/|www\.)\S+/gi, // URLs
];

export function redactWithRegex(text: string): { text: string; count: number } {
  let count = 0;
  let out = text;
  for (const pattern of REDACTION_PATTERNS) {
    out = out.replace(pattern, () => {
      count += 1;
      return "[REDACTED]";
    });
  }
  return { text: out, count };
}

export async function anonymizeText(text: string, useGemini = true): Promise<AnonymizeResult> {
  const { text: regexText, count } = redactWithRegex(text);
  if (useGemini && hasGeminiKey()) {
    try {
      const cleaned = await anonymizeCleanupWithGemini(regexText);
      if (cleaned) return { anonymizedText: cleaned, redactionCount: count, provider: "regex+gemini" };
    } catch {
      // fall through to regex-only result
    }
  }
  return { anonymizedText: regexText, redactionCount: count, provider: "regex" };
}
