import { z } from "zod";
export const caseIntakeSchema = z.object({ banglaText: z.string().optional(), audioBase64: z.string().optional(), audioMimeType: z.string().optional(), includeTriage: z.boolean().optional(), sampleId: z.string().optional() });
export const anonymizeSchema = z.object({ text: z.string().min(1), useGemini: z.boolean().optional() });
export const triageSchema = z.object({ text: z.string().min(1) });
export const followUpSchema = z.object({ caseId: z.string().optional(), summary: z.string().min(1).optional(), category: z.string().optional() });
