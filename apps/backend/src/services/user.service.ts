import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export function listVolunteers() {
  return dbClient
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "volunteer"))
    .orderBy(users.name);
}
