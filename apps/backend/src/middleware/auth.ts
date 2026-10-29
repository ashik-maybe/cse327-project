import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "../utils/session";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "volunteer" | "team_lead";
};

export async function getAuthenticatedUser(cookieValue: string | undefined): Promise<AuthenticatedUser | null> {
  const userId = verifySession(cookieValue);
  if (!userId) return null;
  const [user] = await dbClient.select().from(users).where(eq(users.id, userId)).limit(1);
  return user
    ? ({ id: user.id, name: user.name, email: user.email, role: user.role } as AuthenticatedUser)
    : null;
}
