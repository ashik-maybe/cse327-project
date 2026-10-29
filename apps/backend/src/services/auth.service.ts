import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export function hash(p: string) { return bcrypt.hashSync(p, 10); }
export function compare(p: string, h: string) { return bcrypt.compareSync(p, h); }

export const register = async (body: any) => {
  const [user] = await dbClient.insert(users).values({
    name: body.name, email: body.email, passwordHash: hash(body.password), role: body.role ?? "volunteer"
  }).returning();
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const login = async (email: string, password: string, cookie: any) => {
  const [row] = await dbClient.select().from(users).where(eq(users.email, email));
  if (!row || !compare(password, row.passwordHash)) throw new Error("INVALID_CREDENTIALS");
  cookie.set({ name: "campbridge_session", value: row.id, httpOnly: true, maxAge: 86400, path: "/" });
  return { user: { id: row.id, name: row.name, email: row.email, role: row.role } };
};

export const me = async (cookieVal: string | undefined) => {
  if (!cookieVal) return null;
  const [row] = await dbClient.select().from(users).where(eq(users.id, cookieVal));
  return row ? { id: row.id, name: row.name, email: row.email, role: row.role } : null;
};
