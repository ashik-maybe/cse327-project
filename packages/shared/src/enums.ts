export const ROLES = {
  volunteer: "volunteer",
  team_lead: "team_lead",
} as const;

export const CASE_CATEGORIES = {
  shelter: "shelter",
  protection: "protection",
  food: "food",
  wash: "wash",
  health: "health",
  other: "other",
} as const;

export const CASE_URGENCIES = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export const CASE_STATUSES = {
  new: "new",
  in_progress: "in_progress",
  referred: "referred",
  resolved: "resolved",
} as const;

export const CASE_SOURCES = {
  manual: "manual",
  voice: "voice",
} as const;

export const SAFETY_TYPES = {
  threat: "threat",
  harassment: "harassment",
  violence: "violence",
  suspicious_activity: "suspicious_activity",
  other: "other",
} as const;

export const SAFETY_STATUSES = {
  new: "new",
  acknowledged: "acknowledged",
  resolved: "resolved",
} as const;

export const SERVICE_CATEGORIES = {
  cfm_desk: "cfm_desk",
  health_post: "health_post",
  shelter_focal_point: "shelter_focal_point",
  wash_point: "wash_point",
  food_distribution: "food_distribution",
  protection_desk: "protection_desk",
} as const;

export const AI_PROVIDERS = {
  gemini: "gemini",
  fallback: "fallback",
  regex: "regex",
  regex_plus_gemini: "regex+gemini",
  sample: "sample",
} as const;
