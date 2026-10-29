import { and, count, eq, gt, isNull, lt } from "drizzle-orm";
import { dbClient } from "../db/client";
import { cases, safetyReports } from "../db/schema";

const staleSince = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export async function getDashboardSummary(user: { id: string; role: string }) {
  const visibility = user.role === "team_lead" ? undefined : eq(cases.createdBy, user.id);
  const highUrgency = await dbClient
    .select({ total: count() })
    .from(cases)
    .where(and(visibility, eq(cases.urgency, "high")));
  const stale = await dbClient
    .select({ total: count() })
    .from(cases)
    .where(and(visibility, lt(cases.createdAt, staleSince()), eq(cases.status, "new")));
  const recent = await dbClient.select({ total: count() }).from(cases).where(visibility);

  if (user.role === "team_lead") {
    const unassigned = await dbClient.select({ total: count() }).from(cases).where(and(isNull(cases.assignedTo), visibility));
    const recentSafety = await dbClient.select({ total: count() }).from(safetyReports).where(gt(safetyReports.createdAt, staleSince()));
    return {
      role: "team_lead" as const,
      highUrgencyCount: Number(highUrgency[0]?.total ?? 0),
      staleCaseCount: Number(stale[0]?.total ?? 0),
      unassignedCount: Number(unassigned[0]?.total ?? 0),
      recentSafetyCount: Number(recentSafety[0]?.total ?? 0),
    };
  }

  const assigned = await dbClient.select({ total: count() }).from(cases).where(eq(cases.assignedTo, user.id));
  return {
    role: "volunteer" as const,
    highUrgencyCount: Number(highUrgency[0]?.total ?? 0),
    staleCaseCount: Number(stale[0]?.total ?? 0),
    assignedToMeCount: Number(assigned[0]?.total ?? 0),
    recentCaseCount: Number(recent[0]?.total ?? 0),
  };
}
