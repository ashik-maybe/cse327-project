import { and, count, desc, eq } from "drizzle-orm";
import { dbClient } from "../db/client";
import { safetyReports } from "../db/schema";

type User = { id: string; role: string };

// Omit the stored original text entirely for team leads (lead sees anonymized only).
// Volunteers keep originalDescription only on their own reports with storeOriginal=true.
type SafetyReportRow = typeof safetyReports.$inferSelect;
type SafetyReportView = Omit<SafetyReportRow, "originalDescription" | "storeOriginal"> &
  Partial<Pick<SafetyReportRow, "originalDescription" | "storeOriginal">>;

function toView(record: SafetyReportRow, user: User): SafetyReportView {
  const isLead = user.role === "team_lead";
  if (isLead || !record.storeOriginal || record.createdBy !== user.id) {
    const { originalDescription: _originalDescription, storeOriginal: _storeOriginal, ...view } = record;
    return view;
  }
  return record;
}

export async function listSafetyReports(filters: { status?: string; urgency?: string; page?: number; limit?: number }, user: User) {
  const { status, urgency, page = 1, limit = 20 } = filters;
  const visibility = user.role === "team_lead" ? undefined : eq(safetyReports.createdBy, user.id);
  const where = and(
    visibility,
    status ? eq(safetyReports.status, status as typeof safetyReports.status.enumValues[number]) : undefined,
    urgency ? eq(safetyReports.urgency, urgency as typeof safetyReports.urgency.enumValues[number]) : undefined
  );
  const [{ total }] = await dbClient.select({ total: count() }).from(safetyReports).where(where);
  const rows = await dbClient.select().from(safetyReports).where(where).orderBy(desc(safetyReports.createdAt)).limit(limit).offset((page - 1) * limit);
  const items = rows.map((row) => toView(row, user));
  return { items, total: Number(total), page, limit };
}

export async function createSafetyReport(input: typeof safetyReports.$inferInsert, user: User) {
  const [record] = await dbClient.insert(safetyReports).values({ ...input, createdBy: user.id }).returning();
  return record ? toView(record, user) : null;
}

export async function getSafetyReport(id: string, user: User) {
  const [record] = await dbClient.select().from(safetyReports).where(eq(safetyReports.id, id)).limit(1);
  if (!record) return null;
  if (user.role !== "team_lead" && record.createdBy !== user.id) throw new Error("FORBIDDEN");
  return toView(record, user);
}

export async function updateSafetyReportStatus(id: string, status: "new" | "acknowledged" | "resolved", user: User) {
  if (user.role !== "team_lead") throw new Error("FORBIDDEN");
  const [record] = await dbClient.update(safetyReports).set({ status }).where(eq(safetyReports.id, id)).returning();
  return record ? toView(record, user) : null;
}
