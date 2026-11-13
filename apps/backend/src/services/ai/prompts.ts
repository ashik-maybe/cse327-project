export const intakePrompt = (banglaText: string) => `You are a humanitarian case worker assistant for a Rohingya refugee camp in Bangladesh.
Translate the following Bangla case note into English and triage it.
Respond with ONLY a JSON object (no markdown fences) with keys:
"englishSummary" (string, 1-2 sentences), "category" (one of: shelter, protection, food, wash, health, other),
"urgency" (one of: low, medium, high, critical).

Bangla note:
${banglaText}`;

export const intakeAudioPrompt = `You are a humanitarian case worker assistant for a Rohingya refugee camp in Bangladesh.
Listen to the attached Bangla audio case note, transcribe it, translate it into English and triage it.
Respond with ONLY a JSON object (no markdown fences) with keys:
"transcript" (string, original Bangla transcription), "englishSummary" (string, 1-2 sentences),
"category" (one of: shelter, protection, food, wash, health, other),
"urgency" (one of: low, medium, high, critical).`;

export const triagePrompt = (text: string) => `You are a humanitarian case worker assistant for a Rohingya refugee camp in Bangladesh.
Triage the following case note. Respond with ONLY a JSON object (no markdown fences) with keys:
"category" (one of: shelter, protection, food, wash, health, other),
"urgency" (one of: low, medium, high, critical).

Case note:
${text}`;

export const anonymizeCleanupPrompt = (redactedText: string) => `You are a privacy assistant. The following text was already redacted with regex (replacements are marked [REDACTED]).
Remove any remaining personally identifiable information (names, phone numbers, addresses, ID numbers, exact locations) while preserving the humanitarian meaning.
Respond with ONLY the cleaned text, nothing else.

Text:
${redactedText}`;

export const followUpPrompt = (summary: string) => `You are a humanitarian case worker assistant for a Rohingya refugee camp in Bangladesh.
Given the case summary below, write one short follow-up suggestion (max 2 sentences) for the field volunteer: what to check next and when.
Respond with ONLY the suggestion text.

Case summary:
${summary}`;
