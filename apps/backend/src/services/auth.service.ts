import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "../utils/session";

export function hash(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function compare(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}

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

export const login = async (email: string, password: string, setCookie: (name: string, value: string, options?: Record<string, unknown>) => void) => {
  const [row] = await dbClient.select().from(users).where(eq(users.email, email));
  if (!row || !compare(password, row.passwordHash)) throw new Error("INVALID_CREDENTIALS");
  setCookie("campbridge_session", createSession(row.id), {
    httpOnly: true,
    maxAge: 86400,
    path: "/",
    sameSite: "lax",
  });
  return { user: { id: row.id, name: row.name, email: row.email, role: row.role } };
};

export const me = async (userId: string | undefined) => {
  if (!userId) return null;
  const [row] = await dbClient.select().from(users).where(eq(users.id, userId));
  return row ? { id: row.id, name: row.name, email: row.email, role: row.role } : null;
};
