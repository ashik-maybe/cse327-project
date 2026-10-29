import { z } from "zod";
export const createServicePointSchema = z.object({ name: z.string(), category: z.string(), area: z.string().optional(), description: z.string().optional(), contactNote: z.string().optional(), latitude: z.number(), longitude: z.number(), openingHours: z.string().optional() });
