import { z } from "zod";
export const createSafetySchema = z.object({ clientId: z.string().optional(), incidentType: z.enum(["threat","harassment","other"]), anonymizedDescription: z.string(), originalDescription: z.string().optional(), storeOriginal: z.boolean().optional(), approximateLocation: z.string().optional(), urgency: z.enum(["low","medium","high","critical"]), occurredAt: z.string().optional() });
export const updateSafetySchema = z.object({ status: z.enum(["new","acknowledged","resolved"]) });
