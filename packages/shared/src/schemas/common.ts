import { z } from "zod";
export const paginationSchema = z.object({ page: z.number().default(1), limit: z.number().default(20) });
export const errorSchema = z.object({ error: z.object({ message: z.string(), code: z.string() }) });
