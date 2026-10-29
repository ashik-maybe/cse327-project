import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { dbClient } from "../db/client";

export const healthRoute = new Elysia().get("/api/health", async () => {
  await dbClient.execute(sql`select 1`);
  return { status: "ok", db: "up", ai: process.env.GEMINI_API_KEY ? "configured" : "fallback" };
});
