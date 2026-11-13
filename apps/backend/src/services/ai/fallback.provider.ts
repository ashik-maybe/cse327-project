export type TriageResult = {
  category: "shelter" | "protection" | "food" | "wash" | "health" | "other";
  urgency: "low" | "medium" | "high" | "critical";
  nextContact: string;
};

export const NEXT_CONTACT_BY_CATEGORY: Record<TriageResult["category"], string> = {
  shelter: "Shelter Focal Point",
  health: "Health Post",
  food: "Food Distribution Point",
  wash: "WASH Point",
  protection: "Protection Desk",
  other: "Camp CFM Desk",
};

const CATEGORY_KEYWORDS: Array<[TriageResult["category"], string[]]> = [
  ["shelter", ["shelter", "tent", "roof", "house", "housing", "ঘর", "ছাউনি", "আশ্রয়", "বাড়ি", "বাসস্থান", "ছাদ"]],
  ["health", ["health", "sick", "ill", "injury", "injured", "medical", "doctor", "hospital", "fever", "pain", "medicine", "অসুস্থ", "ডাক্তার", "চিকিৎসা", "হাসপাতাল", "জ্বর", "ব্যথা", "ওষুধ", "রক্তক্ষরণ", "অচেতন"]],
  ["food", ["food", "ration", "rice", "hungry", "hunger", "খাবার", "ক্ষুধা", "অনাহার", "চাল", "ডাল", "রেশন"]],
  ["wash", ["wash", "water", "toilet", "latrine", "hygiene", "sanitation", "bathing", "পানি", "টয়লেট", "স্নান", "পরিষ্কার", "স্যানিটেশন"]],
  ["protection", ["protection", "threat", "harassment", "violence", "abuse", "assault", "beaten", "হুমকি", "হয়রানি", "সহিংস", "মারধর", "নিরাপত্তা", "সুরক্ষা", "নির্যাতন"]],
];

const CRITICAL_KEYWORDS = ["critical", "emergency", "dying", "dead", "fire", "unconscious", "blood", "hemorrhage", "আগুন", "রক্তক্ষরণ", "অচেতন", "মৃত্যু", "মারা"];
const HIGH_KEYWORDS = ["urgent", "severe", "serious", "bleeding", "জরুরি", "তীব্র", "গুরুতর"];
const LOW_KEYWORDS = ["minor", "routine", "low", "সামান্য", "সাধারণ", "কম"];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function detectCategory(text: string): TriageResult["category"] {
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (containsAny(text, keywords)) return category;
  }
  return "other";
}

export function detectUrgency(text: string): TriageResult["urgency"] {
  if (containsAny(text, CRITICAL_KEYWORDS)) return "critical";
  if (containsAny(text, HIGH_KEYWORDS)) return "high";
  if (containsAny(text, LOW_KEYWORDS)) return "low";
  return "medium";
}

export function nextContactFor(category: TriageResult["category"]): string {
  return NEXT_CONTACT_BY_CATEGORY[category];
}

export function triageWithFallback(text: string): TriageResult {
  const category = detectCategory(text);
  return { category, urgency: detectUrgency(text), nextContact: nextContactFor(category) };
}

function excerpt(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export function summarizeWithFallback(text: string, category: TriageResult["category"]): string {
  return `Reported ${category} need (auto-summary, translation unavailable without AI key). Original note: ${excerpt(text)}`;
}

export function followUpWithFallback(summary: string): string {
  const triage = triageWithFallback(summary);
  if (triage.urgency === "critical") {
    return `Escalate immediately to the ${triage.nextContact} and re-check the case within 2 hours.`;
  }
  if (triage.urgency === "high") {
    return `Refer to the ${triage.nextContact} today and follow up within 24 hours.`;
  }
  return `Check in with the household within 48 hours and confirm the referral to the ${triage.nextContact} was received.`;
}
