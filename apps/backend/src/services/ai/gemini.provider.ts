import { followUpPrompt, intakeAudioPrompt, intakePrompt, triagePrompt, anonymizeCleanupPrompt } from "./prompts";
import { NEXT_CONTACT_BY_CATEGORY, type TriageResult } from "./fallback.provider";

const GEMINI_MODEL = "gemini-1.5-flash";

function timeoutMs(): number {
  return Number(process.env.AI_TIMEOUT_MS ?? 10000);
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };

async function generate(parts: GeminiPart[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
      signal: AbortSignal.timeout(timeoutMs()),
    },
  );
  if (!res.ok) throw new Error(`GEMINI_HTTP_${res.status}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("GEMINI_BAD_JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

const CATEGORIES = ["shelter", "protection", "food", "wash", "health", "other"] as const;
const URGENCIES = ["low", "medium", "high", "critical"] as const;

function asCategory(value: unknown): TriageResult["category"] {
  return (CATEGORIES as readonly string[]).includes(String(value)) ? (value as TriageResult["category"]) : "other";
}

function asUrgency(value: unknown): TriageResult["urgency"] {
  return (URGENCIES as readonly string[]).includes(String(value)) ? (value as TriageResult["urgency"]) : "medium";
}

export async function intakeWithGemini(banglaText: string) {
  const raw = await generate([{ text: intakePrompt(banglaText) }]);
  const parsed = parseJsonObject(raw);
  const category = asCategory(parsed.category);
  return {
    englishSummary: String(parsed.englishSummary ?? "").trim() || "Summary unavailable.",
    category,
    urgency: asUrgency(parsed.urgency),
    nextContact: NEXT_CONTACT_BY_CATEGORY[category],
  };
}

export async function intakeAudioWithGemini(audioBase64: string, mimeType: string) {
  const raw = await generate([
    { text: intakeAudioPrompt },
    { inlineData: { mimeType, data: audioBase64 } },
  ]);
  const parsed = parseJsonObject(raw);
  const category = asCategory(parsed.category);
  return {
    transcript: String(parsed.transcript ?? "").trim(),
    englishSummary: String(parsed.englishSummary ?? "").trim() || "Summary unavailable.",
    category,
    urgency: asUrgency(parsed.urgency),
    nextContact: NEXT_CONTACT_BY_CATEGORY[category],
  };
}

export async function triageWithGemini(text: string): Promise<TriageResult> {
  const raw = await generate([{ text: triagePrompt(text) }]);
  const parsed = parseJsonObject(raw);
  const category = asCategory(parsed.category);
  return { category, urgency: asUrgency(parsed.urgency), nextContact: NEXT_CONTACT_BY_CATEGORY[category] };
}

export async function anonymizeCleanupWithGemini(redactedText: string): Promise<string> {
  return (await generate([{ text: anonymizeCleanupPrompt(redactedText) }])).trim();
}

export async function followUpWithGemini(summary: string): Promise<string> {
  return (await generate([{ text: followUpPrompt(summary) }])).trim();
}
