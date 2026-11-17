import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "../utils/session";
import { compare, hash } from "../utils/password";

export { hash, compare };

export const register = async (body: {
  name: string;
  email: string;
  password: string;
  role?: "volunteer" | "team_lead";
}) => {
  const [user] = await dbClient
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash: hash(body.password),
      role: body.role ?? "volunteer",
    })
    .returning();
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const login = async (email: string, password: string) => {
  const [row] = await dbClient.select().from(users).where(eq(users.email, email));
  if (!row || !compare(password, row.passwordHash)) throw new Error("INVALID_CREDENTIALS");
  return {
    session: createSession(row.id),
    user: { id: row.id, name: row.name, email: row.email, role: row.role },
  };
};

export const me = async (userId: string | undefined) => {
  if (!userId) return null;
  const [row] = await dbClient.select().from(users).where(eq(users.id, userId));
  return row ? { id: row.id, name: row.name, email: row.email, role: row.role } : null;
};
