import { dbClient } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authMiddleware = async (req: any) => {
  const cookieVal = req.cookie?.campbridge_session?.value;
  if (!cookieVal) return { user: null };
  const [user] = await dbClient.select().from(users).where(eq(users.id, cookieVal)).limit(1);
  return { user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null };
};
