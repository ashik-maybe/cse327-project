import { z } from "zod";
import { SERVICE_CATEGORIES } from "../enums";

export const serviceCategorySchema = z.enum(
  Object.keys(SERVICE_CATEGORIES) as [keyof typeof SERVICE_CATEGORIES, ...(keyof typeof SERVICE_CATEGORIES)[]]
);

export const createServicePointSchema = z.object({
  name: z.string().min(1),
  category: serviceCategorySchema,
  area: z.string().optional(),
  description: z.string().optional(),
  contactNote: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  openingHours: z.string().optional(),
});

export const updateServicePointSchema = createServicePointSchema.partial().extend({
  isActive: z.boolean().optional(),
});
