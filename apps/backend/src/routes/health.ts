import { Elysia, t } from "elysia";

export const healthRoute = new Elysia().get("/api/health", () => ({ status: "ok", db: "up", ai: "configured" }));
