import { z } from 'zod'; export const safetySchema = z.object({ id: z.string().optional() });
