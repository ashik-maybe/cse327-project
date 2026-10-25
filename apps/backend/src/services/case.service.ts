import { dbClient } from "../db/client";
import { cases, caseNotes, users } from "../db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import * as schemas from "@campbridge/shared";

export async function listCases(filters: { 
  scope?: "mine" | "team"; 
  status?: string; 
  urgency?: string; 
  category?: string; 
  assignedTo?: string; 
  createdBy?: string; 
  q?: string; 
  page?: number; 
  limit?: number;
  userId?: string;
  userRole?: string;
}) {
  const { scope, status, urgency, category, assignedTo, createdBy, q, page = 1, limit = 20, userId, userRole } = filters;
  const conditions = [];

  if (status) conditions.push(eq(cases.status, status));
  if (urgency) conditions.push(eq(cases.urgency, urgency));
  if (category) conditions.push(eq(cases.category, category));
  if (assignedTo) conditions.push(eq(cases.assignedTo, assignedTo));
  if (createdBy) conditions.push(eq(cases.createdBy, createdBy));

  // Role-based visibility
  if (scope === "mine" || userRole === "volunteer") {
    conditions.push(or(eq(cases.createdBy, userId!), eq(cases.assignedTo, userId!)));
  }
  // scope === "team" or team_lead sees all

  if (q) {
    conditions.push(or(ilike(cases.summary, `%${q}%`), ilike(cases.description, `%${q}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await dbClient.select({ count: cases.id }).from(cases).where(where).execute();
  const items = await dbClient
    .select()
    .from(cases)
    .where(where)
    .orderBy(cases.createdAt.desc())
    .limit(limit)
    .offset((page - 1) * limit);

  return { items, total: totalResult.rowCount ?? items.length };
}

export async function createCase(input: schemas.CreateCaseInput, userId: string) {
  if (input.clientId) {
    const existing = await dbClient
      .select()
      .from(cases)
      .where(and(eq(cases.clientId, input.clientId), eq(cases.createdBy, userId)))
      .limit(1);
    if (existing.length > 0) {
      return { case: existing[0], created: false };
    }
  }

  const [caseRecord] = await dbClient
    .insert(cases)
    .values({
      summary: input.summary,
      description: input.description,
      category: input.category,
      urgency: input.urgency,
      status: input.status ?? "new",
      locationName: input.locationName,
      latitude: input.latitude,
      longitude: input.longitude,
      nextContact: input.nextContact,
      source: input.source ?? "manual",
      aiAssisted: input.aiAssisted ?? false,
      aiSource: input.aiSource,
      clientId: input.clientId,
      createdBy: userId,
    })
    .returning();

  return { case: caseRecord, created: true };
}

export async function getCase(id: string) {
  const [c] = await dbClient.select().from(cases).where(eq(cases.id, id)).limit(1);
  return c ?? null;
}

export async function updateCase(id: string, input: Partial<schemas.CreateCaseInput>) {
  const [updated] = await dbClient
    .update(cases)
    .set(input)
    .where(eq(cases.id, id))
    .returning();
  return updated ?? null;
}

export async function addCaseNote(caseId: string, userId: string, note: string) {
  const [noteRecord] = await dbClient
    .insert(caseNotes)
    .values({ caseId, userId, note })
    .returning();
  return noteRecord ?? null;
}

export async function listCaseNotes(caseId: string) {
  return await dbClient
    .select({ 
      note: caseNotes.note, 
      createdAt: caseNotes.createdAt, 
      userName: users.name,
      userId: caseNotes.userId 
    })
    .from(caseNotes)
    .leftJoin(users, eq(caseNotes.userId, users.id))
    .where(eq(caseNotes.caseId, caseId))
    .orderBy(caseNotes.createdAt.desc());
}