import { dbClient } from "../db/client";
import { servicePoints } from "../db/schema";
import { eq } from "drizzle-orm";

export function listServicePoints() {
  return dbClient.select().from(servicePoints).where(eq(servicePoints.isActive, true));
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
