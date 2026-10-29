import { dbClient } from "../db/client";
import { cases, caseNotes, users } from "../db/schema";
import { and, count, eq, ilike, or, desc } from "drizzle-orm";
import type { CreateCaseInput, UpdateCaseInput } from "@campbridge/shared";

type User = { id: string; role: string };

function accessCondition(user: User) {
  return user.role === "team_lead" ? undefined : or(eq(cases.createdBy, user.id), eq(cases.assignedTo, user.id));
}

export async function listCases(
  filters: {
    status?: string;
    urgency?: string;
    category?: string;
    assignedTo?: string;
    createdBy?: string;
    q?: string;
    page?: number;
    limit?: number;
  },
  user: User
) {
  const { status, urgency, category, assignedTo, createdBy, q, page = 1, limit = 20 } = filters;
  const conditions = [
    accessCondition(user),
    status ? eq(cases.status, status as typeof cases.status.enumValues[number]) : undefined,
    urgency ? eq(cases.urgency, urgency as typeof cases.urgency.enumValues[number]) : undefined,
    category ? eq(cases.category, category as typeof cases.category.enumValues[number]) : undefined,
    assignedTo ? eq(cases.assignedTo, assignedTo) : undefined,
    createdBy ? eq(cases.createdBy, createdBy) : undefined,
    q ? or(ilike(cases.summary, `%${q}%`), ilike(cases.description, `%${q}%`)) : undefined,
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;
  const [{ total }] = await dbClient.select({ total: count() }).from(cases).where(where);
  const items = await dbClient
    .select()
    .from(cases)
    .where(where)
    .orderBy(desc(cases.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return { items, total: Number(total), page, limit };
}

export async function createCase(input: CreateCaseInput, userId: string) {
  if (input.clientId) {
    const [existing] = await dbClient
      .select()
      .from(cases)
      .where(and(eq(cases.clientId, input.clientId), eq(cases.createdBy, userId)))
      .limit(1);
    if (existing) return { case: existing, created: false };
  }
  const [caseRecord] = await dbClient
    .insert(cases)
    .values({
      ...input,
      createdBy: userId,
      clientCreatedAt: input.clientCreatedAt ? new Date(input.clientCreatedAt) : undefined,
    })
    .returning();
  return { case: caseRecord, created: true };
}

export async function getCase(id: string, user: User) {
  const [record] = await dbClient.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (!record) return null;
  if (user.role !== "team_lead" && record.createdBy !== user.id && record.assignedTo !== user.id) {
    throw new Error("FORBIDDEN");
  }
  return record;
}

export async function updateCase(id: string, input: UpdateCaseInput, user: User) {
  const record = await getCase(id, user);
  if (!record) return null;
  if (user.role !== "team_lead" && record.createdBy !== user.id) throw new Error("FORBIDDEN");
  const [updated] = await dbClient
    .update(cases)
    .set({
      ...input,
      clientCreatedAt: input.clientCreatedAt ? new Date(input.clientCreatedAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, id))
    .returning();
  return updated ?? null;
}

export async function addCaseNote(caseId: string, user: User, note: string) {
  await getCase(caseId, user);
  const [noteRecord] = await dbClient.insert(caseNotes).values({ caseId, userId: user.id, note }).returning();
  return noteRecord;
}

export async function listCaseNotes(caseId: string, user: User) {
  await getCase(caseId, user);
  return dbClient
    .select({ note: caseNotes.note, createdAt: caseNotes.createdAt, userName: users.name, userId: caseNotes.userId })
    .from(caseNotes)
    .leftJoin(users, eq(caseNotes.userId, users.id))
    .where(eq(caseNotes.caseId, caseId))
    .orderBy(desc(caseNotes.createdAt));
}
