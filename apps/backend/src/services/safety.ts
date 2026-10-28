import { dbClient } from "../db/client"
import { safetyReports } from "../db/schema"
import { eq } from "drizzle-orm"

export type SafetyReport = {
  id: string
  incidentType: string
  anonymizedDescription: string
  originalDescription?: string
  storeOriginal: boolean
  approximateLocation?: string
  urgency: string
  status: string
  createdAt: string
  createdBy?: string
}

export async function listSafetyReports(filters: { 
  status?: string 
  urgency?: string 
  createdBy?: string 
  page?: number 
  limit?: number 
}) {
  const { status, urgency, createdBy, page = 1, limit = 20 } = filters
  const conditions = []
  if (status) conditions.push(eq(safetyReports.status, status))
  if (urgency) conditions.push(eq(safetyReports.urgency, urgency))
  if (createdBy) conditions.push(eq(safetyReports.createdBy, createdBy))

  const total = await dbClient.select({ count: safetyReports.id }).from(safetyReports).where(eq(safetyReports.id, undefined)).execute()
  const items = await dbClient
    .select()
    .from(safetyReports)
    .orderBy(safetyReports.createdAt.desc())
    .limit(limit)
    .offset((page - 1) * limit)
    .execute()

  return { items, total: items.length }
}

export async function createSafetyReport(input: {
  incidentType: string
  anonymizedDescription: string
  originalDescription?: string
  storeOriginal: boolean
  approximateLocation?: string
  urgency: string
}) {
  return await dbClient
    .insert(safetyReports)
    .values({
      incidentType: input.incidentType,
      anonymizedDescription: input.anonymizedDescription,
      originalDescription: input.originalDescription,
      storeOriginal: input.storeOriginal,
      approximateLocation: input.approximateLocation,
      urgency: input.urgency,
      status: "new",
    })
    .returning()
}

export async function getSafetyReport(id: string) {
  const [report] = await dbClient
    .select()
    .from(safetyReports)
    .where(eq(safetyReports.id, id))
    .limit(1)
  return report ?? null
}

export async function updateSafetyReportStatus(id: string, status: string) {
  return await dbClient
    .update(safetyReports)
    .set({ status })
    .where(eq(safetyReports.id, id))
    .returning()
}