import { dbClient } from "../db/client";
import { servicePoints } from "../db/schema";
import { and, eq } from "drizzle-orm";

type ListFilters = {
  category?: string;
  includeInactive?: boolean;
};

export function listServicePoints(filters: ListFilters = {}) {
  const conditions = [
    filters.includeInactive ? undefined : eq(servicePoints.isActive, true),
    filters.category ? eq(servicePoints.category, filters.category) : undefined,
  ].filter(Boolean);
  const query = dbClient.select().from(servicePoints);
  const scoped = conditions.length ? query.where(and(...conditions)) : query;
  return scoped.orderBy(servicePoints.name);
}

export function createServicePoint(input: typeof servicePoints.$inferInsert) {
  return dbClient.insert(servicePoints).values(input).returning();
}

export function updateServicePoint(id: string, input: Partial<typeof servicePoints.$inferInsert>) {
  return dbClient.update(servicePoints).set(input).where(eq(servicePoints.id, id)).returning();
}

export function deleteServicePoint(id: string) {
  return dbClient.update(servicePoints).set({ isActive: false }).where(eq(servicePoints.id, id)).returning();
}
