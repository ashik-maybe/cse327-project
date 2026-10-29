import { z } from "zod";
export const caseIntakeSchema = z.object({ banglaText: z.string().optional(), includeTriage: z.boolean().optional(), sampleId: z.string().optional() });
export const anonymizeSchema = z.object({ text: z.string() });
export const triageSchema = z.object({ text: z.string() });
export const followUpSchema = z.object({ caseId: z.string(), summary: z.string() });
